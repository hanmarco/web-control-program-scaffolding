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
      <div class="slider-container">
        <v-slider
          v-model="sliderValue"
          :min="register.min"
          :max="register.max"
          :step="register.step || 0.1"
          :disabled="!register.writable || isLoading"
          thumb-label="always"
          color="primary"
        >
          <template #thumb-label="{ modelValue }">
            {{ formatValue(modelValue) }}
          </template>
        </v-slider>

        <div class="value-info">
          <v-text-field
            :model-value="displayValue"
            :label="`Value ${register.unit ? '(' + register.unit + ')' : ''}`"
            readonly
            variant="outlined"
            density="compact"
          ></v-text-field>
          
          <v-text-field
            :model-value="hexRawValue"
            label="Raw Value (Hex)"
            readonly
            variant="outlined"
            density="compact"
          ></v-text-field>
        </div>

        <div class="bit-representation">
          <span class="label">Bits used: {{ register.bits.join(', ') }}</span>
          <div class="bits">
            <div
              v-for="i in 8"
              :key="i"
              class="bit"
              :class="{
                active: getBit(7 - (i - 1)),
                used: register.bits.includes(7 - (i - 1))
              }"
            >
              {{ 7 - (i - 1) }}
            </div>
          </div>
        </div>
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
import type { SliderRegister } from '../../types/RegisterTypes'

const props = defineProps<{
  register: SliderRegister
  slaveAddress?: number
}>()

const registerStore = useRegisterStore()
const isLoading = ref(false)
const sliderValue = ref<number>(props.register.min)
const originalSliderValue = ref<number>(props.register.min)
const lastUpdate = ref<number | null>(null)

const rawValue = computed(() => {
  // Convert slider value to raw register value
  if (props.register.formula) {
    // Reverse the formula to get raw value
    const range = props.register.max - props.register.min
    const maxRaw = (1 << props.register.bits.length) - 1
    return Math.round(((sliderValue.value - props.register.min) / range) * maxRaw)
  }
  return Math.round(sliderValue.value)
})

const displayValue = computed(() => formatValue(sliderValue.value))

const hexRawValue = computed(() => `0x${rawValue.value.toString(16).toUpperCase().padStart(2, '0')}`)

const hasChanges = computed(() => sliderValue.value !== originalSliderValue.value)

function formatValue(value: number): string {
  const formatted = value.toFixed(2)
  return props.register.unit ? `${formatted} ${props.register.unit}` : formatted
}

function getBit(index: number): boolean {
  return ((rawValue.value >> index) & 1) === 1
}

function calculateValueFromRaw(raw: number): number {
  if (props.register.formula) {
    // Use the formula to calculate actual value
    // The formula should use 'value' variable
    try {
      // Create a function from the formula string
      // eslint-disable-next-line no-new-func
      const calculateFn = new Function('value', `return ${props.register.formula}`)
      return calculateFn(raw)
    } catch (error) {
      console.error('Formula evaluation error:', error)
      return raw
    }
  }
  return raw
}

watch(() => props.register.address, () => {
  handleRead()
}, { immediate: true })

async function handleRead() {
  try {
    isLoading.value = true
    const regValue = await registerStore.readRegisterValue(props.register.address, props.slaveAddress)
    const extractedValue = registerStore.extractBits(regValue, props.register.bits)
    sliderValue.value = calculateValueFromRaw(extractedValue)
    originalSliderValue.value = sliderValue.value
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
    const currentRegValue = registerStore.getRegisterValue(props.register.address) || 0
    const newRegValue = registerStore.setBits(currentRegValue, props.register.bits, rawValue.value)
    await registerStore.writeRegisterValue(props.register.address, newRegValue, props.slaveAddress)
    originalSliderValue.value = sliderValue.value
    lastUpdate.value = Date.now()
  } catch (error) {
    console.error('Failed to write register:', error)
  } finally {
    isLoading.value = false
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}
</script>

<style scoped>
.slider-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.value-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.bit-representation {
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.label {
  font-size: 12px;
  font-weight: 500;
  display: block;
  margin-bottom: 8px;
}

.bits {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.bit {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s;
}

.bit.used {
  border: 2px solid rgb(var(--v-theme-primary));
}

.bit.active {
  background-color: rgb(var(--v-theme-primary));
  color: white;
}
</style>
