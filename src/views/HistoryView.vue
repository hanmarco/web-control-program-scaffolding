<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-history</v-icon>
            Operation History
            <v-spacer></v-spacer>
            <v-chip size="small" :color="commStore.isConnected ? 'success' : 'grey'">
              {{ commStore.isConnected ? 'Connected' : 'Disconnected' }}
            </v-chip>
          </v-card-title>
          <v-card-subtitle>
            Complete log of all register read/write operations
          </v-card-subtitle>
          
          <v-card-text>
            <!-- Filter and Controls -->
            <v-row class="mb-4">
              <v-col cols="12" md="3">
                <v-select
                  v-model="filterType"
                  :items="filterOptions"
                  label="Operation Type"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="filterAddress"
                  label="Filter by Address"
                  placeholder="0x10, 16, etc."
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filterStatus"
                  :items="statusOptions"
                  label="Status"
                  variant="outlined"
                  density="compact"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="3" class="d-flex align-center ga-2">
                <v-btn
                  color="error"
                  variant="outlined"
                  @click="clearHistory"
                  :disabled="operationHistory.length === 0"
                >
                  <v-icon start>mdi-delete</v-icon>
                  Clear All
                </v-btn>
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="exportHistory"
                  :disabled="filteredHistory.length === 0"
                >
                  <v-icon start>mdi-download</v-icon>
                  Export
                </v-btn>
              </v-col>
            </v-row>
            
            <!-- Statistics -->
            <v-row class="mb-4">
              <v-col cols="12" md="3">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h4 text-primary">{{ totalOperations }}</div>
                    <div class="text-caption">Total Operations</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h4 text-success">{{ successfulOperations }}</div>
                    <div class="text-caption">Successful</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h4 text-error">{{ failedOperations }}</div>
                    <div class="text-caption">Failed</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h4 text-info">{{ uniqueAddresses }}</div>
                    <div class="text-caption">Unique Addresses</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            
            <!-- History Table -->
            <div v-if="filteredHistory.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-history</v-icon>
              <div class="text-h6 mt-4 text-grey">
                {{ operationHistory.length === 0 ? 'No operations recorded yet' : 'No operations match current filters' }}
              </div>
              <div class="text-body-2 text-grey mt-2">
                {{ operationHistory.length === 0 ? 'Start reading or writing registers to see history' : 'Try adjusting your filter criteria' }}
              </div>
            </div>
            
            <v-data-table
              v-else
              :headers="tableHeaders"
              :items="paginatedHistory"
              :items-per-page="itemsPerPage"
              :page="currentPage"
              class="elevation-1"
              density="compact"
              @update:page="currentPage = $event"
              @update:items-per-page="itemsPerPage = $event"
            >
              <template v-slot:item.type="{ item }">
                <v-chip
                  size="small"
                  :color="item.type === 'read' ? 'primary' : 'success'"
                  variant="flat"
                >
                  {{ item.type.toUpperCase() }}
                </v-chip>
              </template>
              
              <template v-slot:item.address="{ item }">
                <v-chip size="small" variant="outlined">
                  {{ item.address }}
                </v-chip>
              </template>
              
              <template v-slot:item.value="{ item }">
                <v-chip 
                  size="small" 
                  :color="item.success ? 'default' : 'error'"
                  variant="outlined"
                >
                  {{ item.value }}
                </v-chip>
              </template>
              
              <template v-slot:item.success="{ item }">
                <v-icon
                  size="small"
                  :color="item.success ? 'success' : 'error'"
                >
                  {{ item.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                </v-icon>
              </template>
              
              <template v-slot:item.timestamp="{ item }">
                <span class="text-body-2">{{ item.timestamp }}</span>
              </template>
              
              <template v-slot:item.actions="{ item }">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-content-copy"
                  @click="copyToClipboard(item)"
                ></v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-repeat"
                  @click="repeatOperation(item)"
                  :disabled="!commStore.isConnected"
                ></v-btn>
              </template>
              
              <template v-slot:bottom>
                <div class="d-flex align-center justify-space-between pa-4">
                  <div class="text-body-2">
                    Showing {{ Math.min(itemsPerPage, filteredHistory.length) }} of {{ filteredHistory.length }} operations
                  </div>
                  <v-pagination
                    v-model="currentPage"
                    :length="Math.ceil(filteredHistory.length / itemsPerPage)"
                    :total-visible="7"
                    density="compact"
                  ></v-pagination>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Snackbar for notifications -->
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCommunicationStore } from '../stores/communicationStore'
import { useRegisterStore } from '../stores/registerStore'

const commStore = useCommunicationStore()
const registerStore = useRegisterStore()

// State
const operationHistory = ref<OperationRecord[]>([])
const filterType = ref<string | null>(null)
const filterAddress = ref('')
const filterStatus = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(25)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Operation record interface
interface OperationRecord {
  id: string
  type: 'read' | 'write'
  address: string
  value: string
  success: boolean
  timestamp: string
  fullTimestamp: Date
  source: 'general' | 'dashboard' | 'manual'
}

// Filter options
const filterOptions = [
  { title: 'Read', value: 'read' },
  { title: 'Write', value: 'write' }
]

const statusOptions = [
  { title: 'Successful', value: 'success' },
  { title: 'Failed', value: 'error' }
]

// Table headers
const tableHeaders = [
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Address', key: 'address', sortable: true },
  { title: 'Value', key: 'value', sortable: false },
  { title: 'Status', key: 'success', sortable: true },
  { title: 'Time', key: 'timestamp', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Computed properties
const filteredHistory = computed(() => {
  let filtered = operationHistory.value

  if (filterType.value) {
    filtered = filtered.filter(op => op.type === filterType.value)
  }

  if (filterAddress.value) {
    const addressFilter = filterAddress.value.toLowerCase()
    filtered = filtered.filter(op => 
      op.address.toLowerCase().includes(addressFilter)
    )
  }

  if (filterStatus.value) {
    const isSuccess = filterStatus.value === 'success'
    filtered = filtered.filter(op => op.success === isSuccess)
  }

  return filtered.reverse() // Show newest first
})

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredHistory.value.slice(start, end)
})

const totalOperations = computed(() => operationHistory.value.length)
const successfulOperations = computed(() => 
  operationHistory.value.filter(op => op.success).length
)
const failedOperations = computed(() => 
  operationHistory.value.filter(op => !op.success).length
)
const uniqueAddresses = computed(() => 
  new Set(operationHistory.value.map(op => op.address)).size
)

// Methods
function addOperation(operation: Omit<OperationRecord, 'id' | 'fullTimestamp'>) {
  const record: OperationRecord = {
    ...operation,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fullTimestamp: new Date()
  }
  operationHistory.value.push(record)
  saveToLocalStorage()
}

function clearHistory() {
  operationHistory.value = []
  saveToLocalStorage()
  showMessage('History cleared successfully', 'success')
}

function exportHistory() {
  const dataStr = JSON.stringify(filteredHistory.value, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `operation-history-${new Date().toISOString().split('T')[0]}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
  
  showMessage('History exported successfully', 'success')
}

function copyToClipboard(operation: OperationRecord) {
  const text = `${operation.type.toUpperCase()} ${operation.address} ${operation.value} - ${operation.timestamp}`
  navigator.clipboard.writeText(text).then(() => {
    showMessage('Operation copied to clipboard', 'success')
  }).catch(() => {
    showMessage('Failed to copy to clipboard', 'error')
  })
}

async function repeatOperation(operation: OperationRecord) {
  if (!commStore.isConnected) {
    showMessage('Not connected to device', 'error')
    return
  }

  try {
    const address = parseInt(operation.address, 16)
    const slaveAddr = registerStore.defaultSlaveAddress
    
    if (operation.type === 'read') {
      const result = await commStore.readRegister(slaveAddr, address, 1)
      const value = result[0]
      
      if (value !== undefined) {
        addOperation({
          type: 'read',
          address: operation.address,
          value: `0x${value.toString(16).toUpperCase().padStart(2, '0')}`,
          success: true,
          timestamp: new Date().toLocaleTimeString(),
          source: 'manual'
        })
        showMessage('Read operation repeated successfully', 'success')
      }
    } else if (operation.type === 'write') {
      const value = parseInt(operation.value, 16)
      const data = new Uint8Array([value])
      
      await commStore.writeRegister(slaveAddr, address, data)
      
      addOperation({
        type: 'write',
        address: operation.address,
        value: operation.value,
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        source: 'manual'
      })
      showMessage('Write operation repeated successfully', 'success')
    }
  } catch (error) {
    addOperation({
      type: operation.type,
      address: operation.address,
      value: 'ERROR',
      success: false,
      timestamp: new Date().toLocaleTimeString(),
      source: 'manual'
    })
    showMessage(`Failed to repeat ${operation.type} operation`, 'error')
  }
}

function showMessage(message: string, color: string) {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('operationHistory', JSON.stringify(operationHistory.value))
  } catch (error) {
    console.warn('Failed to save history to localStorage:', error)
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('operationHistory')
    if (saved) {
      const parsed = JSON.parse(saved)
      operationHistory.value = parsed.map((op: any) => ({
        ...op,
        fullTimestamp: new Date(op.fullTimestamp || op.timestamp)
      }))
    }
  } catch (error) {
    console.warn('Failed to load history from localStorage:', error)
  }
}

// Global event listener for operations from other components
function handleOperationEvent(event: CustomEvent<Omit<OperationRecord, 'id' | 'fullTimestamp'>>) {
  addOperation(event.detail)
}

// Lifecycle
onMounted(() => {
  loadFromLocalStorage()
  window.addEventListener('register-operation', handleOperationEvent as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('register-operation', handleOperationEvent as EventListener)
})

// Expose method for other components to add operations
;(window as any).addOperationHistory = addOperation
</script>

<style scoped>
.v-data-table :deep(.v-data-table__td) {
  padding: 8px 16px !important;
}

.v-data-table :deep(.v-data-table__th) {
  padding: 8px 16px !important;
}
</style>