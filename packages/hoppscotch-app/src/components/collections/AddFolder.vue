<template>
  <SmartModal
    v-if="show"
    dialog
    :title="t('folder.new')"
    @close="$emit('hide-modal')"
  >
    <template #body>
      <div class="flex flex-col">
        <input
          id="selectLabelAddFolder"
          v-model="title"
          v-focus
          class="input floating-input"
          placeholder=" "
          type="text"
          autocomplete="off"
          @keyup.enter="addFolder"
        />
        <label for="selectLabelAddFolder">
          {{ t("action.label") }}
        </label>
      </div>
    </template>
    <template #footer>
      <span class="flex space-x-2">
        <ButtonPrimary
          :label="t('action.save')"
          :loading="loadingState"
          outline
          @click="addFolder"
        />
        <ButtonSecondary
          :label="t('action.cancel')"
          outline
          filled
          @click="hideModal"
        />
      </span>
    </template>
  </SmartModal>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"

export default defineComponent({
  props: {
    show: Boolean,
    folder: { type: Object, default: () => ({}) },
    folderPath: { type: String, default: null },
    collectionIndex: { type: Number, default: null },
    loadingState: Boolean,
  },
  emits: ["hide-modal", "add-folder"],
  setup() {
    return {
      toast: useToast(),
      t: useI18n(),
    }
  },
  data() {
    return {
      title: null,
    }
  },
  watch: {
    show(isShowing: boolean) {
      if (!isShowing) this.title = null
    },
  },
  methods: {
    addFolder() {
      if (!this.title) {
        this.toast.error(this.t("folder.invalid_name"))
        return
      }
      this.$emit("add-folder", {
        title: this.title,
        folder: this.folder,
        path: this.folderPath || `${this.collectionIndex}`,
      })
    },
    hideModal() {
      this.title = null
      this.$emit("hide-modal")
    },
  },
})
</script>
