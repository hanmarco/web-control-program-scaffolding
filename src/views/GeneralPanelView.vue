<template>
  <v-container fluid>
    <v-row class="justify-end mb-4">
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
    </v-row>

    <v-row>
      <v-col
        v-for="index in panelIndices"
        :key="index"
        cols="12"
      >
        <RegisterBitPanel :source="`general-${index + 1}`" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import RegisterBitPanel from '../components/custom/RegisterBitPanel.vue'

const MIN_PANELS = 1
const MAX_PANELS = 256

const panelCount = ref<number>(MIN_PANELS)

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
</script>