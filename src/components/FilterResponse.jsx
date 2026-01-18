import { useEffect, useRef } from 'react';

function FilterResponse({ 
  filterEnabled, 
  filterType, 
  cutoffFreq, 
  cutoffFreq2,
  filterOrder, 
  sampleRate 
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!filterEnabled) {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    drawFilterResponse(ctx, canvas.width, canvas.height);
  }, [filterEnabled, filterType, cutoffFreq, cutoffFreq2, filterOrder, sampleRate]);

  const drawFilterResponse = (ctx, width, height) => {
    // Clear canvas
    ctx.fillStyle = 'rgb(20, 20, 30)';
    ctx.fillRect(0, 0, width, height);

    const nyquistFreq = sampleRate / 2;
    const numPoints = 500;

    // Calculate frequency response
    const frequencies = [];
    const magnitudes = [];

    for (let i = 0; i < numPoints; i++) {
      const freq = (i / numPoints) * nyquistFreq;
      frequencies.push(freq);

      let magnitude = 0;

      if (filterType === 'lowpass') {
        magnitude = calculateLowpassResponse(freq, cutoffFreq, filterOrder);
      } else if (filterType === 'highpass') {
        magnitude = calculateHighpassResponse(freq, cutoffFreq, filterOrder);
      } else if (filterType === 'bandpass') {
        magnitude = calculateBandpassResponse(freq, cutoffFreq, cutoffFreq2, filterOrder);
      }

      magnitudes.push(magnitude);
    }

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw frequency response curve
    ctx.strokeStyle = '#ff64ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    magnitudes.forEach((mag, i) => {
      const x = (i / numPoints) * width;
      const y = height - (mag * height);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw -3dB line (half-power point)
    const halfPower = 0.707; // -3dB
    const halfPowerY = height - (halfPower * height);
    
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, halfPowerY);
    ctx.lineTo(width, halfPowerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw cutoff frequency marker(s)
    drawCutoffMarkers(ctx, width, height, nyquistFreq);

    // Draw labels
    drawLabels(ctx, width, height, nyquistFreq);
  };

  const calculateLowpassResponse = (freq, fc, order) => {
    // Butterworth lowpass magnitude response
    // |H(f)| = 1 / sqrt(1 + (f/fc)^(2N))
    const ratio = freq / fc;
    const magnitude = 1.0 / Math.sqrt(1 + Math.pow(ratio, 2 * order));
    return magnitude;
  };

  const calculateHighpassResponse = (freq, fc, order) => {
    // Butterworth highpass magnitude response
    // |H(f)| = 1 / sqrt(1 + (fc/f)^(2N))
    if (freq === 0) return 0;
    const ratio = fc / freq;
    const magnitude = 1.0 / Math.sqrt(1 + Math.pow(ratio, 2 * order));
    return magnitude;
  };

  const calculateBandpassResponse = (freq, fc1, fc2, order) => {
    // Bandpass is combination of highpass and lowpass
    const hp = calculateHighpassResponse(freq, fc1, order);
    const lp = calculateLowpassResponse(freq, fc2, order);
    return hp * lp;
  };

  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Horizontal lines (magnitude)
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines (frequency)
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  const drawCutoffMarkers = (ctx, width, height, nyquistFreq) => {
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (filterType === 'bandpass') {
      // Draw both cutoff frequencies
      const x1 = (cutoffFreq / nyquistFreq) * width;
      const x2 = (cutoffFreq2 / nyquistFreq) * width;

      [x1, x2].forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      });
    } else {
      // Draw single cutoff frequency
      const x = (cutoffFreq / nyquistFreq) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  const drawLabels = (ctx, width, height, nyquistFreq) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '11px monospace';

    // Y-axis labels (magnitude/dB)
    ctx.textAlign = 'left';
    ctx.fillText('0 dB', 5, 15);
    ctx.fillText('-3 dB', 5, height - (0.707 * height) + 5);
    ctx.fillText('-20 dB', 5, height - (0.1 * height) + 5);
    ctx.fillText('-∞ dB', 5, height - 5);

    // X-axis labels (frequency)
    ctx.textAlign = 'center';
    const freqLabels = [0, nyquistFreq / 4, nyquistFreq / 2, (3 * nyquistFreq) / 4, nyquistFreq];
    
    freqLabels.forEach((freq, i) => {
      const x = (i / 4) * width;
      const label = freq >= 1000 ? `${(freq / 1000).toFixed(1)}k` : `${freq.toFixed(0)}`;
      ctx.fillText(label, x, height - 5);
    });

    // Filter info
    ctx.fillStyle = '#ff64ff';
    ctx.textAlign = 'right';
    ctx.font = '12px monospace';
    const orderSuffix = filterOrder === 2 ? 'nd' : filterOrder === 4 ? 'th' : 'th';
    ctx.fillText(`${filterOrder}${orderSuffix}-order ${filterType.toUpperCase()}`, width - 10, 20);
    ctx.fillText(`Rolloff: -${20 * filterOrder} dB/decade`, width - 10, 35);
  };

  return (
    <div className="filter-response">
      <div className="scope-label">
        Filter Frequency Response (Bode Plot)
      </div>
      <canvas ref={canvasRef} className="scope-canvas" />
      {!filterEnabled && (
        <div className="overlay">
          <p>Enable filtering to see frequency response</p>
        </div>
      )}
    </div>
  );
}

export default FilterResponse;