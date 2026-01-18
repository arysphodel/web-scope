import { Mic, MicOff } from 'lucide-react';

function Controls({ isRunning, onStart, onStop }) {
  return (
    <div className="controls">
      {!isRunning ? (
        <button className="btn btn-start" onClick={onStart}>
          <Mic size={20} />
          Start Microphone
        </button>
      ) : (
        <button className="btn btn-stop" onClick={onStop}>
          <MicOff size={20} />
          Stop Microphone
        </button>
      )}
      
      <div className="status">
        <div className={`indicator ${isRunning ? 'active' : ''}`} />
        <span>{isRunning ? 'Recording' : 'Stopped'}</span>
      </div>
    </div>
  );
}

export default Controls;