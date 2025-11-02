<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-developer-board</v-icon>
            General Panel
            <v-spacer></v-spacer>
            <v-chip size="small" :color="commStore.isConnected ? 'success' : 'grey'">
              {{ commStore.isConnected ? 'Connected' : 'Disconnected' }}
            </v-chip>
          </v-card-title>
          <v-card-subtitle>
            Direct register access for 0x00 - 0xFFFF range
          </v-card-subtitle>
          
          <v-card-text>
            <v-row>
              <!-- Address Input -->
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="addressInput"
                  label="Register Address"
                  placeholder="0x00"
                  variant="outlined"
                  density="compact"
                  :rules="[validateAddress]"
                  @keyup.enter="readRegister"
                ></v-text-field>
              </v-col>
              
              <!-- Current Value Display -->
              <v-col cols="12" md="3">
                <v-text-field
                  :model-value="hexValue"
                  label="Current Value (HEX)"
                  variant="outlined"
                  density="compact"
                  readonly
                ></v-text-field>
              </v-col>
              
              <!-- Decimal Value -->
              <v-col cols="12" md="2">
                <v-text-field
                  :model-value="currentValue.toString()"
                  label="DEC"
                  variant="outlined"
                  density="compact"
                  readonly
                ></v-text-field>
              </v-col>
              
              <!-- Action Buttons -->
              <v-col cols="12" md="4" class="d-flex align-center ga-2">
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="readRegister"
                  :loading="isReading"
                  :disabled="!commStore.isConnected || !isValidAddress"
                >
                  <v-icon start>mdi-download</v-icon>
                  Read
                </v-btn>
                <v-btn
                  color="success"
                  variant="outlined"
                  @click="writeRegister"
                  :loading="isWriting"
                  :disabled="!commStore.isConnected || !isValidAddress"
                >
                  <v-icon start>mdi-upload</v-icon>
                  Write
                </v-btn>
              </v-col>
            </v-row>
            
            <!-- Bit Controls -->
            <v-divider class="my-4"></v-divider>
            
            <div class="bit-controls">
              <div class="d-flex align-center mb-3">
                <v-icon class="mr-2">mdi-binary</v-icon>
                <span class="text-h6">Bit Control</span>
              </div>
              
              <!-- Bit Labels -->
              <div class="d-flex align-center mb-2">
                <span class="text-caption bit-label">Bit:</span>
                <span v-for="bit in 8" :key="bit" class="text-caption bit-number">{{ 7 - (bit - 1) }}</span>
              </div>
              
              <!-- Bit Checkboxes -->
              <div class="d-flex align-center mb-3">
                <span class="text-caption bit-label">Val:</span>
                <v-checkbox
                  v-for="bit in 8"
                  :key="bit"
                  v-model="bitValues[7 - (bit - 1)]"
                  :disabled="!commStore.isConnected || !isValidAddress"
                  density="compact"
                  hide-details
                  class="bit-checkbox"
                  @change="onBitChange"
                ></v-checkbox>
              </div>
              
              <!-- Quick Actions -->
              <div class="d-flex align-center ga-2">
                <v-btn
                  size="small"
                  variant="outlined"
                  @click="setAllBits(true)"
                  :disabled="!commStore.isConnected || !isValidAddress"
                >
                  Set All
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  @click="setAllBits(false)"
                  :disabled="!commStore.isConnected || !isValidAddress"
                >
                  Clear All
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  @click="toggleAllBits"
                  :disabled="!commStore.isConnected || !isValidAddress"
                >
                  Toggle All
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Status Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCommunicationStore } from '../stores/communicationStore'
import { useRegisterStore } from '../stores/registerStore'

const commStore = useCommunicationStore()
const registerStore = useRegisterStore()

// State
const addressInput = ref('0x00')
const currentValue = ref(0)
const bitValues = ref<boolean[]>(new Array(8).fill(false))
const isReading = ref(false)
const isWriting = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Computed values
const hexValue = computed(() => {
  return `0x${currentValue.value.toString(16).toUpperCase().padStart(2, '0')}`
})

const isValidAddress = computed(() => {
  const address = parseAddress(addressInput.value)
  return address !== null && address >= 0 && address <= 0xFFFF
})

// Address validation
function validateAddress(value: string) {
  const address = parseAddress(value)
  if (address === null) {
    return 'Invalid address format (use 0x00-0xFFFF)'
  }
  if (address < 0 || address > 0xFFFF) {
    return 'Address must be between 0x00 and 0xFFFF'
  }
  return true
}

function parseAddress(input: string): number | null {
  try {
    // Remove whitespace and convert to lowercase
    const cleaned = input.trim().toLowerCase()
    
    // Handle hex format (0x prefix)
    if (cleaned.startsWith('0x')) {
      return parseInt(cleaned, 16)
    }
    
    // Handle decimal format
    const decimal = parseInt(cleaned, 10)
    if (!isNaN(decimal)) {
      return decimal
    }
    
    return null
  } catch {
    return null
  }
}

