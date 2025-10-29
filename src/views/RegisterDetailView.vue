<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="$router.back()"
        >
          Back to Dashboard
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="register">
      <v-col cols="12" md="8" lg="6">
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

      <v-col cols="12" md="4" lg="6">
        <v-card>
          <v-card-title>Register Information</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Address</v-list-item-title>
                <v-list-item-subtitle>{{ register.address }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Name</v-list-item-title>
                <v-list-item-subtitle>{{ register.name }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Type</v-list-item-title>
                <v-list-item-subtitle>{{ register.type }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Writable</v-list-item-title>
                <v-list-item-subtitle>{{ register.writable ? 'Yes' : 'No' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="register.description">
                <v-list-item-title>Description</v-list-item-title>
                <v-list-item-subtitle>{{ register.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <v-alert type="error">
          Register not found
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRegisterStore } from '../stores/registerStore'
import type { RegisterType } from '../types/RegisterTypes'
import ByteType from '../components/custom/ByteType.vue'
import Indicator from '../components/custom/Indicator.vue'
import Slider from '../components/custom/Slider.vue'
import Combobox from '../components/custom/Combobox.vue'

const props = defineProps<{
  address: string
}>()

const registerStore = useRegisterStore()

const register = computed(() => {
  return registerStore.getRegister(props.address)
})

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
