import { useEffect, useRef, useState } from 'react';

function Spectrogram({ analyser, isRunning, sampleRate }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const spectrogramData = useRef([]);
  const maxHistory = 150; // Keep last 150 frames (~2.5 seconds at 60 FPS)

  useEffect(() => {
    if (!analyser || !isRunning) {
      spectrogramData.current = [];
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const nyquistFreq = sampleRate / 2;

    const draw = () => {
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Add new frequency data to history
      spectrogramData.current.push([...dataArray]);

      // Keep only recent history
      if (spectrogramData.current.length > maxHistory) {
        spectrogramData.current.shift();
      }

      // Clear canvas
      ctx.fillStyle = 'rgb(10, 10, 20)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw spectrogram (waterfall)
      const sliceWidth = canvas.width / spectrogramData.current.length;
      const barHeight = canvas.height / bufferLength;

      spectrogramData.current.forEach((slice, timeIndex) => {
        const x = timeIndex * sliceWidth;

        slice.forEach((value, freqIndex) => {
          const amplitude = value / 255.0;
          const y = canvas.height - (freqIndex * barHeight);

          // Color mapping: blue (low) -> cyan -> yellow -> red (high)
          const color = getSpectrogramColor(amplitude);
          ctx.fillStyle = color;
          ctx.fillRect(x, y - barHeight, sliceWidth + 1, barHeight + 1);
        });
      });

      // Draw frequency labels
      drawFrequencyAxis(ctx, canvas.width, canvas.height, nyquistFreq);

      // Draw time axis
      drawTimeAxis(ctx, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isRunning, sampleRate]);

  const getSpectrogramColor = (amplitude) => {
    // Create a color gradient based on amplitude
    // 0.0 (silent) = dark blue
    // 0.5 (medium) = cyan/yellow
    // 1.0 (loud) = red

    if (amplitude < 0.1) {
      return `rgb(0, 0, ${Math.floor(amplitude * 500)})`;
    } else if (amplitude < 0.3) {
      const t = (amplitude - 0.1) / 0.2;
      const r = Math.floor(t * 100);
      const g = Math.floor(t * 150);
      const b = 50 + Math.floor(t * 150);
      return `rgb(${r}, ${g}, ${b})`;
    } else if (amplitude < 0.6) {
      const t = (amplitude - 0.3) / 0.3;
      const r = 100 + Math.floor(t * 155);
      const g = 150 + Math.floor(t * 105);
      const b = 200 - Math.floor(t * 100);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = (amplitude - 0.6) / 0.4;
      const r = 255;
      const g = 255 - Math.floor(t * 155);
      const b = 100 - Math.floor(t * 100);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const drawFrequencyAxis = (ctx, width, height, nyquistFreq) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    const freqMarkers = [0, 2000, 5000, 10000, 15000, 20000];

    freqMarkers.forEach(freq => {
      if (freq <= nyquistFreq) {
        const y = height - (freq / nyquistFreq) * height;
        ctx.fillText(`${freq / 1000}k`, width - 5, y + 4);

        // Draw gridline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width - 40, y);
        ctx.stroke();
      }
    });
  };

  const drawTimeAxis = (ctx, width, height) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('← Time (Older)', width / 4, height - 5);
    ctx.fillText('(Newer) →', (3 * width) / 4, height - 5);
  };

  return (
    <div className="spectrogram">
      <div className="scope-label">
        Time-Frequency Domain - Spectrogram (STFT)
      </div>
      <canvas ref={canvasRef} className="scope-canvas" />
      {!isRunning && (
        <div className="overlay">
          <p>Start microphone to see spectrogram</p>
        </div>
      )}
      <div className="color-scale">
        <div className="scale-label">Intensity:</div>
        <div className="gradient-bar"></div>
        <div className="scale-markers">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}

export default Spectrogram;