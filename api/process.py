from http.server import BaseHTTPRequestHandler
import json
import numpy as np
from scipy import signal

class handler(BaseHTTPRequestHandler):
    """
    Vercel Serverless Function for Digital Signal Processing
    
    Performs:
    - Butterworth filtering (low-pass, high-pass)
    - Windowing functions (Hamming, Hanning, Blackman)
    - Returns filtered signal data
    """
    
    def do_POST(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Extract parameters
            samples = np.array(data.get('samples', []))
            sample_rate = data.get('sampleRate', 44100)
            cutoff_freq = data.get('cutoffFreq', 1000)
            filter_type = data.get('filterType', 'lowpass')
            window_type = data.get('windowType', 'none')
            filter_order = data.get('filterOrder', 2)
            
            # Validate input
            if len(samples) == 0:
                raise ValueError("No samples provided")
            
            # Apply windowing function if requested
            if window_type != 'none':
                samples = apply_window(samples, window_type)
            
            # Design and apply Butterworth filter
            filtered_samples = apply_butterworth_filter(
                samples, 
                cutoff_freq, 
                sample_rate, 
                filter_type,
                filter_order
            )
            
            # Prepare response
            response = {
                'success': True,
                'filteredSamples': filtered_samples.tolist(),
                'metadata': {
                    'sampleRate': sample_rate,
                    'cutoffFreq': cutoff_freq,
                    'filterType': filter_type,
                    'windowType': window_type,
                    'filterOrder': filter_order,
                    'nyquistFreq': sample_rate / 2
                }
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            error_response = {
                'success': False,
                'error': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


def apply_window(samples, window_type):
    """
    Apply windowing function to reduce spectral leakage
    
    Windows:
    - Hamming: w[n] = 0.54 - 0.46*cos(2πn/(N-1))
    - Hanning: w[n] = 0.5*(1 - cos(2πn/(N-1)))
    - Blackman: More complex, better sidelobe suppression
    """
    N = len(samples)
    
    if window_type == 'hamming':
        window = np.hamming(N)
    elif window_type == 'hanning':
        window = np.hanning(N)
    elif window_type == 'blackman':
        window = np.blackman(N)
    else:
        window = np.ones(N)  # Rectangular (no windowing)
    
    return samples * window


def apply_butterworth_filter(samples, cutoff, fs, btype='lowpass', order=2):
    """
    Apply Butterworth digital filter
    
    Transfer Function (analog):
    H(s) = ωc^N / (s^N + b_(N-1)*s^(N-1) + ... + b_1*s + ωc^N)
    
    Parameters:
    - cutoff: Cutoff frequency in Hz
    - fs: Sampling frequency in Hz
    - btype: 'lowpass' or 'highpass'
    - order: Filter order (2 = second-order, smoother rolloff with higher orders)
    
    Returns:
    - Filtered signal
    """
    # Normalize cutoff frequency (0 to 1, where 1 is Nyquist)
    nyquist = fs / 2
    normalized_cutoff = cutoff / nyquist
    
    # Ensure cutoff is valid
    if normalized_cutoff <= 0 or normalized_cutoff >= 1:
        raise ValueError(f"Cutoff frequency must be between 0 and {nyquist} Hz")
    
    # Design Butterworth filter
    # Returns numerator (b) and denominator (a) coefficients
    b, a = signal.butter(order, normalized_cutoff, btype=btype, analog=False)
    
    # Apply filter using direct form II transposed structure
    # This is more numerically stable than direct convolution
    filtered = signal.lfilter(b, a, samples)
    
    return filtered