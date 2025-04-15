
export class OBDReader {
  private device: BluetoothDevice;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  constructor(device: BluetoothDevice) {
    this.device = device;
  }

  async connect() {
    const server = await this.device.gatt?.connect();
    const service = await server?.getPrimaryService('fff0');
    this.characteristic = await service?.getCharacteristic('fff1');
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
