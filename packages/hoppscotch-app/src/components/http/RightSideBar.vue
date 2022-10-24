<template>
  <div
    class="flex border-1 w-full relative overflow-hidden border-dividerLight"
  >
    <SmartTabs
      v-model="selectedNavigationTab"
      styles="sticky bg-primary z-10 top-0 "
      horizontal
      render-inactive-tabs
    >
      <SmartTab :id="'markdown'" label="Mark down" class="w-full">
        <HttpMarkDown ref="markdown" @onchange-text="handleDocs" />
      </SmartTab>

      <SmartTab :id="'preview'" label="Preview" class="w-full overflow-hidden">
        <HttpPreView ref="preview" :docs="text" :request="request" />
      </SmartTab>
    </SmartTabs>
    <ButtonSecondary
      v-if="OPEN_DOCS"
      v-tippy="{ theme: 'tooltip' }"
      title="close"
      :icon="XIcon"
      class="rounded hover:bg-primaryDark focus-visible:bg-primaryDark button-close z-10"
      @click="handleCloseDocs()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useSetting, applySetting } from "~/newstore/settings"
import { useReadonlyStream } from "@composables/stream"
import { getRESTRequest, restRequest$ } from "~/newstore/RESTSession"
import XIcon from "~icons/lucide/x"
type RequestOptionTabs = "preview" | "markdown"

const selectedNavigationTab = ref<RequestOptionTabs>("preview")
const text = ref("")
const OPEN_DOCS = useSetting("OPEN_DOCS")

const request = useReadonlyStream(restRequest$, getRESTRequest())

const handleDocs = (docs: string) => {
  text.value = docs
}

const handleCloseDocs = () => {
  applySetting("OPEN_DOCS", false)
  OPEN_DOCS.value = false
}
</script>

<style lang="scss" scoped>
.button-close {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
