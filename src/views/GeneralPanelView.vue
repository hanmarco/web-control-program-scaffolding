<template>
  <v-container fluid>
    <v-row class="justify-end align-center mb-4 ga-4">
      <v-col cols="12" sm="3" md="2">
        <v-text-field
          v-model.number="panelCount"
          type="number"
          variant="outlined"
          density="compact"
          hide-details
          label="Panels"
          :min="MIN_PANELS"
          :max="MAX_PANELS"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="9" md="6" class="d-flex justify-end flex-wrap ga-2">
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          @click="handleReadAll"
          :loading="isBulkReading"
          :disabled="!commStore.isConnected || isBulkWriting || isBulkReading || isBulkClearing"
        >
          {{ readAllLabel }}
        </v-btn>
        <v-btn
          size="small"
          variant="tonal"
          color="success"
          @click="handleWriteAll"
          :loading="isBulkWriting"
          :disabled="!commStore.isConnected || isBulkWriting || isBulkReading || isBulkClearing"
        >
          {{ writeAllLabel }}
        </v-btn>
        <v-btn
          size="small"
          variant="tonal"
          color="warning"
          @click="handleClearAll"
          :loading="isBulkClearing"
          :disabled="isBulkWriting || isBulkReading || isBulkClearing"
        >
          {{ clearAllLabel }}
        </v-btn>
      </v-col>
    </v-row>

    <div class="panel-list">
      <v-virtual-scroll
        :items="panelIndices"
        :item-height="PANEL_ITEM_HEIGHT"
      >
        <template #default="{ item }">
          <RegisterBitPanel
            :key="item"
            :source="`general-${item + 1}`"
            :address-input="`0x${item.toString(16).toUpperCase().padStart(2, '0')}`"
            :ref="setPanelRef(item)"
          />
        </template>
      </v-virtual-scroll>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { VNodeRef } from 'vue'
import RegisterBitPanel from '../components/custom/RegisterBitPanel.vue'
import { useRegisterStore } from '../stores/registerStore'
import { useCommunicationStore } from '../stores/communicationStore'

defineOptions({
  name: 'GeneralPanelView'
})

const MIN_PANELS = 1
const MAX_PANELS = 256
const PANEL_ITEM_HEIGHT = 120
const BULK_CHUNK_SIZE = 64
const BULK_SINGLE_TRANSFER_LIMIT = 256

const panelCount = ref<number>(MAX_PANELS)
const isBulkReading = ref(false)
const isBulkWriting = ref(false)
const isBulkClearing = ref(false)
const bulkProgress = ref(0)
type RegisterBitPanelHandle = { clear: () => void }

const panelRefs = new Map<number, RegisterBitPanelHandle>()

const registerStore = useRegisterStore()
const commStore = useCommunicationStore()

watch(panelCount, (value) => {
  let sanitized = Number.isFinite(value) ? Math.floor(value) : MIN_PANELS
  if (sanitized < MIN_PANELS) sanitized = MIN_PANELS
  if (sanitized > MAX_PANELS) sanitized = MAX_PANELS
  if (sanitized !== value) {
    panelCount.value = sanitized
  }
})

const panelIndices = computed(() =>
  Array.from({ length: panelCount.value }, (_, idx) => idx)
)

const totalPanels = computed(() => panelCount.value)

const readAllLabel = computed(() => {
  if (isBulkReading.value) {
    return `Reading ${bulkProgress.value}/${totalPanels.value}`
  }
  return 'Read All'
})

const writeAllLabel = computed(() => {
  if (isBulkWriting.value) {
    return `Writing ${bulkProgress.value}/${totalPanels.value}`
  }
  return 'Write All'
})

const clearAllLabel = computed(() => {
  if (isBulkClearing.value) {
    return `Clearing ${bulkProgress.value}/${totalPanels.value}`
  }
  return 'Clear All'
})

const toAddressHex = (index: number) => `0x${index.toString(16).toUpperCase().padStart(2, '0')}`

function setPanelRef(index: number): VNodeRef {
  const assign = (value: unknown) => {
    const instance = value as RegisterBitPanelHandle | null
    if (instance && typeof instance.clear === 'function') {
      panelRefs.set(index, instance)
    } else {
      panelRefs.delete(index)
    }
  }

  return assign as unknown as VNodeRef
}

