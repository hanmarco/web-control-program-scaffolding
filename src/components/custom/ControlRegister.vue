<template>
  <v-card :class="register.mode === 'compact' ? 'compact-control' : 'debug-control'">
    <!-- Debug Mode - Full Featured -->
    <template v-if="register.mode !== 'compact'">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ register.name }}</span>
        <v-chip size="small" variant="outlined">{{ register.address }}</v-chip>
      </v-card-title>
      <v-card-subtitle v-if="register.description">
        {{ register.description }}
      </v-card-subtitle>
      <v-card-text>
        <div class="d-flex align-center mb-4">
          <span class="text-caption mr-2">HEX:</span>
          <v-chip color="primary" variant="outlined">{{ hexValue }}</v-chip>
          <span class="text-caption ml-4 mr-2">DEC:</span>
          <v-chip color="secondary" variant="outlined">{{ currentValue }}</v-chip>
        </div>
        
        <div class="bit-controls">
          <div class="d-flex align-center mb-2">
            <span class="text-caption mr-4">Bit:</span>
            <span v-for="bit in 8" :key="bit" class="text-caption mr-3">{{ 7 - (bit - 1) }}</span>
          </div>
          <div class="d-flex align-center">
            <span class="text-caption mr-2">Val:</span>
            <v-checkbox
              v-for="bit in 8"
              :key="bit"
              v-model="bitValues[7 - (bit - 1)]"
              :disabled="!register.writable"
              density="compact"
              hide-details
              class="bit-checkbox"
            ></v-checkbox>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          @click="readRegister"
          :loading="isReading"
        >
          <v-icon start>mdi-download</v-icon>
          Read
        </v-btn>
        <v-btn
          v-if="register.writable"
          color="success"
          variant="outlined"
          size="small"
          @click="writeRegister"
          :loading="isWriting"
        >
          <v-icon start>mdi-upload</v-icon>
          Write
        </v-btn>
        <v-spacer></v-spacer>
        <v-chip size="small" :color="lastOpStatus === 'success' ? 'success' : lastOpStatus === 'error' ? 'error' : 'default'">
          {{ lastOpTime ? `Last: ${lastOpTime}` : 'No operations' }}
        </v-chip>
      </v-card-actions>
    </template>

    <!-- Compact Mode - Minimal UI -->
    <template v-else>
      <div class="compact-header d-flex align-center justify-space-between pa-2">
        <span class="text-body-2 font-weight-medium">{{ register.name }}</span>
        <span class="text-caption">{{ register.address }}</span>
      </div>
      <div class="compact-content pa-2">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center">
            <span class="text-caption mr-2">{{ hexValue }}</span>
            <v-checkbox
              v-for="bit in 8"
              :key="bit"
              v-model="bitValues[7 - (bit - 1)]"
              :disabled="!register.writable"
              density="compact"
              hide-details
              class="compact-checkbox"
            ></v-checkbox>
          </div>
          <div class="d-flex ga-1">
            <v-btn
              size="x-small"
              variant="outlined"
              color="primary"
              @click="readRegister"
              :loading="isReading"
            >
              R
            </v-btn>
            <v-btn
              v-if="register.writable"
              size="x-small"
              variant="outlined"
              color="success"
              @click="writeRegister"
              :loading="isWriting"
            >
              W
            </v-btn>
          </div>
        </div>
      </div>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCommunicationStore } from '../../stores/communicationStore'
import { useRegisterStore } from '../../stores/registerStore'
import type { ControlRegister } from '../../types/RegisterTypes'

const props = defineProps<{
  register: ControlRegister
}>()

const commStore = useCommunicationStore()
const registerStore = useRegisterStore()

const isReading = ref(false)
const isWriting = ref(false)
const lastOpStatus = ref<'success' | 'error' | null>(null)
const lastOpTime = ref<string | null>(null)

// Individual bit values (0-7, where 7 is MSB)
const bitValues = ref<boolean[]>(new Array(8).fill(false))

// Computed current value from bits
const currentValue = computed(() => {
  return bitValues.value.reduce((value, bit, index) => {
    return bit ? value | (1 << index) : value
  }, 0)
})

// Computed hex representation
const hexValue = computed(() => {
  return `0x${currentValue.value.toString(16).toUpperCase().padStart(2, '0')}`
})

