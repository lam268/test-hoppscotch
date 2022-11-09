<template>
  <div
    class="flex flex-col flex-1 border rounded border-divider"
    @contextmenu.prevent="!compact ? options.tippy.show() : null"
  >
    <div
      class="flex items-start flex-1"
      :class="
        compact
          ? team.myRole === TeamMemberRole.Owner
            ? 'cursor-pointer hover:bg-primaryDark transition hover:border-dividerDark focus-visible:border-dividerDark'
            : 'cursor-not-allowed bg-primaryLight'
          : ''
      "
      @click="
        compact
          ? team.myRole === TeamMemberRole.Owner
            ? $emit('invite-team')
            : noPermission()
          : ''
      "
    >
      <div class="p-4">
        <label
          class="font-semibold text-secondaryDark"
          :class="{
            'cursor-pointer': compact && team.myRole === TeamMemberRole.Owner,
          }"
        >
          {{ team.name || t("state.nothing_found") }}
        </label>
        <div class="flex mt-2 overflow-hidden -space-x-1">
          <div
            v-for="(member, index) in team.teamMembers"
            :key="`member-${index}`"
            v-tippy="{ theme: 'tooltip' }"
            :title="
              member.user.displayName ||
              member.user.email ||
              t('default_hopp_displayName')
            "
            class="inline-flex"
          >
            <ProfilePicture
              v-if="member.user.photoURL"
              :url="member.user.photoURL"
              :alt="member.user.displayName"
              class="ring-primary ring-2"
            />
            <ProfilePicture
              v-else
              :initial="member.user.displayName || member.user.email"
              class="ring-primary ring-2"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="!compact" class="flex items-end justify-between flex-shrink-0">
      <span>
        <ButtonSecondary
          v-if="team.myRole === TeamMemberRole.Owner"
          :icon="IconEdit"
          class="rounded-none"
          :label="t('action.edit')"
          @click="
            () => {
              $emit('edit-team')
            }
          "
        />
        <ButtonSecondary
          v-if="team.myRole === TeamMemberRole.Owner"
          :icon="IconUserPlus"
          class="rounded-none"
          :label="t('team.invite')"
          @click="
            () => {
              emit('invite-team')
            }
          "
        />
      </span>
      <span>
        <tippy
          ref="options"
          interactive
          trigger="click"
          theme="popover"
          :on-shown="() => tippyActions.focus()"
        >
          <ButtonSecondary
            v-tippy="{ theme: 'tooltip' }"
            :title="t('action.more')"
            :icon="IconMoreVertical"
          />
          <template #content="{ hide }">
            <div
              ref="tippyActions"
              class="flex flex-col focus:outline-none"
              tabindex="0"
              @keyup.e="
                team.myRole === TeamMemberRole.Owner ? edit.$el.click() : null
              "
              @keyup.x="
                !(team.myRole === TeamMemberRole.Owner && team.ownersCount == 1)
                  ? exit.$el.click()
                  : null
              "
              @keyup.delete="
                team.myRole === TeamMemberRole.Owner
                  ? deleteAction.$el.click()
                  : null
              "
              @keyup.escape="hide()"
            >
              <SmartItem
                v-if="team.myRole === TeamMemberRole.Owner"
                ref="edit"
                :icon="IconEdit"
                :label="t('action.edit')"
                :shortcut="['E']"
                @click="
                  () => {
                    $emit('edit-team')
                    hide()
                  }
                "
              />
              <SmartItem
                v-if="
                  !(
                    team.myRole === TeamMemberRole.Owner &&
                    team.ownersCount == 1
                  )
                "
                ref="exit"
                :icon="IconUserX"
                :label="t('team.exit')"
                :shortcut="['X']"
                @click="
                  () => {
                    confirmExit = true
                    hide()
                  }
                "
              />
              <SmartItem
                v-if="team.myRole === TeamMemberRole.Owner"
                ref="deleteAction"
                :icon="IconTrash2"
                :label="t('action.delete')"
                :shortcut="['⌫']"
                @click="
                  () => {
                    confirmRemove = true
                    hide()
                  }
                "
              />
            </div>
          </template>
        </tippy>
      </span>
    </div>
    <SmartConfirmModal
      :show="confirmRemove"
      :title="t('confirm.remove_team')"
      @hide-modal="confirmRemove = false"
      @resolve="deleteTeam()"
    />
    <SmartConfirmModal
      :show="confirmExit"
      :title="t('confirm.exit_team')"
      @hide-modal="confirmExit = false"
      @resolve="exitTeam()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { TeamMemberRole } from "~/helpers/backend/graphql"

import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"

import IconEdit from "~icons/lucide/edit"
import IconMoreVertical from "~icons/lucide/more-vertical"
import IconUserX from "~icons/lucide/user-x"
import IconUserPlus from "~icons/lucide/user-plus"
import IconTrash2 from "~icons/lucide/trash-2"
import { useAxios } from "~/composables/axios"

const t = useI18n()
const axios = useAxios()
const props = defineProps<{
  team: {
    id: string
    name: string
    myRole: TeamMemberRole
    membershipID: string
    ownersCount: number
    teamMembers: Array<{
      role: string
      membershipID: string
      user: {
        id: string
        email: string
        displayName: string
        photoURL: string | null
      }
    }>
  }
  compact: boolean
}>()

const emit = defineEmits<{
  (e: "edit-team"): void
  (e: "invite-team"): void
}>()

const toast = useToast()

const confirmRemove = ref(false)
const confirmExit = ref(false)

const deleteTeam = async () => {
  try {
    await axios.delete(`/teams/${props.team.id}`)
    toast.success(`${t("team.deleted")}`)
  } catch (err) {
    toast.error(
      err.response?.data?.message || `${t("error.something_went_wrong")}`
    )
  }
}

const exitTeam = async () => {
  try {
    await axios.delete(`/team-users/${props.team.membershipID}`)
    toast.success(`${t("team.left")}`)
  } catch (err) {
    toast.error(
      err.response?.data?.message || `${t("error.something_went_wrong")}`
    )
  }
}

const noPermission = () => {
  toast.error(`${t("profile.no_permission")}`)
}

// Template refs
const tippyActions = ref<any | null>(null)
const options = ref<any | null>(null)
const edit = ref<any | null>(null)
const deleteAction = ref<any | null>(null)
const exit = ref<any | null>(null)
</script>
