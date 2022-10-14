<template>
  <div v-if="shouldRender" v-show="active" class="flex flex-col flex-1 tab">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, inject, computed, watch } from "vue"
import { TabMeta, TabProvider } from "./RequestTabs.vue"

const props = withDefaults(
  defineProps<{
    id: string
    name?: string
    method?: string
    disabled?: boolean
    indicator?: boolean
  }>(),
  {
    name: "Untitled Request",
    method: "GET",
    disabled: false,
    indicator: false,
  }
)

const tabMeta = computed<TabMeta>(() => ({
  name: props.name,
  method: props.method,
  disabled: props.disabled,
  indicator: props.indicator,
}))

const {
  activeTabID,
  renderInactive,
  addTabEntry,
  updateTabEntry,
  removeTabEntry,
} = inject<TabProvider>("tabs-system")!

const active = computed(() => activeTabID.value === props.id)

const shouldRender = computed(() => {
  // If render inactive is true, then it should be rendered nonetheless
  if (renderInactive.value) return true

  // Else, return whatever is the active state
  return active.value
})

onMounted(() => {
  addTabEntry(props.id, tabMeta.value)
})

watch(tabMeta, (newMeta) => {
  updateTabEntry(props.id, newMeta)
})

onBeforeUnmount(() => {
  removeTabEntry(props.id)
})
</script>

<style lang="scss" scoped></style>