// Watch bit values and update current value
watch(
  bitValues,
  (newBits) => {
    currentValue.value = newBits.reduce((value, bit, index) => {
      return bit ? value | (1 << index) : value
    }, 0)
  },
  { deep: true }
)

// Update bits from current value
function updateBitsFromValue(value: number) {
  for (let i = 0; i < 8; i++) {
    bitValues.value[i] = !!(value & (1 << i))
  }
}

// Bit manipulation functions
function onBitChange() {
  // Value is automatically updated via watcher
}

function setAllBits(value: boolean) {
  bitValues.value.fill(value)
}

function toggleAllBits() {
  bitValues.value = bitValues.value.map(bit => !bit)
}

// Register operations
async function readRegister() {
  if (!commStore.isConnected || !isValidAddress.value) return
  
  isReading.value = true
  const address = parseAddress(addressInput.value)!
  const addressHex = `0x${address.toString(16).toUpperCase().padStart(2, '0')}`
  
  try {
    const slaveAddr = registerStore.defaultSlaveAddress
    const result = await commStore.readRegister(slaveAddr, address, 1)
    const value = result[0]
    
    if (value !== undefined) {
      currentValue.value = value
      updateBitsFromValue(value)
      
      // Update register store if this address exists in register map
      registerStore.updateRegisterValue(addressHex, value)
      
      // Add to global history
      addToGlobalHistory({
        type: 'read',
        address: addressHex,
        value: `0x${value.toString(16).toUpperCase().padStart(2, '0')}`,
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        source: 'general'
      })
      
      showMessage('Register read successfully', 'success')
    }
  } catch (error) {
    console.error('Failed to read register:', error)
    
    addToGlobalHistory({
      type: 'read',
      address: addressHex,
      value: 'ERROR',
      success: false,
      timestamp: new Date().toLocaleTimeString(),
      source: 'general'
    })
    
    showMessage('Failed to read register', 'error')
  } finally {
    isReading.value = false
  }
}

async function writeRegister() {
  if (!commStore.isConnected || !isValidAddress.value) return
  
  isWriting.value = true
  const address = parseAddress(addressInput.value)!
  const addressHex = `0x${address.toString(16).toUpperCase().padStart(2, '0')}`
  
  try {
    const slaveAddr = registerStore.defaultSlaveAddress
    const data = new Uint8Array([currentValue.value])
    
    await commStore.writeRegister(slaveAddr, address, data)
    
    // Update register store if this address exists in register map
    registerStore.updateRegisterValue(addressHex, currentValue.value)
    
    // Add to global history
    addToGlobalHistory({
      type: 'write',
      address: addressHex,
      value: `0x${currentValue.value.toString(16).toUpperCase().padStart(2, '0')}`,
      success: true,
      timestamp: new Date().toLocaleTimeString(),
      source: 'general'
    })
    
    showMessage('Register written successfully', 'success')
  } catch (error) {
    console.error('Failed to write register:', error)
    
    addToGlobalHistory({
      type: 'write',
      address: addressHex,
      value: 'ERROR',
      success: false,
      timestamp: new Date().toLocaleTimeString(),
      source: 'general'
    })
    
    showMessage('Failed to write register', 'error')
  } finally {
    isWriting.value = false
  }
}

// Utility functions
function showMessage(message: string, color: string) {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

function addToGlobalHistory(operation: any) {
  // Add to global history via window object
  if ((window as any).addOperationHistory) {
    (window as any).addOperationHistory(operation)
  }
}

// Watch for register store changes to keep values in sync
watch(
  () => {
    if (isValidAddress.value) {
      const address = parseAddress(addressInput.value)!
      const addressHex = `0x${address.toString(16).toUpperCase().padStart(2, '0')}`
      return registerStore.getRegisterValue(addressHex)
    }
    return undefined
  },
  (newValue) => {
    if (newValue !== undefined && newValue !== currentValue.value) {
      currentValue.value = newValue
      updateBitsFromValue(newValue)
    }
  }
)
</script>

<style scoped>
.bit-controls {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
}

.bit-label {
  width: 40px;
  display: inline-block;
  font-weight: 500;
}

.bit-number {
  width: 32px;
  text-align: center;
  font-weight: 500;
}

.bit-checkbox {
  width: 32px;
  margin-right: 0;
  flex: 0 0 auto;
}

.bit-checkbox :deep(.v-input__control) {
  min-height: 24px;
  justify-content: center;
}

.operation-history {
  max-height: 300px;
  overflow-y: auto;
}

.operation-timeline {
  max-height: 200px;
  overflow-y: auto;
}
</style>