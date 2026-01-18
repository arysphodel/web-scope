import { useState, useEffect, useRef } from 'react';
import Oscilloscope from './components/Oscilloscope';
import SpectrumAnalyzer from './components/SpectrumAnalyzer';
import Controls from './components/Controls';
import FilterControls from './components/FilterControls';
import './App.css';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [sampleRate, setSampleRate] = useState(44100);
  
  // Filter settings
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [cutoffFreq, setCutoffFreq] = useState(1000);
  const [filterType, setFilterType] = useState('lowpass');
  const [windowType, setWindowType] = useState('none');
  
  // For storing filtered data
  const [filteredData, setFilteredData] = useState(null);
  const processingIntervalRef = useRef(null);

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;
      
      source.connect(analyserNode);
      
      setAudioContext(ctx);
      setAnalyser(analyserNode);
      setSampleRate(ctx.sampleRate);
      setIsRunning(true);

      console.log(`Audio Context Started - Sample Rate: ${ctx.sampleRate} Hz`);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Please allow microphone access to use the oscilloscope');
    }
  };

  const stopMicrophone = () => {
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
      setAnalyser(null);
      setIsRunning(false);
      setFilteredData(null);
      
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
      
      console.log('Audio Context Stopped');
    }
  };

  // Send samples to backend for processing
  useEffect(() => {
    if (!filterEnabled || !analyser || !isRunning) {
      setFilteredData(null);
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
      return;
    }

    // Process every 100ms (10 times per second)
    processingIntervalRef.current = setInterval(async () => {
      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      // Convert Uint8Array to normalized float array (-1 to 1)
      const samples = Array.from(dataArray).map(val => (val - 128) / 128);

      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            samples: samples,
            sampleRate: sampleRate,
            cutoffFreq: cutoffFreq,
            filterType: filterType,
            windowType: windowType,
            filterOrder: 2
          })
        });

        const result = await response.json();
        
        if (result.success) {
          // Convert back to Uint8Array format (0-255)
          const filtered = new Uint8Array(
            result.filteredSamples.map(val => Math.round((val * 128) + 128))
          );
          setFilteredData(filtered);
        } else {
          console.error('Filter processing error:', result.error);
        }
      } catch (error) {
        console.error('Backend connection error:', error);
      }
    }, 100);

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [filterEnabled, analyser, isRunning, cutoffFreq, filterType, windowType, sampleRate]);

  return (
    <div className="app">
      <header className="header">
        <h1>Web-Scope</h1>
        <p className="subtitle">Real-Time Digital Signal Visualizer with Backend DSP</p>
        {sampleRate > 0 && (
          <div className="info">
            <span>Sample Rate (fs): {sampleRate} Hz</span>
            <span>Nyquist Frequency (fN): {sampleRate / 2} Hz</span>
            <span>FFT Resolution: {(sampleRate / 2048).toFixed(2)} Hz/bin</span>
          </div>
        )}
      </header>

      <main className="main">
        <Controls 
          isRunning={isRunning}
          onStart={startMicrophone}
          onStop={stopMicrophone}
        />
        
        <FilterControls 
          filterEnabled={filterEnabled}
          setFilterEnabled={setFilterEnabled}
          cutoffFreq={cutoffFreq}
          setCutoffFreq={setCutoffFreq}
          filterType={filterType}
          setFilterType={setFilterType}
          windowType={windowType}
          setWindowType={setWindowType}
          sampleRate={sampleRate}
        />
        
        <div className="visualizers">
          <Oscilloscope 
            analyser={analyser}
            isRunning={isRunning}
            filteredData={filteredData}
            filterEnabled={filterEnabled}
          />
          
          <SpectrumAnalyzer 
            analyser={analyser}
            isRunning={isRunning}
            sampleRate={sampleRate}
          />
        </div>
      </main>

      <footer className="footer">
        <p>EE Project by [Your Name] | Butterworth Filtering • FFT Analysis • Windowing Functions</p>
      </footer>
    </div>
  );
}

export default App;