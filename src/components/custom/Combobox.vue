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
      <v-select
        v-model="selectedValue"
        :items="selectItems"
        :disabled="!register.writable || isLoading"
        label="Select Option"
        variant="outlined"
        density="comfortable"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props">
            <template #subtitle v-if="item.raw.description">
              {{ item.raw.description }}
            </template>
          </v-list-item>
        </template>
      </v-select>

      <v-divider class="my-4"></v-divider>

      <div class="value-info">
        <v-text-field
          :model-value="hexValue"
          label="Hex Value"
          readonly
          variant="outlined"
          density="compact"
        ></v-text-field>
        
        <v-text-field
          :model-value="binaryValue"
          label="Binary Value"
          readonly
          variant="outlined"
          density="compact"
        ></v-text-field>
      </div>

      <div v-if="register.bits" class="bit-representation">
        <span class="label">Bits used: {{ register.bits.join(', ') }}</span>
        <div class="bits">
          <div
            v-for="i in 8"
            :key="i"
            class="bit"
            :class="{
              active: getBit(7 - (i - 1)),
              used: register.bits?.includes(7 - (i - 1))
            }"
          >
            {{ 7 - (i - 1) }}
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
import type { ComboboxRegister } from '../../types/RegisterTypes'

const props = defineProps<{
  register: ComboboxRegister
  slaveAddress?: number
}>()

const registerStore = useRegisterStore()
const isLoading = ref(false)
const selectedValue = ref<number>(props.register.options[0]?.value || 0)
const originalValue = ref<number>(props.register.options[0]?.value || 0)
const lastUpdate = ref<number | null>(null)

const selectItems = computed(() => {
  return props.register.options.map(opt => ({
    title: opt.label,
    value: opt.value,
    description: opt.description,
  }))
})

const hexValue = computed(() => `0x${selectedValue.value.toString(16).toUpperCase().padStart(2, '0')}`)
const binaryValue = computed(() => `0b${selectedValue.value.toString(2).padStart(8, '0')}`)
const hasChanges = computed(() => selectedValue.value !== originalValue.value)

function getBit(index: number): boolean {
  return ((selectedValue.value >> index) & 1) === 1
}

watch(() => props.register.address, () => {
  handleRead()
}, { immediate: true })

async function handleRead() {
  try {
    isLoading.value = true
    const regValue = await registerStore.readRegisterValue(props.register.address, props.slaveAddress)
    
    let value = regValue
    if (props.register.bits) {
      value = registerStore.extractBits(regValue, props.register.bits)
    }
    
    // Find the matching option or use the raw value
    const matchingOption = props.register.options.find(opt => opt.value === value)
    selectedValue.value = matchingOption ? matchingOption.value : value
    originalValue.value = selectedValue.value
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
    
    let writeValue = selectedValue.value
    if (props.register.bits) {
      const currentRegValue = registerStore.getRegisterValue(props.register.address) || 0
      writeValue = registerStore.setBits(currentRegValue, props.register.bits, selectedValue.value)
    }
    
    await registerStore.writeRegisterValue(props.register.address, writeValue, props.slaveAddress)
    originalValue.value = selectedValue.value
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
.value-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
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
