<template>
  <SmartModal v-if="show" dialog :title="t('team.edit')" @close="hideModal">
    <template #body>
      <div class="flex flex-col">
        <div class="relative flex">
          <input
            id="selectLabelTeamEdit"
            v-model="name"
            v-focus
            class="input floating-input"
            placeholder=" "
            type="text"
            autocomplete="off"
            @keyup.enter="saveTeam"
          />
          <label for="selectLabelTeamEdit">
            {{ t("action.label") }}
          </label>
        </div>
        <div class="flex items-center justify-between flex-1 pt-4">
          <label for="memberList" class="p-4">
            {{ t("team.members") }}
          </label>
          <div class="flex">
            <ButtonSecondary
              :icon="IconUserPlus"
              :label="t('team.invite')"
              filled
              @click="
                () => {
                  emit('invite-team')
                }
              "
            />
          </div>
        </div>
        <div
          v-if="teamDetails.loading"
          class="flex flex-col items-center justify-center"
        >
          <SmartSpinner class="mb-4" />
          <span class="text-secondaryLight">{{ t("state.loading") }}</span>
        </div>
        <div
          v-if="teamDetails.teamMembers"
          class="border rounded divide-y divide-dividerLight border-divider"
        >
          <div
            v-if="teamDetails.teamMembers.length === 0"
            class="flex flex-col items-center justify-center p-4 text-secondaryLight"
          >
            <img
              :src="`/images/states/${colorMode.value}/add_group.svg`"
              loading="lazy"
              class="inline-flex flex-col object-contain object-center w-16 h-16 my-4"
              :alt="`${t('empty.members')}`"
            />
            <span class="pb-4 text-center">
              {{ t("empty.members") }}
            </span>
            <ButtonSecondary
              :icon="IconUserPlus"
              :label="t('team.invite')"
              @click="
                () => {
                  emit('invite-team')
                }
              "
            />
          </div>
          <div v-else>
            <div
              v-for="(member, index) in membersList"
              :key="`member-${index}`"
              class="flex divide-x divide-dividerLight"
            >
              <input
                class="flex flex-1 px-4 py-2 bg-transparent"
                :placeholder="`${t('team.email')}`"
                :name="'param' + index"
                :value="member.email"
                readonly
              />
              <span>
                <tippy interactive trigger="click" theme="popover">
                  <span class="select-wrapper">
                    <input
                      class="flex flex-1 px-4 py-2 bg-transparent cursor-pointer"
                      :placeholder="`${t('team.permissions')}`"
                      :name="'value' + index"
                      :value="member.role"
                      readonly
                    />
                  </span>
                  <template #content="{ hide }">
                    <div
                      ref="tippyActions"
                      class="flex flex-col focus:outline-none"
                      tabindex="0"
                      @keyup.escape="hide()"
                    >
                      <SmartItem
                        label="OWNER"
                        :icon="
                          member.role === 'OWNER' ? IconCircleDot : IconCircle
                        "
                        :active="member.role === 'OWNER'"
                        @click="
                          () => {
                            updateMemberRole(
                              member.userID,
                              TeamMemberRole.Owner,
                              member.membershipID
                            )
                            hide()
                          }
                        "
                      />
                      <SmartItem
                        label="EDITOR"
                        :icon="
                          member.role === 'EDITOR' ? IconCircleDot : IconCircle
                        "
                        :active="member.role === 'EDITOR'"
                        @click="
                          () => {
                            updateMemberRole(
                              member.userID,
                              TeamMemberRole.Editor,
                              member.membershipID
                            )
                            hide()
                          }
                        "
                      />
                      <SmartItem
                        label="VIEWER"
                        :icon="
                          member.role === 'VIEWER' ? IconCircleDot : IconCircle
                        "
                        :active="member.role === 'VIEWER'"
                        @click="
                          () => {
                            updateMemberRole(
                              member.userID,
                              TeamMemberRole.Viewer,
                              member.membershipID
                            )
                            hide()
                          }
                        "
                      />
                    </div>
                  </template>
                </tippy>
              </span>
              <div class="flex">
                <ButtonSecondary
                  id="member"
                  v-tippy="{ theme: 'tooltip' }"
                  :title="t('action.remove')"
                  :icon="IconUserMinus"
                  color="red"
                  :loading="isLoadingIndex === index"
                  @click="removeExistingTeamMember(member, index)"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-if="!teamDetails.teamMembers" class="flex flex-col items-center">
          <component :is="IconHelpCircle" class="mb-4 svg-icons" />
          {{ t("error.something_went_wrong") }}
        </div>
      </div>
    </template>
    <template #footer>
      <span class="flex space-x-2">
        <ButtonPrimary
          :label="t('action.save')"
          :loading="isLoading"
          outline
          @click="saveTeam"
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
import { computed, ref, toRef, watch } from "vue"
import { TeamMemberRole } from "~/helpers/backend/graphql"

