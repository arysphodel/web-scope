import { Filter, Wind, Sliders } from 'lucide-react';

function FilterControls({ 
  filterEnabled, 
  setFilterEnabled,
  cutoffFreq,
  setCutoffFreq,
  cutoffFreq2,
  setCutoffFreq2,
  filterType,
  setFilterType,
  windowType,
  setWindowType,
  filterOrder,
  setFilterOrder,
  sampleRate
}) {
  const nyquistFreq = sampleRate / 2;
  const maxCutoff = Math.floor(nyquistFreq * 0.9);

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
          <div className="control-row">
            <div className="control-group">
              <label>
                <Sliders size={16} />
                Filter Type
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="select-input"
                >
                  <option value="lowpass">Low-Pass Filter</option>
                  <option value="highpass">High-Pass Filter</option>
                  <option value="bandpass">Band-Pass Filter</option>
                </select>
              </label>
            </div>

            <div className="control-group">
              <label>
                Filter Order
                <select 
                  value={filterOrder}
                  onChange={(e) => setFilterOrder(Number(e.target.value))}
                  className="select-input"
                >
                  <option value="2">2nd Order (-40 dB/decade)</option>
                  <option value="4">4th Order (-80 dB/decade)</option>
                  <option value="6">6th Order (-120 dB/decade)</option>
                  <option value="8">8th Order (-160 dB/decade)</option>
                </select>
              </label>
            </div>
          </div>

          {filterType === 'bandpass' ? (
            <div className="control-row">
              <div className="control-group">
                <label>
                  Low Cutoff Frequency: {cutoffFreq} Hz
                  <input 
                    type="range"
                    min="100"
                    max={Math.min(cutoffFreq2 - 100, maxCutoff)}
                    step="50"
                    value={cutoffFreq}
                    onChange={(e) => setCutoffFreq(Number(e.target.value))}
                    className="slider"
                  />
                  <div className="range-labels">
                    <span>100 Hz</span>
                    <span>{cutoffFreq2 - 100} Hz</span>
                  </div>
                </label>
              </div>

              <div className="control-group">
                <label>
                  High Cutoff Frequency: {cutoffFreq2} Hz
                  <input 
                    type="range"
                    min={cutoffFreq + 100}
                    max={maxCutoff}
                    step="50"
                    value={cutoffFreq2}
                    onChange={(e) => setCutoffFreq2(Number(e.target.value))}
                    className="slider"
                  />
                  <div className="range-labels">
                    <span>{cutoffFreq + 100} Hz</span>
                    <span>{maxCutoff} Hz</span>
                  </div>
                </label>
              </div>
            </div>
          ) : (
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
          )}

          <div className="control-group">
            <label>
              <Wind size={16} />
              Window Function (Reduces Spectral Leakage)
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
            <div className="info-grid">
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
              {filterType === 'bandpass' && (
                <div className="info-item">
                  <span className="label">Bandwidth:</span>
                  <span className="value">{cutoffFreq2 - cutoffFreq} Hz</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FilterControls;