
export class OBDReader {
  private device: BluetoothDevice;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  constructor(device: BluetoothDevice) {
    this.device = device;
  }

  static async requestDevice(): Promise<BluetoothDevice> {
    if (!navigator.bluetooth) {
      throw new Error('Bluetooth is not supported in this browser');
    }

    // More permissive filters for different OBD adapters
    return navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: 'OBD' },
        { namePrefix: 'ELM' },
        { namePrefix: 'OBDII' },
        { services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }
      ],
      optionalServices: [
        '0000fff0-0000-1000-8000-00805f9b34fb',
        '0000fff1-0000-1000-8000-00805f9b34fb'
      ]
    });
  }

  async connect() {
    try {
      const server = await this.device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');
      
      // Try common OBD adapter service UUIDs
      let service;
      try {
        service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      } catch {
        service = await server.getPrimaryService('fff0');
      }
      
      try {
        this.characteristic = await service.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb');
      } catch {
        this.characteristic = await service.getCharacteristic('fff1');
      }
    } catch (error) {
      console.error('Connection error:', error);
      throw new Error('Failed to establish Bluetooth connection');
    }
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.characteristic) {
      throw new Error('Not connected to device');
    }
    
    const encoder = new TextEncoder();
    await this.characteristic.writeValue(encoder.encode(command + '\r'));
    
    const response = await this.characteristic.readValue();
    const decoder = new TextDecoder();
    return decoder.decode(response);
  }

  async getDiagnosticCodes(): Promise<string[]> {
    try {
      // Initialize connection
      await this.sendCommand('ATZ'); // Reset
      await this.sendCommand('ATE0'); // Echo off
      await this.sendCommand('ATL0'); // Linefeeds off
      await this.sendCommand('ATH0'); // Headers off
      await this.sendCommand('ATS0'); // Spaces off
      await this.sendCommand('ATSP0'); // Auto protocol

      const response = await this.sendCommand('03'); // Get DTCs
      return this.parseDTCs(response);
    } catch (error) {
      console.error('Error reading DTCs:', error);
      throw error;
    }
  }

  private parseDTCs(response: string): string[] {
    const codes: string[] = [];
    const data = response.replace(/\s/g, '');
    
    for (let i = 0; i < data.length; i += 4) {
      const code = data.substr(i, 4);
      if (code !== '0000') {
        const type = this.getDTCType(code[0]);
        codes.push(`${type}${code.substring(1)}`);
      }
    }
    
    return codes;
  }

  private getDTCType(firstChar: string): string {
    const types: { [key: string]: string } = {
      '0': 'P0', '1': 'P1', '2': 'P2', '3': 'P3',
      '4': 'C0', '5': 'C1', '6': 'C2', '7': 'C3',
      '8': 'B0', '9': 'B1', 'A': 'B2', 'B': 'B3',
      'C': 'U0', 'D': 'U1', 'E': 'U2', 'F': 'U3'
    };
    return types[firstChar] || 'P0';
  }
}
