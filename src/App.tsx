
import React, { useState } from 'react';

export default function App() {
  const [device, setDevice] = useState<any>(null);
  const [codes, setCodes] = useState<string[]>([]);

  const connectBluetooth = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'OBDII' }],
        optionalServices: ['generic_access']
      });
      setDevice(device);
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      alert('Could not connect to ELM327. Make sure Bluetooth is enabled.');
    }
  };

  const readCodes = async () => {
    if (!device) {
      alert('Please connect to ELM327 first');
      return;
    }
    // This is where we would implement the actual OBD-II protocol
    // communication with the ELM327 device
  };

  return (
    <div className="app">
      <h1>OBD Code Reader</h1>
      <button onClick={connectBluetooth}>
        {device ? 'Connected' : 'Connect to ELM327'}
      </button>
      <button onClick={readCodes} disabled={!device}>
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
