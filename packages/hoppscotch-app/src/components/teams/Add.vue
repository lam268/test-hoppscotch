<template>
  <SmartModal v-if="show" dialog :title="t('team.new')" @close="hideModal">
    <template #body>
      <div class="flex flex-col">
        <input
          id="selectLabelTeamAdd"
          v-model="name"
          v-focus
          class="input floating-input"
          placeholder=" "
          type="text"
          autocomplete="off"
          @keyup.enter="addNewTeam"
        />
        <label for="selectLabelTeamAdd">
          {{ t("action.label") }}
        </label>
      </div>
    </template>
    <template #footer>
      <span class="flex space-x-2">
        <ButtonPrimary
          :label="t('action.save')"
          :loading="isLoading"
          outline
          @click="addNewTeam"
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

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"
import { useAxios } from "~/composables/axios"

const t = useI18n()

const toast = useToast()
const axios = useAxios()

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: "hide-modal"): void
}>()

const name = ref<string | null>(null)

const isLoading = ref(false)

const addNewTeam = async () => {
  isLoading.value = true
  try {
    await axios.post("/teams", { name: name.value })
    toast.success(`${t("team.new_created")}`)
    hideModal()
  } catch (err) {
    toast.error(`${err.response.data.message}`)
  }

  isLoading.value = false
}

const hideModal = () => {
  name.value = null
  emit("hide-modal")
}
</script>
