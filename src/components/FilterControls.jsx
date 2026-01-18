import { Filter, Wind } from 'lucide-react';

function FilterControls({ 
  filterEnabled, 
  setFilterEnabled,
  cutoffFreq,
  setCutoffFreq,
  filterType,
  setFilterType,
  windowType,
  setWindowType,
  sampleRate
}) {
  const nyquistFreq = sampleRate / 2;
  const maxCutoff = Math.floor(nyquistFreq * 0.9); // 90% of Nyquist

  return (
    <div className="filter-controls">
      <div className="control-header">
        <h3>
          <Filter size={20} />
          Digital Signal Processing Controls
        </h3>
      </div>

      <div className="control-group">
        <label className="toggle-label">
          <input 
            type="checkbox" 
            checked={filterEnabled}
            onChange={(e) => setFilterEnabled(e.target.checked)}
          />
          <span>Enable Backend Filtering</span>
        </label>
      </div>

      {filterEnabled && (
        <>
          <div className="control-group">
            <label>
              Filter Type
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="select-input"
              >
                <option value="lowpass">Low-Pass Filter</option>
                <option value="highpass">High-Pass Filter</option>
              </select>
            </label>
          </div>

          <div className="control-group">
            <label>
              Cutoff Frequency: {cutoffFreq} Hz
              <input 
                type="range"
                min="100"
                max={maxCutoff}
                step="50"
                value={cutoffFreq}
                onChange={(e) => setCutoffFreq(Number(e.target.value))}
                className="slider"
              />
              <div className="range-labels">
                <span>100 Hz</span>
                <span>{maxCutoff} Hz</span>
              </div>
            </label>
          </div>

          <div className="control-group">
            <label>
              <Wind size={16} />
              Window Function
              <select 
                value={windowType}
                onChange={(e) => setWindowType(e.target.value)}
                className="select-input"
              >
                <option value="none">None (Rectangular)</option>
                <option value="hamming">Hamming Window</option>
                <option value="hanning">Hanning Window</option>
                <option value="blackman">Blackman Window</option>
              </select>
            </label>
          </div>

          <div className="filter-info">
            <div className="info-item">
              <span className="label">Sample Rate (fs):</span>
              <span className="value">{sampleRate} Hz</span>
            </div>
            <div className="info-item">
              <span className="label">Nyquist Freq (fN):</span>
              <span className="value">{nyquistFreq} Hz</span>
            </div>
            <div className="info-item">
              <span className="label">Normalized fc:</span>
              <span className="value">{(cutoffFreq / nyquistFreq).toFixed(3)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FilterControls;