async function handleReadAll() {
  if (!commStore.isConnected || isBulkReading.value || isBulkWriting.value) return

  isBulkReading.value = true
  bulkProgress.value = 0

  try {
    const total = totalPanels.value
    if (total <= 0) return

    const slaveAddr = registerStore.defaultSlaveAddress
    const baseAddress = 0

    const applyBuffer = (buffer: Uint8Array, offset: number) => {
      for (let i = 0; i < buffer.length; i += 1) {
        const idx = offset + i
        const address = toAddressHex(idx)
        const value = buffer[i] ?? 0
        registerStore.updateRegisterValue(address, value)
      }
    }

    const trySingleTransfer = async () => {
      if (total > BULK_SINGLE_TRANSFER_LIMIT) {
        return false
      }

      try {
        const result = await commStore.readRegister(slaveAddr, baseAddress, total)
        applyBuffer(result, 0)
        bulkProgress.value = total
        return true
      } catch (error) {
        console.warn('Single-transfer read failed, falling back to chunked mode', error)
        return false
      }
    }

    const performedSingle = await trySingleTransfer()
    if (performedSingle) return

    for (let offset = 0; offset < total; offset += BULK_CHUNK_SIZE) {
      const chunkLength = Math.min(BULK_CHUNK_SIZE, total - offset)
      const result = await commStore.readRegister(slaveAddr, baseAddress + offset, chunkLength)
      applyBuffer(result, offset)
      bulkProgress.value = offset + chunkLength
    }
  } catch (error) {
    console.error('Failed to read all registers:', error)
  } finally {
    isBulkReading.value = false
  }
}

async function handleWriteAll() {
  if (!commStore.isConnected || isBulkReading.value || isBulkWriting.value) return

  isBulkWriting.value = true
  bulkProgress.value = 0

  try {
    const total = totalPanels.value
    if (total <= 0) return

    const slaveAddr = registerStore.defaultSlaveAddress
    const baseAddress = 0

    const buildChunkBuffer = (offset: number, length: number) => {
      const buffer = new Uint8Array(length)
      for (let i = 0; i < length; i += 1) {
        const idx = offset + i
        const address = toAddressHex(idx)
        const value = registerStore.getRegisterValue(address) ?? 0
        buffer[i] = value & 0xFF
      }
      return buffer
    }

    const applyBuffer = (buffer: Uint8Array, offset: number) => {
      for (let i = 0; i < buffer.length; i += 1) {
        const idx = offset + i
        const address = toAddressHex(idx)
        const value = buffer[i] ?? 0
        registerStore.updateRegisterValue(address, value)
      }
    }

    const trySingleTransfer = async () => {
      if (total > BULK_SINGLE_TRANSFER_LIMIT) {
        return false
      }

      try {
        const buffer = buildChunkBuffer(0, total)
        await commStore.writeRegister(slaveAddr, baseAddress, buffer)
        applyBuffer(buffer, 0)
        bulkProgress.value = total
        return true
      } catch (error) {
        console.warn('Single-transfer write failed, falling back to chunked mode', error)
        return false
      }
    }

    const performedSingle = await trySingleTransfer()
    if (performedSingle) return

    for (let offset = 0; offset < total; offset += BULK_CHUNK_SIZE) {
      const chunkLength = Math.min(BULK_CHUNK_SIZE, total - offset)
      const buffer = buildChunkBuffer(offset, chunkLength)
      await commStore.writeRegister(slaveAddr, baseAddress + offset, buffer)
      applyBuffer(buffer, offset)
      bulkProgress.value = offset + chunkLength
    }
  } catch (error) {
    console.error('Failed to write all registers:', error)
  } finally {
    isBulkWriting.value = false
  }
}

async function handleClearAll() {
  if (isBulkReading.value || isBulkWriting.value || isBulkClearing.value) return

  isBulkClearing.value = true
  bulkProgress.value = 0
  try {
    const total = totalPanels.value
    for (let idx = 0; idx < total; idx += 1) {
      const address = toAddressHex(idx)
      registerStore.updateRegisterValue(address, 0)
      bulkProgress.value = idx + 1
      const panel = panelRefs.get(idx)
      panel?.clear()
    }
  } catch (error) {
    console.error('Failed to clear registers:', error)
  } finally {
    isBulkClearing.value = false
  }
}
</script>

<style scoped>
.panel-list {
  height: calc(100vh - 220px);
  min-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.4) transparent;
  -ms-overflow-style: auto;
}

.panel-list :deep(.v-virtual-scroll__container) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 12px;
}

:deep(.panel-list::-webkit-scrollbar) {
  width: 8px;
}

:deep(.panel-list::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.panel-list::-webkit-scrollbar-thumb) {
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
}
</style>