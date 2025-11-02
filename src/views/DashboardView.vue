<template>
  <v-container fluid>
    <v-row v-if="!registerStore.registerMap && !isLoading">
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="error">mdi-alert-circle-outline</v-icon>
            <p class="text-h6 mt-4">Failed to Load Register Map</p>
            <p class="text-body-2 text-grey">Unable to load the sample register map automatically</p>
            <v-btn color="primary" class="mt-4" @click="loadSampleMap">
              <v-icon start>mdi-refresh</v-icon>
              Retry Loading
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="isLoading">
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center py-8">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <p class="text-h6 mt-4">Loading Register Map...</p>
            <p class="text-body-2 text-grey">Please wait while we load the configuration</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <template v-else-if="registerStore.registerMap">
      <v-row>
        <v-col
          v-for="register in registerStore.registers"
          :key="register.address"
          cols="12"
          md="6"
          lg="4"
        >
          <component
            v-if="register.type !== 'bitfield'"
            :is="getComponentForType(register.type)"
            :register="register as any"
          />
          <v-card v-else>
            <v-card-title>{{ register.name }}</v-card-title>
            <v-card-text>
              BitField type not yet implemented
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

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
import { ref, onMounted } from 'vue'
import { useRegisterStore } from '../stores/registerStore'
import type { RegisterType } from '../types/RegisterTypes'
import ByteType from '../components/custom/ByteType.vue'
import ControlRegister from '../components/custom/ControlRegister.vue'
import Indicator from '../components/custom/Indicator.vue'
import Slider from '../components/custom/Slider.vue'
import Combobox from '../components/custom/Combobox.vue'

const registerStore = useRegisterStore()
const isLoading = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

function getComponentForType(type: RegisterType) {
  switch (type) {
    case 'byte':
      return ByteType
    case 'control':
      return ControlRegister
    case 'indicator':
      return Indicator
    case 'slider':
      return Slider
    case 'combobox':
      return Combobox
    default:
      return ByteType
  }
}

async function loadSampleMap() {
  isLoading.value = true
  try {
    await registerStore.loadRegisterMapFromFile('/sample-register-map.json')
    snackbarMessage.value = 'Register map loaded successfully'
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    snackbarMessage.value = error instanceof Error ? error.message : 'Failed to load register map'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  } finally {
    isLoading.value = false
  }
}

// Automatically load register map when component mounts
onMounted(async () => {
  if (!registerStore.registerMap) {
    await loadSampleMap()
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
