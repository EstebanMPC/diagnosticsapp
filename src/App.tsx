
import React, { useState } from 'react';
import { OBDReader } from './obd';
import './App.css';

export default function App() {
  const [reader, setReader] = useState<OBDReader | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const connectBluetooth = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'OBDII' }],
        optionalServices: ['fff0']
      });
      const newReader = new OBDReader(device);
      await newReader.connect();
      setReader(newReader);
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      alert('Could not connect to ELM327. Make sure Bluetooth is enabled.');
    }
  };

  const readCodes = async () => {
    if (!reader) {
      alert('Please connect to ELM327 first');
      return;
    }
    
    setLoading(true);
    try {
      const diagnosticCodes = await reader.getDiagnosticCodes();
      setCodes(diagnosticCodes);
    } catch (error) {
      console.error('Failed to read codes:', error);
      alert('Error reading diagnostic codes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>OBD Code Reader</h1>
      <button onClick={connectBluetooth}>
        {reader ? 'Connected' : 'Connect to ELM327'}
      </button>
      <button onClick={readCodes} disabled={!reader}>
        Read Codes
      </button>
      <div className="codes">
        {codes.map((code, index) => (
          <div key={index} className="code-item">
            {code}
          </div>
        ))}
      </div>
    </div>
  );
}
