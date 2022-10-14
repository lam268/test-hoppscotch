<!-- eslint-disable vue/valid-v-model -->
<template>
  <SmartRequestTabs v-model="(currentRequest as string)">
    <SmartRequestTab
      v-for="(tab, index) in tabRequestStore.value.state"
      :id="tab.id || 'tab-' + index"
      :key="tab.id || 'tab-' + index"
      :name="tab.name"
      :method="tab.method"
    >
      <slot></slot>
    </SmartRequestTab>
  </SmartRequestTabs>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { tabRequestStore, ITab } from "~/newstore/tabRequest"

const currentRequest = ref<ITab["id"] | null>(
  tabRequestStore.value.state[0].id || null
)
</script>

<route lang="yaml">
meta:
  layout: default
</route>
