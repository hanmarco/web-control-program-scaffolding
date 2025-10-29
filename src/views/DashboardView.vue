<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">IC Evaluation Board Control</h1>
      </v-col>
    </v-row>

    <v-row v-if="!registerStore.registerMap">
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
            <p class="text-h6 mt-4">No Register Map Loaded</p>
            <p class="text-body-2 text-grey">Please load a register map from the settings page</p>
            <v-btn color="primary" class="mt-4" to="/settings">
              Go to Settings
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <template v-else>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              {{ registerStore.registerMap.name }}
            </v-card-title>
            <v-card-subtitle v-if="registerStore.registerMap.description">
              {{ registerStore.registerMap.description }}
            </v-card-subtitle>
            <v-card-text>
              <v-chip class="mr-2" size="small">
                Version: {{ registerStore.registerMap.version }}
              </v-chip>
              <v-chip size="small">
                Default Slave: {{ registerStore.registerMap.defaultSlaveAddress }}
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

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
  </v-container>
</template>

<script setup lang="ts">
import { useRegisterStore } from '../stores/registerStore'
import type { RegisterType } from '../types/RegisterTypes'
import ByteType from '../components/custom/ByteType.vue'
import Indicator from '../components/custom/Indicator.vue'
import Slider from '../components/custom/Slider.vue'
import Combobox from '../components/custom/Combobox.vue'

const registerStore = useRegisterStore()

function getComponentForType(type: RegisterType) {
  switch (type) {
    case 'byte':
      return ByteType
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
</script>

<style scoped>
/* Add any custom styles here */
</style>
