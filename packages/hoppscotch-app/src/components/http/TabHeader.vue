<!-- eslint-disable vue/valid-v-model -->
<template>
  <SmartRequestTabs v-model="(currentRequest as string)">
    <SmartRequestTab
      v-for="tab in tabsRequest"
      :id="(tab.tabId as string)"
      :key="tab.tabId"
      :name="tab.name"
      :method="tab.method"
    >
      <slot></slot>
    </SmartRequestTab>
  </SmartRequestTabs>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { getTabsRequest, tabsRequest$ } from "~/newstore/TABSession"

const tabsRequest = ref(getTabsRequest())
const firstTab = tabsRequest.value[0]
const currentRequest = ref<string | undefined | null>(
  firstTab ? firstTab.tabId : null
)

tabsRequest$.subscribe((tabs) => {
  tabsRequest.value = tabs
})
</script>

<route lang="yaml">
meta:
  layout: default
</route>
