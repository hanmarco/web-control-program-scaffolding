/**
 * Abstract communication interface for hardware communication
 * Supports multiple protocols (I2C, Serial, SPI, etc.)
 */
export interface CommunicationInterface {
  /**
   * Connect to the specified device
   * @param device - Device identifier (e.g., port name, device path)
   */
  connect(device: string): Promise<void>;

  /**
   * Disconnect from the current device
   */
  disconnect(): Promise<void>;

  /**
   * Read data from a register
   * @param slaveAddr - Slave device address
   * @param regAddr - Register address
   * @param length - Number of bytes to read
   * @returns Buffer containing the read data
   */
  read(slaveAddr: number, regAddr: number, length: number): Promise<Uint8Array>;

  /**
   * Write data to a register
   * @param slaveAddr - Slave device address
   * @param regAddr - Register address
   * @param data - Data to write
   */
  write(slaveAddr: number, regAddr: number, data: Uint8Array): Promise<void>;

  /**
   * Check if the device is currently connected
   */
  isConnected(): boolean;

  /**
   * Get the device identifier
   */
  getDeviceInfo(): string;
}

/**
 * Communication protocol types
 */
export type CommunicationProtocol = 'I2C' | 'Serial' | 'SPI' | 'USB';

/**
 * Device configuration
 */
export interface DeviceConfig {
  protocol: CommunicationProtocol;
  devicePath: string;
  baudRate?: number; // For serial communication
  slaveAddress?: number; // Default slave address
}
