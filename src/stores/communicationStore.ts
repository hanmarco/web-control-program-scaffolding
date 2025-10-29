import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CommunicationInterface, DeviceConfig } from '../interfaces/CommunicationInterface'

export const useCommunicationStore = defineStore('communication', () => {
  // State
  const connected = ref(false)
  const currentDevice = ref<string | null>(null)
  const deviceConfig = ref<DeviceConfig | null>(null)
  const communicationInterface = ref<CommunicationInterface | null>(null)
  const errorMessage = ref<string | null>(null)
  const isLoading = ref(false)

  // Getters
  const isConnected = computed(() => connected.value)
  const currentDeviceName = computed(() => currentDevice.value)
  const hasError = computed(() => errorMessage.value !== null)

  // Actions
  async function connect(config: DeviceConfig, commInterface: CommunicationInterface) {
    try {
      isLoading.value = true
      errorMessage.value = null
      
      await commInterface.connect(config.devicePath)
      
      communicationInterface.value = commInterface
      deviceConfig.value = config
      currentDevice.value = config.devicePath
      connected.value = true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Connection failed'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function disconnect() {
    try {
      isLoading.value = true
      errorMessage.value = null
      
      if (communicationInterface.value) {
        await communicationInterface.value.disconnect()
      }
      
      communicationInterface.value = null
      deviceConfig.value = null
      currentDevice.value = null
      connected.value = false
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Disconnect failed'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function readRegister(slaveAddr: number, regAddr: number, length = 1): Promise<Uint8Array> {
    if (!communicationInterface.value || !connected.value) {
      throw new Error('Not connected to device')
    }

    try {
      isLoading.value = true
      errorMessage.value = null
      return await communicationInterface.value.read(slaveAddr, regAddr, length)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Read failed'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function writeRegister(slaveAddr: number, regAddr: number, data: Uint8Array): Promise<void> {
    if (!communicationInterface.value || !connected.value) {
      throw new Error('Not connected to device')
    }

    try {
      isLoading.value = true
      errorMessage.value = null
      await communicationInterface.value.write(slaveAddr, regAddr, data)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Write failed'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    errorMessage.value = null
  }

  return {
    // State
    connected,
    currentDevice,
    deviceConfig,
    errorMessage,
    isLoading,
    // Getters
    isConnected,
    currentDeviceName,
    hasError,
    // Actions
    connect,
    disconnect,
    readRegister,
    writeRegister,
    clearError,
  }
})
