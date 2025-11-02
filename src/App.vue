<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>IC Evaluation Board Control</v-app-bar-title>
      <v-spacer></v-spacer>
      
      <!-- Connection Status with Split Button -->
      <div class="d-flex align-center">
        <!-- Split Button for Disconnected State -->
        <v-btn-group v-if="!commStore.isConnected" variant="flat" divided>
          <!-- Main Connect Button -->
          <v-btn
            color="success"
            :loading="commStore.isLoading"
            @click="handleQuickConnect"
          >
            <v-icon start>mdi-cog-sync</v-icon>
            To Connect
          </v-btn>
          
          <!-- Settings Dropdown -->
          <v-menu
            v-model="showConnectionMenu"
            :close-on-content-click="false"
            location="bottom end"
            offset="10"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                color="success"
                icon="mdi-chevron-down"
              ></v-btn>
            </template>

            <!-- Quick Connect Settings Panel -->
            <v-card min-width="320" max-width="400">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-settings</v-icon>
                Connection Settings
              </v-card-title>
              <v-card-text>
                <v-select
                  v-model="quickConnectionSettings.protocol"
                  :items="protocolOptions"
                  label="Protocol"
                  variant="outlined"
                  density="compact"
                  class="mb-2"
                ></v-select>

                <v-text-field
                  v-model="quickConnectionSettings.devicePath"
                  label="Device Path"
                  :placeholder="quickConnectionSettings.protocol === 'I2C' ? '/dev/i2c-1' : '/dev/ttyUSB0'"
                  variant="outlined"
                  density="compact"
                  class="mb-2"
                ></v-text-field>

                <v-text-field
                  v-if="quickConnectionSettings.protocol === 'Serial'"
                  v-model.number="quickConnectionSettings.baudRate"
                  label="Baud Rate"
                  type="number"
                  variant="outlined"
                  density="compact"
                  class="mb-2"
                ></v-text-field>

                <v-text-field
                  v-model="quickConnectionSettings.slaveAddress"
                  label="Slave Address"
                  placeholder="0x50"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-card-text>
              <v-card-actions>
                <v-btn
                  color="primary"
                  :loading="commStore.isLoading"
                  block
                  @click="handleQuickConnect"
                >
                  <v-icon start>mdi-connection</v-icon>
                  Connect
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
        </v-btn-group>

        <!-- Split Button for Connected State -->
        <v-btn-group v-if="commStore.isConnected" variant="flat" divided>
          <!-- Main Disconnect Button -->
          <v-btn
            color="error"
            :loading="commStore.isLoading"
            @click="handleQuickDisconnect"
          >
            <v-icon start>mdi-sync</v-icon>
            Connected
          </v-btn>
          
          <!-- Settings Dropdown -->
          <v-menu
            v-model="showConnectionMenu"
            :close-on-content-click="false"
            location="bottom end"
            offset="10"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                color="error"
                icon="mdi-chevron-down"
              ></v-btn>
            </template>

            <!-- Connection Settings Panel (Read-only) -->
            <v-card min-width="320" max-width="400">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-settings</v-icon>
                Connection Settings
              </v-card-title>
              <v-card-text>
                <v-select
                  v-model="quickConnectionSettings.protocol"
                  :items="protocolOptions"
                  label="Protocol"
                  variant="outlined"
                  density="compact"
                  class="mb-2"
                  readonly
                ></v-select>

                <v-text-field
                  v-model="quickConnectionSettings.devicePath"
                  label="Device Path"
                  variant="outlined"
                  density="compact"
                  class="mb-2"
                  readonly
                ></v-text-field>

                <v-text-field
                  v-if="quickConnectionSettings.protocol === 'Serial'"
                  v-model.number="quickConnectionSettings.baudRate"
                  label="Baud Rate"
                  type="number"
                  variant="outlined"
                  density="compact"
                  class="mb-2"
                  readonly
                ></v-text-field>

                <v-text-field
                  v-model="quickConnectionSettings.slaveAddress"
                  label="Slave Address"
                  variant="outlined"
                  density="compact"
                  readonly
                ></v-text-field>
              </v-card-text>
              <v-card-actions>
                <v-btn
                  color="error"
                  :loading="commStore.isLoading"
                  block
                  @click="handleQuickDisconnect"
                >
                  <v-icon start>mdi-cog-sync</v-icon>
                  Disconnect
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
        </v-btn-group>
      </div>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useCommunicationStore } from './stores/communicationStore'
import type { CommunicationProtocol } from './interfaces/CommunicationInterface'
import { MockCommunication } from './interfaces/MockCommunication'

const commStore = useCommunicationStore()
const showConnectionMenu = ref(false)

// Quick connection settings
const quickConnectionSettings = reactive({
  protocol: 'I2C' as CommunicationProtocol,
  devicePath: '/dev/i2c-1',
  baudRate: 115200,
  slaveAddress: '0x50'
})

const protocolOptions = [
  { title: 'I2C', value: 'I2C' },
  { title: 'Serial', value: 'Serial' },
  { title: 'Mock (Testing)', value: 'Mock' },
]

// Handle quick connect
async function handleQuickConnect() {
  try {
    const mockComm = new MockCommunication()
    
    await commStore.connect(
      {
        protocol: quickConnectionSettings.protocol,
        devicePath: quickConnectionSettings.devicePath,
        baudRate: quickConnectionSettings.baudRate,
      },
      mockComm
    )
    
    showConnectionMenu.value = false
  } catch (error) {
    console.error('Connection failed:', error)
  }
}

// Handle quick disconnect
async function handleQuickDisconnect() {
  try {
    await commStore.disconnect()
  } catch (error) {
    console.error('Disconnect failed:', error)
  }
}
</script>

<style>
/* Global styles */
</style>

