<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      app
      temporary
    >
      <v-list>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          to="/"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-developer-board"
          title="General Panel"
          to="/general"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-history"
          title="Operation History"
          to="/history"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>IC Evaluation Board Control</v-app-bar-title>
      <v-spacer></v-spacer>
      
      <!-- Connection Status with Split Button -->
      <div class="d-flex align-center" style="flex-shrink: 0; margin-right: 20px;">
        <!-- Split Button for Disconnected State -->
        <v-btn-group v-if="!commStore.isConnected" variant="flat" divided>
          <!-- Main Connect Button -->
          <v-btn
            color="info"
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
                color="info"
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
      <router-view v-slot="{ Component, route }">
        <KeepAlive>
          <component
            v-if="Component"
            :is="Component"
            :key="route.fullPath"
          />
        </KeepAlive>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useCommunicationStore } from './stores/communicationStore'
import type { CommunicationProtocol } from './interfaces/CommunicationInterface'
import { MockCommunication } from './interfaces/MockCommunication'

const drawer = ref(false)
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
/* Global styles optimized for Tauri WebKit */

/* Base reset for better cross-platform rendering */
* {
  box-sizing: border-box;
}

/* Hide horizontal scrollbar with WebKit compatibility */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
  margin: 0;
  padding: 0;
  /* WebKit specific fixes */
  -webkit-overflow-scrolling: touch;
  -webkit-text-size-adjust: 100%;
}

/* Prevent horizontal scrolling */
.v-app {
  overflow-x: hidden;
  /* Ensure proper rendering in Tauri WebView */
  position: relative;
  width: 100%;
  height: 100vh;
}

/* Ensure app bar content doesn't overflow */
.v-app-bar {
  overflow-x: hidden;
  /* WebKit optimization */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.v-app-bar .v-toolbar__content {
  overflow-x: hidden;
  padding-right: 16px;
  /* Prevent layout shifts */
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Ensure button group doesn't cause overflow */
.v-btn-group {
  flex-shrink: 0;
  max-width: calc(100vw - 400px); /* Reserve space for title and margins */
  /* WebKit button rendering fix */
  -webkit-appearance: none;
  appearance: none;
}

/* Vuetify button fixes for WebKit */
.v-btn {
  /* Prevent button text from being cut off */
  white-space: nowrap;
  /* WebKit specific button fixes */
  -webkit-appearance: none;
  appearance: none;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* Ensure connection menu cards fit properly */
.v-menu .v-card {
  max-width: min(400px, calc(100vw - 32px));
  /* WebKit shadow rendering */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* Fix any potential overflow in main content */
.v-main {
  overflow-x: hidden;
  /* Ensure proper content rendering */
  position: relative;
  width: 100%;
}

/* Navigation drawer fixes for WebKit */
.v-navigation-drawer {
  /* Prevent drawer from causing layout issues */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* List items rendering optimization */
.v-list-item {
  /* Prevent text wrapping issues */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* WebKit scrollbar hiding with fallbacks */
::-webkit-scrollbar:horizontal {
  display: none;
  width: 0;
  height: 0;
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* Firefox scrollbar hiding */
* {
  scrollbar-width: none;
}

/* IE/Edge scrollbar hiding */
* {
  -ms-overflow-style: none;
}

/* Form element fixes for WebKit */
.v-text-field .v-field__input {
  /* Prevent input rendering issues */
  -webkit-appearance: none;
  appearance: none;
  -webkit-border-radius: 0;
  border-radius: 0;
}

.v-select .v-field__input {
  -webkit-appearance: none;
  appearance: none;
}

/* Menu and overlay fixes */
.v-overlay__content {
  /* Ensure overlays render properly */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* Card component optimization */
.v-card {
  /* Prevent card rendering issues */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  /* Ensure proper background rendering */
  background-clip: padding-box;
}

/* Animation performance optimization for WebKit */
.v-btn--variant-flat,
.v-btn--variant-elevated,
.v-btn--variant-outlined {
  /* Hardware acceleration for better performance */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  /* Smooth transitions */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Fix potential flex layout issues in WebKit */
.d-flex {
  display: -webkit-flex;
  display: flex;
}

.align-center {
  -webkit-align-items: center;
  align-items: center;
}

.justify-center {
  -webkit-justify-content: center;
  justify-content: center;
}

/* Icon rendering optimization */
.v-icon {
  /* Prevent icon rendering issues */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

