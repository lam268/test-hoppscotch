<!-- eslint-disable @typescript-eslint/ban-ts-comment -->
<template>
  <div class="w-full p-4 font-mono h-full">
    <textarea
      v-model="requestDocument"
      class="w-full p-4 font-mono bg-primary text-editor h-full"
    />
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it"

import EmojiPlugin from "markdown-it-emoji"
import { watch } from "vue"
import { useRESTRequestDocument } from "~/newstore/RESTSession"

const requestDocument = useRESTRequestDocument()
const converter = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(EmojiPlugin)

const emit = defineEmits<{
  (e: "onchange-text", docs: string): void
}>()

emit("onchange-text", converter.render(requestDocument.value))

watch(
  () => requestDocument.value,
  (value) => {
    if (value) {
      emit("onchange-text", converter.render(value))
    }
  }
)
</script>
<style scoped lang="scss">
::v-deep(.text-editor) {
  max-width: 100%;
  font-size: 16px;
  line-height: 2;
  white-space: pre-wrap; /* CSS3 */
  white-space: -moz-pre-wrap; /* Firefox */
  white-space: -pre-wrap; /* Opera <7 */
  white-space: -o-pre-wrap; /* Opera 7 */
  word-wrap: break-word; /* IE */
  overflow-y: scroll;
  height: 100%;
  resize: none;
}
</style>
