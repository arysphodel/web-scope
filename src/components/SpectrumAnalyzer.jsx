import { useEffect, useRef } from 'react';

function SpectrumAnalyzer({ analyser, isRunning, sampleRate }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!analyser || !isRunning) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount; // fftSize / 2
    const dataArray = new Uint8Array(bufferLength);

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Calculate frequency resolution
    const nyquistFreq = sampleRate / 2;
    const frequencyResolution = nyquistFreq / bufferLength;

    const draw = () => {
      // Get frequency-domain data (FFT magnitude)
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency grid
      drawFrequencyGrid(ctx, canvas.width, canvas.height, nyquistFreq);

      // Draw spectrum bars
      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Normalize amplitude (0-255 to 0-1)
        const amplitude = dataArray[i] / 255.0;
        const barHeight = amplitude * canvas.height;

        // Color based on amplitude (green to yellow to red)
        const hue = 120 - (amplitude * 120); // 120 (green) to 0 (red)
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

        // Draw bar from bottom
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth;
      }

      // Draw frequency labels
      drawFrequencyLabels(ctx, canvas.width, canvas.height, nyquistFreq);

      // Continue animation loop
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isRunning, sampleRate]);

  const drawFrequencyGrid = (ctx, width, height, nyquistFreq) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Vertical grid lines (frequency divisions)
    const freqMarkers = [0, 1000, 2000, 5000, 10000, 15000, 20000];
    
    freqMarkers.forEach(freq => {
      if (freq <= nyquistFreq) {
        const x = (freq / nyquistFreq) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    });

    // Horizontal grid lines (amplitude divisions)
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawFrequencyLabels = (ctx, width, height, nyquistFreq) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';

    const freqMarkers = [
      { freq: 0, label: '0' },
      { freq: 1000, label: '1k' },
      { freq: 2000, label: '2k' },
      { freq: 5000, label: '5k' },
      { freq: 10000, label: '10k' },
      { freq: 15000, label: '15k' },
      { freq: 20000, label: '20k' }
    ];

    freqMarkers.forEach(({ freq, label }) => {
      if (freq <= nyquistFreq) {
        const x = (freq / nyquistFreq) * width;
        ctx.fillText(label + ' Hz', x, height - 5);
      }
    });

    // Amplitude labels (dB scale reference)
    ctx.textAlign = 'left';
    ctx.fillText('0 dB', 5, 15);
    ctx.fillText('-20 dB', 5, height / 4 + 5);
    ctx.fillText('-40 dB', 5, height / 2 + 5);
    ctx.fillText('-60 dB', 5, (3 * height / 4) + 5);
  };

  return (
    <div className="spectrum">
      <div className="scope-label">Frequency Domain - FFT Spectrum</div>
      <canvas ref={canvasRef} className="scope-canvas" />
      {!isRunning && (
        <div className="overlay">
          <p>Start microphone to see frequency spectrum</p>
        </div>
      )}
    </div>
  );
}

export default SpectrumAnalyzer;