<template>
  <SmartRequestTabs v-model="currentRequest">
    <SmartRequestTab
      v-for="{ target, title } in tabRequestStore.value.state"
      :id="target"
      :key="target"
      :label="title"
    >
      <slot></slot>
    </SmartRequestTab>
  </SmartRequestTabs>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { tabRequestStore } from "~/newstore/tabRequest"

const currentRequest = ref("websocket")
</script>

<route lang="yaml">
meta:
  layout: default
</route>