import { TeamNameCodec } from "~/helpers/backend/types/TeamName"

import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"
import { useColorMode } from "@composables/theming"

import IconCircleDot from "~icons/lucide/circle-dot"
import IconCircle from "~icons/lucide/circle"
import IconUserPlus from "~icons/lucide/user-plus"
import IconUserMinus from "~icons/lucide/user-minus"
import IconHelpCircle from "~icons/lucide/help-circle"
import TeamListAdapter from "~/helpers/teams/TeamListAdapter"
import { useAxios } from "~/composables/axios"

const t = useI18n()
const colorMode = useColorMode()

const emit = defineEmits<{
  (e: "hide-modal"): void
  (e: "refetch-teams"): void
  (e: "invite-team"): void
}>()

// Template refs
const tippyActions = ref<any | null>(null)

const props = defineProps<{
  show: boolean
  editingTeam: {
    name: string
    myRole: TeamMemberRole
    membershipID: string
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
  editingTeamID: string
}>()

const toast = useToast()
const axios = useAxios()

const name = toRef(props.editingTeam, "name")
const teamDetails = ref(props.editingTeam)
const adapter = new TeamListAdapter(true)
const editingTeamID = ref(props.editingTeamID)

watch(
  () => props.editingTeam.name,
  (newName: string) => {
    name.value = newName
  }
)

watch(
  () => props.editingTeamID,
  (teamID: string) => {
    editingTeamID.value = teamID
  }
)

watch(
  () => props.show,
  async (show) => {
    if (!show) {
      await adapter.fetchList()
    } else {
      teamDetails.value = props.editingTeam
    }
  }
)

const roleUpdates = ref<
  {
    userID: string
    membershipID: string
    role: TeamMemberRole
  }[]
>([])

watch(
  () => teamDetails,
  () => {
    const members = props.editingTeam.teamMembers ?? []

    // Remove deleted members
    roleUpdates.value = roleUpdates.value.filter(
      (update) => members.findIndex((y) => y.user.id === update.userID) !== -1
    )
  },
  {
    immediate: true,
  }
)

const updateMemberRole = (
  userID: string,
  role: TeamMemberRole,
  membershipID: string
) => {
  const updateIndex = roleUpdates.value.findIndex(
    (item) => item.userID === userID
  )
  if (updateIndex !== -1) {
    // Role Update exists
    roleUpdates.value[updateIndex].role = role
    roleUpdates.value[updateIndex].membershipID = membershipID
  } else {
    // Role Update does not exist
    roleUpdates.value.push({
      userID,
      membershipID,
      role,
    })
  }
}

const membersList = computed(() => {
  const members = (props.editingTeam.teamMembers ?? []).map((member) => {
    const updatedRole = roleUpdates.value.find(
      (update) => update.userID === member.user.id
    )
    return {
      userID: member.user.id,
      membershipID: member.membershipID,
      email: member.user.email!,
      role: updatedRole?.role ?? member.role,
    }
  })

  return members
})
const isLoadingIndex = ref<null | number>(null)

const removeExistingTeamMember = async (member: any, index: number) => {
  isLoadingIndex.value = index
  membersList.value.splice(index, 1)
  const removeTeamMemberResult = await axios.post("/team-users/delete-member", {
    teamUserId: member.membershipID,
    userRole: props.editingTeam.myRole,
  })
  if (removeTeamMemberResult?.status !== 200) {
    toast.error(`${t("error.something_went_wrong")}`)
  } else {
    toast.success(`${t("team.member_removed")}`)
    emit("refetch-teams")
  }
  isLoadingIndex.value = null
}

const isLoading = ref(false)

const saveTeam = async () => {
  isLoading.value = true
  if (name.value !== "") {
    if (TeamNameCodec.is(name.value)) {
      const updateTeamNameResult = await axios.put(
        `/teams/${props.editingTeamID}`,
        {
          name: name.value,
        }
      )
      if (updateTeamNameResult.status !== 200) {
        toast.error(`${t("error.something_went_wrong")}`)
      } else {
        roleUpdates.value.forEach(async (update) => {
          const updateMemberRoleResult = await axios.put(
            `/team-users/${update.membershipID}`,
            {
              role: update.role,
            }
          )
          if (updateMemberRoleResult.status !== 200) {
            toast.error(
              updateMemberRoleResult.data?.message ||
                `${t("error.something_went_wrong")}`
            )
          }
        })
      }
      hideModal()
      toast.success(`${t("team.saved")}`)
    } else {
      toast.error(`${t("team.name_length_insufficient")}`)
    }
  } else {
    toast.error(`${t("empty.team_name")}`)
  }
  isLoading.value = false
}

const hideModal = () => {
  emit("hide-modal")
}
</script>
