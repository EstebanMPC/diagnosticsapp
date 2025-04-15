
import React, { useState } from 'react';
import { OBDReader } from './obd';
import './App.css';

export default function App() {
  const [reader, setReader] = useState<OBDReader | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectBluetooth = async () => {
    setError(null);
    try {
      if (!navigator.bluetooth) {
        setError('Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
        return;
      }

      const device = await OBDReader.requestDevice();
      const newReader = new OBDReader(device);
      await newReader.connect();
      setReader(newReader);
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to connect to OBD device. Make sure it is powered on and in range.');
      }
    }
  };

  const readCodes = async () => {
    if (!reader) {
      setError('Please connect to OBD device first');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const diagnosticCodes = await reader.getDiagnosticCodes();
      setCodes(diagnosticCodes);
    } catch (error) {
      console.error('Failed to read codes:', error);
      setError('Error reading diagnostic codes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>OBD Code Reader</h1>
      {error && <div className="error">{error}</div>}
      <button onClick={connectBluetooth} disabled={loading}>
        {reader ? 'Connected' : 'Connect to OBD Device'}
      </button>
      <button onClick={readCodes} disabled={!reader || loading}>
        {loading ? 'Reading...' : 'Read Codes'}
      </button>
      <div className="codes">
        {codes.length > 0 ? (
          codes.map((code, index) => (
            <div key={index} className="code-item">
              {code}
            </div>
          ))
        ) : (
          <p>{reader ? 'No codes found' : 'Connect to view codes'}</p>
        )}
      </div>
    </div>
  );
}
