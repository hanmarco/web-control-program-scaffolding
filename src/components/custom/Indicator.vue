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
      <div class="indicator-display">
        <v-text-field
          :model-value="formattedValue"
          :label="`Value (${register.format || 'hex'})`"
          readonly
          variant="outlined"
          density="comfortable"
        >
          <template #prepend-inner>
            <v-icon :color="isConnected ? 'success' : 'grey'">
              mdi-circle
            </v-icon>
          </template>
        </v-text-field>

        <div v-if="register.format !== 'binary'" class="bit-display">
          <div
            v-for="i in 8"
            :key="i"
            class="bit-indicator"
            :class="{ active: getBit(7 - (i - 1)) }"
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
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
      <v-spacer></v-spacer>
      <v-chip v-if="lastUpdate" size="small" variant="outlined">
        Updated: {{ formatTime(lastUpdate) }}
      </v-chip>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRegisterStore } from '../../stores/registerStore'
import { useCommunicationStore } from '../../stores/communicationStore'
import type { IndicatorRegister } from '../../types/RegisterTypes'

const props = defineProps<{
  register: IndicatorRegister
  slaveAddress?: number
  autoRefresh?: boolean
  refreshInterval?: number
}>()

const registerStore = useRegisterStore()
const commStore = useCommunicationStore()
const isLoading = ref(false)
const currentValue = ref<number>(0)
const lastUpdate = ref<number | null>(null)
let refreshTimer: number | null = null

const isConnected = computed(() => commStore.isConnected)

const formattedValue = computed(() => {
  const format = props.register.format || 'hex'
  switch (format) {
    case 'binary':
      return `0b${currentValue.value.toString(2).padStart(8, '0')}`
    case 'decimal':
      return currentValue.value.toString()
    case 'hex':
    default:
      return `0x${currentValue.value.toString(16).toUpperCase().padStart(2, '0')}`
  }
})

function getBit(index: number): boolean {
  return ((currentValue.value >> index) & 1) === 1
}

async function handleRead() {
  try {
    isLoading.value = true
    const value = await registerStore.readRegisterValue(props.register.address, props.slaveAddress)
    currentValue.value = value
    lastUpdate.value = Date.now()
  } catch (error) {
    console.error('Failed to read register:', error)
  } finally {
    isLoading.value = false
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

function startAutoRefresh() {
  if (props.autoRefresh && props.refreshInterval) {
    refreshTimer = window.setInterval(() => {
      handleRead()
    }, props.refreshInterval)
  }
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Auto-refresh management
if (props.autoRefresh) {
  startAutoRefresh()
}

// Initial read
handleRead()

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.indicator-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bit-display {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.bit-indicator {
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

.bit-indicator.active {
  background-color: rgb(var(--v-theme-primary));
  color: white;
}
</style>
