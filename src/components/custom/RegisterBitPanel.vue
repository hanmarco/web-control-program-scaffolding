<template>
  <div class="register-bit-panel">
    <v-card class="pa-1">
      <v-row class="align-center ga-4 flex-nowrap">
        <v-text-field
          v-model="addressInput"
          variant="outlined"
          density="compact"
          hide-details
          :rules="[validateAddress]"
          placeholder="ADDR"
          class="narrow-field"
          @keyup.enter="readRegister"
        ></v-text-field>

        <v-text-field
          :model-value="hexValue"
          variant="outlined"
          density="compact"
          hide-details
          readonly
          placeholder="VAL"
          class="narrow-field"
        ></v-text-field>

        <div class="bit-checkboxes">
          <v-checkbox
            v-for="bit in 8"
            :key="bit"
            v-model="bitValues[7 - (bit - 1)]"
            :disabled="!commStore.isConnected || !isValidAddress"
            density="compact"
            hide-details
            class="bit-checkbox"
          ></v-checkbox>
        </div>

        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          @click="readRegister"
          :loading="isReading"
          :disabled="!commStore.isConnected || !isValidAddress"
        >
          R
        </v-btn>

        <v-btn
          size="small"
          variant="tonal"
          color="success"
          @click="writeRegister"
          :loading="isWriting"
          :disabled="!commStore.isConnected || !isValidAddress"
        >
          W
        </v-btn>
      </v-row>
    </v-card>

    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCommunicationStore } from '../../stores/communicationStore'
import { useRegisterStore } from '../../stores/registerStore'

const props = defineProps<{
  source?: string
}>()

const commStore = useCommunicationStore()
const registerStore = useRegisterStore()

const panelSource = computed(() => props.source ?? 'general')

const addressInput = ref('0x00')
const currentValue = ref(0)
const bitValues = ref<boolean[]>(new Array(8).fill(false))
const isReading = ref(false)
const isWriting = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const hexValue = computed(() => `0x${currentValue.value.toString(16).toUpperCase().padStart(2, '0')}`)

const isValidAddress = computed(() => {
  const address = parseAddress(addressInput.value)
  return address !== null && address >= 0 && address <= 0xFFFF
})

watch(
  addressInput,
  (value) => {
    const formatted = formatAddressInput(value)
    if (formatted !== value) {
      addressInput.value = formatted
    }
  },
  { flush: 'post' }
)

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
    const cleaned = input.trim().toLowerCase()

    if (cleaned.startsWith('0x')) {
      return parseInt(cleaned, 16)
    }

    const decimal = parseInt(cleaned, 10)
    if (!isNaN(decimal)) {
      return decimal
    }

    return null
  } catch {
    return null
  }
}

watch(
  bitValues,
  (newBits) => {
    currentValue.value = newBits.reduce((value, bit, index) => {
      return bit ? value | (1 << index) : value
    }, 0)
  },
  { deep: true }
)

function updateBitsFromValue(value: number) {
  for (let i = 0; i < 8; i++) {
    bitValues.value[i] = !!(value & (1 << i))
  }
}

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
      registerStore.updateRegisterValue(addressHex, value)
      addToGlobalHistory({
        type: 'read',
        address: addressHex,
        value: `0x${value.toString(16).toUpperCase().padStart(2, '0')}`,
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        source: panelSource.value,
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
      source: panelSource.value,
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
    registerStore.updateRegisterValue(addressHex, currentValue.value)
    addToGlobalHistory({
      type: 'write',
      address: addressHex,
      value: `0x${currentValue.value.toString(16).toUpperCase().padStart(2, '0')}`,
      success: true,
      timestamp: new Date().toLocaleTimeString(),
      source: panelSource.value,
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
      source: panelSource.value,
    })
    showMessage('Failed to write register', 'error')
  } finally {
    isWriting.value = false
  }
}

function showMessage(message: string, color: string) {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

function addToGlobalHistory(operation: any) {
  if ((window as any).addOperationHistory) {
    (window as any).addOperationHistory(operation)
  }
}

function formatAddressInput(raw: string): string {
  const trimmed = raw.replace(/\s+/g, '')
  if (!trimmed) {
    return '0x'
  }

  if (trimmed.toLowerCase().startsWith('0x')) {
    const rest = trimmed.slice(2).toUpperCase()
    return `0x${rest}`
  }

  const hexPattern = /^[0-9a-fA-F]+$/
  if (hexPattern.test(trimmed)) {
    return `0x${trimmed.toUpperCase()}`
  }

  return '0x'
}

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
.register-bit-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flex-nowrap {
  flex-wrap: nowrap;
}

.narrow-field {
  max-width: 90px;
}

.bit-checkboxes {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  align-items: center;
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
</style>
