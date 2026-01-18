import { useEffect, useRef } from 'react';

function Oscilloscope({ analyser, isRunning, filteredData, filterEnabled }) {
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
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const draw = () => {
      // Get time-domain data (waveform)
      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      drawGrid(ctx, canvas.width, canvas.height);

      // Draw original waveform (dimmed if filtering is enabled)
      if (filterEnabled) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      } else {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 255, 170)';
      }
      
      drawWaveform(ctx, dataArray, canvas.width, canvas.height, bufferLength);

      // Draw filtered waveform if available
      if (filterEnabled && filteredData) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(255, 100, 255)'; // Magenta for filtered signal
        drawWaveform(ctx, filteredData, canvas.width, canvas.height, bufferLength);
      }

      // Draw zero-crossing line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Legend
      if (filterEnabled && filteredData) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText('Original Signal', 10, 20);
        ctx.fillStyle = 'rgb(255, 100, 255)';
        ctx.fillText('Filtered Signal', 10, 35);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isRunning, filteredData, filterEnabled]);

  const drawWaveform = (ctx, data, width, height, bufferLength) => {
    ctx.beginPath();
    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = (data[i] - 128) / 128.0;
      const y = (v * height / 2) + (height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  };

  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let i = 0; i <= 8; i++) {
      const y = (height / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  return (
    <div className="oscilloscope">
      <div className="scope-label">
        Time Domain - Waveform
        {filterEnabled && <span className="badge">FILTERING ACTIVE</span>}
      </div>
      <canvas ref={canvasRef} className="scope-canvas" />
      {!isRunning && (
        <div className="overlay">
          <p>Click "Start Microphone" to begin visualization</p>
        </div>
      )}
    </div>
  );
}

export default Oscilloscope;