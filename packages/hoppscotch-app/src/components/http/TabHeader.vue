<!-- eslint-disable vue/valid-v-model -->
<template>
  <SmartRequestTabs v-model="(currentRequest as string)">
    <SmartRequestTab
      v-for="(tab, index) in getTabsRequest()"
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
import { getTabsRequest } from "~/newstore/TABSession"

const firstTab = getTabsRequest()[0]

const currentRequest = ref<string | undefined | null>(
  firstTab ? firstTab.id : null
)
</script>

<route lang="yaml">
meta:
  layout: default
</route>
