<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <span>{{ register.name }}</span>
      <v-spacer></v-spacer>
      <v-chip size="small" color="primary">{{ register.address }}</v-chip>
    </v-card-title>
    
    <v-card-subtitle v-if="register.description">
      {{ register.description }}
    </v-card-subtitle>

    <v-card-text>
      <div class="bit-controls">
        <div
          v-for="i in 8"
          :key="i"
          class="bit-item"
        >
          <div class="bit-label">Bit {{ 7 - (i - 1) }}</div>
          <v-checkbox
            v-model="bitValues[7 - (i - 1)]"
            :disabled="!register.writable || isLoading"
            density="compact"
            hide-details
          ></v-checkbox>
        </div>
      </div>

      <v-divider class="my-4"></v-divider>

      <div class="value-display">
        <v-text-field
          :model-value="hexValue"
          label="Hex Value"
          readonly
          density="compact"
          variant="outlined"
        ></v-text-field>
        <v-text-field
          :model-value="decimalValue"
          label="Decimal Value"
          readonly
          density="compact"
          variant="outlined"
        ></v-text-field>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn
        color="primary"
        :loading="isLoading"
        @click="handleRead"
      >
        <v-icon start>mdi-download</v-icon>
        Read
      </v-btn>
      <v-btn
        v-if="register.writable"
        color="success"
        :loading="isLoading"
        :disabled="!hasChanges"
        @click="handleWrite"
      >
        <v-icon start>mdi-upload</v-icon>
        Write
      </v-btn>
      <v-spacer></v-spacer>
      <v-chip v-if="lastUpdate" size="small" variant="outlined">
        Updated: {{ formatTime(lastUpdate) }}
      </v-chip>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRegisterStore } from '../../stores/registerStore'
import type { ByteRegister } from '../../types/RegisterTypes'

const props = defineProps<{
  register: ByteRegister
  slaveAddress?: number
}>()

const registerStore = useRegisterStore()
const isLoading = ref(false)
const bitValues = ref<boolean[]>(Array(8).fill(false))
const originalValue = ref<number>(0)
const lastUpdate = ref<number | null>(null)

const currentValue = computed(() => {
  let value = 0
  for (let i = 0; i < 8; i++) {
    if (bitValues.value[i]) {
      value |= (1 << i)
    }
  }
  return value
})

const hexValue = computed(() => `0x${currentValue.value.toString(16).toUpperCase().padStart(2, '0')}`)
const decimalValue = computed(() => currentValue.value.toString())
const hasChanges = computed(() => currentValue.value !== originalValue.value)

watch(() => props.register.address, () => {
  handleRead()
}, { immediate: true })

async function handleRead() {
  try {
    isLoading.value = true
    const value = await registerStore.readRegisterValue(props.register.address, props.slaveAddress)
    updateBitValues(value)
    originalValue.value = value
    lastUpdate.value = Date.now()
  } catch (error) {
    console.error('Failed to read register:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleWrite() {
  try {
    isLoading.value = true
    await registerStore.writeRegisterValue(props.register.address, currentValue.value, props.slaveAddress)
    originalValue.value = currentValue.value
    lastUpdate.value = Date.now()
  } catch (error) {
    console.error('Failed to write register:', error)
  } finally {
    isLoading.value = false
  }
}

function updateBitValues(value: number) {
  for (let i = 0; i < 8; i++) {
    bitValues.value[i] = ((value >> i) & 1) === 1
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}
</script>

<style scoped>
.bit-controls {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.bit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.bit-label {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
}

.value-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
</style>
