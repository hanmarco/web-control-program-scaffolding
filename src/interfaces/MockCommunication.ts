import type { CommunicationInterface } from '../interfaces/CommunicationInterface'

/**
 * Mock communication implementation for development and testing
 * Simulates I2C communication with virtual registers
 */
export class MockCommunication implements CommunicationInterface {
  private connected = false
  private deviceName = ''
  private registers = new Map<string, number>()

  async connect(device: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.deviceName = device
        this.connected = true
        console.log(`Mock: Connected to ${device}`)
        resolve()
      }, 500)
    })
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = false
        this.deviceName = ''
        console.log('Mock: Disconnected')
        resolve()
      }, 300)
    })
  }

  async read(slaveAddr: number, regAddr: number, length: number): Promise<Uint8Array> {
    if (!this.connected) {
      throw new Error('Not connected')
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const data = new Uint8Array(length)
        for (let i = 0; i < length; i++) {
          const key = `${slaveAddr}-${regAddr + i}`
          data[i] = this.registers.get(key) || 0
        }
        console.log(`Mock: Read from slave 0x${slaveAddr.toString(16)} reg 0x${regAddr.toString(16)}:`, data)
        resolve(data)
      }, 200)
    })
  }

  async write(slaveAddr: number, regAddr: number, data: Uint8Array): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected')
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        for (let i = 0; i < data.length; i++) {
          const key = `${slaveAddr}-${regAddr + i}`
          const val = data[i]
          if (val !== undefined) {
            this.registers.set(key, val)
          }
        }
        console.log(`Mock: Write to slave 0x${slaveAddr.toString(16)} reg 0x${regAddr.toString(16)}:`, data)
        resolve()
      }, 200)
    })
  }

  isConnected(): boolean {
    return this.connected
  }

  getDeviceInfo(): string {
    return this.deviceName
  }
}
