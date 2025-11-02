import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RegisterMap, Register, RegisterValue } from '../types/RegisterTypes'
import { useCommunicationStore } from './communicationStore'

export const useRegisterStore = defineStore('register', () => {
  // State
  const registerMap = ref<RegisterMap | null>(null)
  const registerValues = ref<Map<string, RegisterValue>>(new Map())
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  // Getters
  const registers = computed(() => registerMap.value?.registers || [])
  const defaultSlaveAddress = computed(() => {
    if (!registerMap.value?.defaultSlaveAddress) return 0x50
    return parseInt(registerMap.value.defaultSlaveAddress, 16)
  })

  // Actions
  async function loadRegisterMap(map: RegisterMap) {
    try {
      isLoading.value = true
      errorMessage.value = null
      registerMap.value = map
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to load register map'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadRegisterMapFromFile(filePath: string) {
    try {
      isLoading.value = true
      errorMessage.value = null
      
      // In a real Tauri app, this would use the fs plugin
      // For now, we'll use fetch for JSON files
      const response = await fetch(filePath)
      const data = await response.json()
      registerMap.value = data
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to load register map file'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function getRegister(address: string): Register | undefined {
    return registers.value.find(reg => reg.address === address)
  }

  function getRegisterValue(address: string): number | undefined {
    return registerValues.value.get(address)?.value
  }

  function updateRegisterValue(address: string, value: number) {
    registerValues.value.set(address, {
      address,
      value,
      timestamp: Date.now()
    })
  }

  async function readRegisterValue(address: string, slaveAddr?: number): Promise<number> {
    const commStore = useCommunicationStore()
    const addr = slaveAddr || defaultSlaveAddress.value
    const regAddr = parseInt(address, 16)

    try {
      const data = await commStore.readRegister(addr, regAddr, 1)
      const value = data[0] ?? 0
      
      registerValues.value.set(address, {
        address,
        value,
        timestamp: Date.now(),
      })

      return value
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to read register'
      throw error
    }
  }

  async function writeRegisterValue(address: string, value: number, slaveAddr?: number): Promise<void> {
    const commStore = useCommunicationStore()
    const addr = slaveAddr || defaultSlaveAddress.value
    const regAddr = parseInt(address, 16)

    try {
      const data = new Uint8Array([value & 0xFF])
      await commStore.writeRegister(addr, regAddr, data)
      
      registerValues.value.set(address, {
        address,
        value: value & 0xFF,
        timestamp: Date.now(),
      })
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to write register'
      throw error
    }
  }

  function setBitValue(address: string, bitIndex: number, value: boolean): number {
    const currentValue = getRegisterValue(address) ?? 0
    if (value) {
      return currentValue | (1 << bitIndex)
    } else {
      return currentValue & ~(1 << bitIndex)
    }
  }

  function getBitValue(value: number, bitIndex: number): boolean {
    return ((value >> bitIndex) & 1) === 1
  }

  function extractBits(value: number, bits: number[]): number {
    let result = 0
    bits.forEach((bit, index) => {
      if (getBitValue(value, bit)) {
        result |= (1 << index)
      }
    })
    return result
  }

  function setBits(currentValue: number, bits: number[], newValue: number): number {
    let result = currentValue
    bits.forEach((bit, index) => {
      const bitValue = (newValue >> index) & 1
      if (bitValue) {
        result |= (1 << bit)
      } else {
        result &= ~(1 << bit)
      }
    })
    return result
  }

  function clearError() {
    errorMessage.value = null
  }

  return {
    // State
    registerMap,
    registerValues,
    isLoading,
    errorMessage,
    // Getters
    registers,
    defaultSlaveAddress,
    // Actions
    loadRegisterMap,
    loadRegisterMapFromFile,
    getRegister,
    getRegisterValue,
    updateRegisterValue,
    readRegisterValue,
    writeRegisterValue,
    setBitValue,
    getBitValue,
    extractBits,
    setBits,
    clearError,
  }
})
