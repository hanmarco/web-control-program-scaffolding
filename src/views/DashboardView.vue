<template>
  <v-container fluid>
    <v-alert
      v-if="registerStore.manifestError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ registerStore.manifestError }}
      <template #append>
        <v-btn
          color="primary"
          variant="text"
          @click="reloadManifest"
        >
          Retry
        </v-btn>
      </template>
    </v-alert>

    <v-card class="mb-4" v-if="registerStore.manifest.length === 0 && !isAnyLoading">
      <v-card-text class="text-center py-8">
        <v-icon size="56" color="primary">mdi-file-outline</v-icon>
        <p class="text-h6 mt-4">No register maps found</p>
        <p class="text-body-2 text-grey">
          Add JSON files to <code>public/register</code> and list them in <code>manifest.json</code> to populate this view.
        </p>
        <v-btn color="primary" variant="outlined" class="mt-4" @click="reloadManifest">
          <v-icon start>mdi-refresh</v-icon>
          Rescan Manifest
        </v-btn>
      </v-card-text>
    </v-card>

    <v-card class="mb-4" v-if="registerStore.isManifestLoading">
      <v-card-text class="d-flex align-center justify-center py-6">
        <v-progress-circular indeterminate color="primary" class="mr-3"></v-progress-circular>
        <span class="text-body-1">Loading register manifest...</span>
      </v-card-text>
    </v-card>

    <template v-if="registerStore.manifest.length">
      <v-tabs
        v-model="tabModel"
        show-arrows
        class="mb-4"
        density="compact"
        @update:model-value="handleTabChange"
      >
        <v-tab
          v-for="entry in registerStore.manifest"
          :key="entry.id"
          :value="entry.id"
          class="text-none"
        >
          <v-icon
            v-if="entry.icon"
            start
            size="18"
          >
            {{ entry.icon }}
          </v-icon>
          {{ entry.name }}
        </v-tab>
      </v-tabs>

      <v-window v-model="tabModel">
        <v-window-item
          v-for="entry in registerStore.manifest"
          :key="entry.id"
          :value="entry.id"
        >
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" color="primary">{{ entry.icon || 'mdi-table-eye' }}</v-icon>
              <div>
                <div class="text-h6">{{ entry.name }}</div>
                <div class="text-body-2 text-grey">{{ entry.description }}</div>
              </div>
            </v-card-title>
          </v-card>

          <v-card v-if="isMapLoading(entry.id)" variant="outlined">
            <v-card-text class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="56"></v-progress-circular>
              <p class="text-h6 mt-4">Loading {{ entry.name }}...</p>
              <p class="text-body-2 text-grey">Fetching register definition file</p>
            </v-card-text>
          </v-card>

          <v-row v-else>
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
        </v-window-item>
      </v-window>
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
import { computed, ref, onMounted, watch } from 'vue'
import { useRegisterStore } from '../stores/registerStore'
import type { RegisterType } from '../types/RegisterTypes'
import ByteType from '../components/custom/ByteType.vue'
import ControlRegister from '../components/custom/ControlRegister.vue'
import Indicator from '../components/custom/Indicator.vue'
import Slider from '../components/custom/Slider.vue'
import Combobox from '../components/custom/Combobox.vue'

const registerStore = useRegisterStore()
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const tabModel = ref<string>('')

const isAnyLoading = computed(() => registerStore.isManifestLoading || registerStore.isLoading)

watch(
  () => registerStore.activeMapId,
  (id) => {
    if (id && tabModel.value !== id) {
      tabModel.value = id
    }
  }
)

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

function isMapLoading(id: string) {
  return registerStore.isLoading && registerStore.activeMapId === id
}

async function handleTabChange(value: unknown) {
  if (typeof value !== 'string' || !value || value === registerStore.activeMapId) {
    return
  }

  try {
    await registerStore.setActiveMap(value)
  } catch (error) {
    snackbarMessage.value = error instanceof Error ? error.message : 'Failed to switch register map'
    snackbarColor.value = 'error'
    showSnackbar.value = true
    tabModel.value = registerStore.activeMapId ?? ''
  }
}

async function reloadManifest() {
  try {
    await registerStore.loadManifest()
    snackbarMessage.value = 'Register manifest refreshed'
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    snackbarMessage.value = error instanceof Error ? error.message : 'Failed to load manifest'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  }
}

onMounted(async () => {
  if (!registerStore.manifest.length) {
    try {
      await registerStore.loadManifest()
    } catch (error) {
      snackbarMessage.value = error instanceof Error ? error.message : 'Failed to load register manifest'
      snackbarColor.value = 'error'
      showSnackbar.value = true
    }
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