// Watch for external register value changes
watch(
  () => registerStore.getRegisterValue(props.register.address),
  (newValue) => {
    if (newValue !== undefined) {
      updateBitsFromValue(newValue)
    }
  },
  { immediate: true }
)

// Update bit array from numeric value
function updateBitsFromValue(value: number) {
  for (let i = 0; i < 8; i++) {
    bitValues.value[i] = !!(value & (1 << i))
  }
}

// Read register value
async function readRegister() {
  if (!commStore.isConnected) return
  
  isReading.value = true
  lastOpStatus.value = null
  
  try {
    const slaveAddr = registerStore.defaultSlaveAddress
    const regAddr = parseInt(props.register.address, 16)
    const result = await commStore.readRegister(slaveAddr, regAddr, 1)
    const value = result[0] // Get first byte
    
    // Update register store cache
    if (value !== undefined) {
      registerStore.updateRegisterValue(props.register.address, value)
      updateBitsFromValue(value)
      
      // Add to global history
      addToGlobalHistory({
        type: 'read',
        address: props.register.address,
        value: `0x${value.toString(16).toUpperCase().padStart(2, '0')}`,
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        source: 'dashboard'
      })
    }
    lastOpStatus.value = 'success'
    lastOpTime.value = new Date().toLocaleTimeString()
  } catch (error) {
    console.error('Failed to read register:', error)
    
    // Add error to global history
    addToGlobalHistory({
      type: 'read',
      address: props.register.address,
      value: 'ERROR',
      success: false,
      timestamp: new Date().toLocaleTimeString(),
      source: 'dashboard'
    })
    
    lastOpStatus.value = 'error'
    lastOpTime.value = 'Error'
  } finally {
    isReading.value = false
  }
}

// Write register value
async function writeRegister() {
  if (!commStore.isConnected || !props.register.writable) return
  
  isWriting.value = true
  lastOpStatus.value = null
  
  try {
    const slaveAddr = registerStore.defaultSlaveAddress
    const regAddr = parseInt(props.register.address, 16)
    const data = new Uint8Array([currentValue.value])
    
    await commStore.writeRegister(slaveAddr, regAddr, data)
    
    // Update register store cache
    registerStore.updateRegisterValue(props.register.address, currentValue.value)
    
    // Add to global history
    addToGlobalHistory({
      type: 'write',
      address: props.register.address,
      value: `0x${currentValue.value.toString(16).toUpperCase().padStart(2, '0')}`,
      success: true,
      timestamp: new Date().toLocaleTimeString(),
      source: 'dashboard'
    })
    
    lastOpStatus.value = 'success'
    lastOpTime.value = new Date().toLocaleTimeString()
  } catch (error) {
    console.error('Failed to write register:', error)
    
    // Add error to global history
    addToGlobalHistory({
      type: 'write',
      address: props.register.address,
      value: 'ERROR',
      success: false,
      timestamp: new Date().toLocaleTimeString(),
      source: 'dashboard'
    })
    
    lastOpStatus.value = 'error'
    lastOpTime.value = 'Error'
  } finally {
    isWriting.value = false
  }
}

// Utility function to add operations to global history
function addToGlobalHistory(operation: any) {
  if ((window as any).addOperationHistory) {
    (window as any).addOperationHistory(operation)
  }
}

// Initialize with current register value
const initialValue = registerStore.getRegisterValue(props.register.address)
if (initialValue !== undefined) {
  updateBitsFromValue(initialValue)
}
</script>

<style scoped>
.bit-controls {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  padding: 8px;
}

.bit-checkbox {
  margin-right: 8px;
  flex: 0 0 auto;
}

.bit-checkbox :deep(.v-input__control) {
  min-height: 24px;
}

.compact-control {
  border-radius: 4px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
}

.compact-header {
  background-color: rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.compact-checkbox {
  margin-right: 4px;
  flex: 0 0 auto;
}

.compact-checkbox :deep(.v-input__control) {
  min-height: 16px;
}

.compact-checkbox :deep(.v-checkbox .v-selection-control__wrapper) {
  height: 16px;
  width: 16px;
}

.debug-control {
  min-height: 200px;
}

.compact-control {
  min-height: auto;
}
</style>