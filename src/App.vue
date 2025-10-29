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
          prepend-icon="mdi-cog"
          title="Settings"
          to="/settings"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>IC Evaluation Board Control</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-chip
        v-if="commStore.isConnected"
        color="success"
        variant="flat"
        prepend-icon="mdi-connection"
      >
        Connected
      </v-chip>
      <v-chip
        v-else
        color="grey"
        variant="flat"
        prepend-icon="mdi-connection"
      >
        Disconnected
      </v-chip>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <v-footer app>
      <v-container>
        <div class="text-center">
          <span class="text-caption">
            IC Evaluation Board Application v0.1.0 | Built with Vue 3 + Tauri
          </span>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCommunicationStore } from './stores/communicationStore'

const drawer = ref(false)
const commStore = useCommunicationStore()
</script>

<style>
/* Global styles */
</style>

