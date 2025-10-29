<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Settings</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Device Connection</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedProtocol"
              :items="protocolOptions"
              label="Communication Protocol"
              variant="outlined"
              density="comfortable"
            ></v-select>

            <v-text-field
              v-model="devicePath"
              label="Device Path"
              placeholder="/dev/ttyUSB0 or COM3"
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-text-field
              v-if="selectedProtocol === 'Serial'"
              v-model.number="baudRate"
              label="Baud Rate"
              type="number"
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-text-field
              v-model="slaveAddress"
              label="Default Slave Address"
              placeholder="0x50"
              variant="outlined"
              density="comfortable"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn
              v-if="!commStore.isConnected"
              color="primary"
              :loading="commStore.isLoading"
              @click="handleConnect"
            >
              <v-icon start>mdi-connection</v-icon>
              Connect
            </v-btn>
            <v-btn
              v-else
              color="error"
              :loading="commStore.isLoading"
              @click="handleDisconnect"
            >
              <v-icon start>mdi-connection</v-icon>
              Disconnect
            </v-btn>
            <v-spacer></v-spacer>
            <v-chip
              :color="commStore.isConnected ? 'success' : 'grey'"
              variant="flat"
            >
              {{ commStore.isConnected ? 'Connected' : 'Disconnected' }}
            </v-chip>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Register Map</v-card-title>
          <v-card-text>
            <v-btn
              color="primary"
              variant="outlined"
              block
              @click="loadSampleMap"
            >
              <v-icon start>mdi-file-document</v-icon>
              Load Sample Register Map
            </v-btn>

            <v-divider class="my-4"></v-divider>

            <div v-if="registerStore.registerMap">
              <p class="text-subtitle-1 font-weight-bold">Current Map:</p>
              <p class="text-body-2">{{ registerStore.registerMap.name }}</p>
              <p class="text-caption">
                Version {{ registerStore.registerMap.version }} •
                {{ registerStore.registers.length }} registers
              </p>
            </div>
            <div v-else>
              <p class="text-body-2 text-grey">No register map loaded</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>About</v-card-title>
          <v-card-text>
            <p class="text-body-2">
              <strong>IC Evaluation Board Application</strong>
            </p>
            <p class="text-body-2">
              This application provides a user-friendly interface for controlling
              IC evaluation boards through various communication protocols (I2C, Serial, etc.).
            </p>
            <p class="text-caption mt-2">
              Version: 0.1.0
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
import { ref } from 'vue'
import { useCommunicationStore } from '../stores/communicationStore'
import { useRegisterStore } from '../stores/registerStore'
import type { CommunicationProtocol } from '../interfaces/CommunicationInterface'
import { MockCommunication } from '../interfaces/MockCommunication'

const commStore = useCommunicationStore()
const registerStore = useRegisterStore()

const selectedProtocol = ref<string>('I2C')
const devicePath = ref('/dev/i2c-1')
const baudRate = ref(115200)
const slaveAddress = ref('0x50')

const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const protocolOptions = [
  { title: 'I2C', value: 'I2C' },
  { title: 'Serial', value: 'Serial' },
  { title: 'Mock (Testing)', value: 'Mock' },
]

async function handleConnect() {
  try {
    const mockComm = new MockCommunication()
    
    await commStore.connect(
      {
        protocol: selectedProtocol.value as CommunicationProtocol,
        devicePath: devicePath.value,
        baudRate: baudRate.value,
      },
      mockComm
    )

    snackbarMessage.value = 'Connected successfully'
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    snackbarMessage.value = error instanceof Error ? error.message : 'Connection failed'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  }
}

async function handleDisconnect() {
  try {
    await commStore.disconnect()
    snackbarMessage.value = 'Disconnected successfully'
    snackbarColor.value = 'info'
    showSnackbar.value = true
  } catch (error) {
    snackbarMessage.value = error instanceof Error ? error.message : 'Disconnect failed'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  }
}

async function loadSampleMap() {
  try {
    await registerStore.loadRegisterMapFromFile('/sample-register-map.json')
    snackbarMessage.value = 'Register map loaded successfully'
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    snackbarMessage.value = error instanceof Error ? error.message : 'Failed to load register map'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  }
}
</script>

<style scoped>
/* Add any custom styles here */
</style>
