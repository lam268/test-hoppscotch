<template>
  <SmartModal v-if="show" dialog :title="t('team.invite')" @close="hideModal">
    <template #body>
      <div v-if="sendInvitesResult.length" class="flex flex-col px-4">
        <div class="flex flex-col items-center justify-center max-w-md">
          <icon-lucide-users class="w-6 h-6 text-accent" />
          <h3 class="my-2 text-lg text-center">
            {{ t("team.we_sent_invite_link") }}
          </h3>
          <p class="text-center">
            {{ t("team.we_sent_invite_link_description") }}
          </p>
        </div>
        <div
          class="flex flex-col p-4 mt-8 border rounded space-y-6 border-dividerLight"
        >
          <div
            v-for="(invitee, index) in sendInvitesResult"
            :key="`invitee-${index}`"
          >
            <p class="flex items-center">
              <component
                :is="
                  invitee.status === 'error' ? IconAlertTriangle : IconMailCheck
                "
                class="mr-4 svg-icons"
                :class="
                  invitee.status === 'error' ? 'text-red-500' : 'text-green-500'
                "
              />
              <span class="truncate">{{ invitee.email }}</span>
            </p>
            <p v-if="invitee.status === 'error'" class="mt-2 ml-8 text-red-500">
              {{ getErrorMessage(invitee.error) }}
            </p>
          </div>
        </div>
      </div>
      <div
        v-else-if="sendingInvites"
        class="flex items-center justify-center p-4"
      >
        <SmartSpinner />
      </div>
      <div v-else class="flex flex-col">
        <div class="flex items-center justify-between flex-1">
          <label for="memberList" class="px-4 pb-4">
            {{ t("team.pending_invites") }}
          </label>
        </div>
        <div class="border rounded divide-y divide-dividerLight border-divider">
          <div
            v-if="!pendingInvites"
            class="flex items-center justify-center p-4"
          >
            <SmartSpinner />
          </div>
          <div v-else>
            <div v-if="pendingInvites">
              <div
                v-for="(invitee, index) in pendingInvites"
                :key="`invitee-${index}`"
                class="flex divide-x divide-dividerLight"
              >
                <input
                  v-if="invitee"
                  class="flex flex-1 px-4 py-2 bg-transparent text-secondaryLight"
                  :placeholder="`${t('team.email')}`"
                  :name="'param' + index"
                  :value="invitee.userEmail"
                  readonly
                />
                <input
                  class="flex flex-1 px-4 py-2 bg-transparent text-secondaryLight"
                  :placeholder="`${t('team.permissions')}`"
                  :name="'value' + index"
                  :value="invitee.role"
                  readonly
                />
                <div class="flex">
                  <ButtonSecondary
                    v-tippy="{ theme: 'tooltip' }"
                    :title="t('action.remove')"
                    :icon="IconTrash"
                    color="red"
                    :loading="isLoadingIndex === index"
                    @click="removeInvitee(invitee.teamUserId, index)"
                  />
                </div>
              </div>
            </div>
            <div
              v-if="pendingInvites.length === 0"
              class="flex flex-col items-center justify-center p-4 text-secondaryLight"
            >
              <span class="text-center">
                {{ t("empty.pending_invites") }}
              </span>
            </div>
            <div v-if="!pendingInvites" class="flex flex-col items-center p-4">
              <component :is="IconHelpCircle" class="mb-4 svg-icons" />
              {{ t("error.something_went_wrong") }}
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between flex-1 pt-4">
          <label for="memberList" class="p-4">
            {{ t("team.invite_tooltip") }}
          </label>
          <div class="flex">
            <ButtonSecondary
              :icon="IconPlus"
              :label="t('add.new')"
              filled
              @click="addNewInvitee"
            />
          </div>
        </div>
        <div class="border rounded divide-y divide-dividerLight border-divider">
          <div
            v-for="(invitee, index) in newInvites"
            :key="`new-invitee-${index}`"
            class="flex divide-x divide-dividerLight"
          >
            <input
              v-model="invitee.key"
              class="flex flex-1 px-4 py-2 bg-transparent"
              :placeholder="`${t('team.email')}`"
              :name="'invitee' + index"
              autofocus
            />
            <span>
              <tippy
                interactive
                trigger="click"
                theme="popover"
                :on-shown="() => tippyActions![index].focus()"
              >
                <span class="select-wrapper">
                  <input
                    class="flex flex-1 px-4 py-2 bg-transparent cursor-pointer"
                    :placeholder="`${t('team.permissions')}`"
                    :name="'value' + index"
                    :value="invitee.value"
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
                        invitee.value === 'OWNER' ? IconCircleDot : IconCircle
                      "
                      :active="invitee.value === 'OWNER'"
                      @click="
                        () => {
                          updateNewInviteeRole(index, TeamMemberRole.Owner)
                          hide()
                        }
                      "
                    />
                    <SmartItem
                      label="EDITOR"
                      :icon="
                        invitee.value === 'EDITOR' ? IconCircleDot : IconCircle
                      "
                      :active="invitee.value === 'EDITOR'"
                      @click="
                        () => {
                          updateNewInviteeRole(index, TeamMemberRole.Editor)
                          hide()
                        }
                      "
                    />
                    <SmartItem
                      label="VIEWER"
                      :icon="
                        invitee.value === 'VIEWER' ? IconCircleDot : IconCircle
                      "
                      :active="invitee.value === 'VIEWER'"
                      @click="
                        () => {
                          updateNewInviteeRole(index, TeamMemberRole.Viewer)
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
                :icon="IconTrash"
                color="red"
                @click="removeNewInvitee(index)"
              />
            </div>
          </div>
          <div
            v-if="newInvites.length === 0"
            class="flex flex-col items-center justify-center p-4 text-secondaryLight"
          >
            <img
              :src="`/images/states/${colorMode.value}/add_group.svg`"
              loading="lazy"
              class="inline-flex flex-col object-contain object-center w-16 h-16 mb-4"
              :alt="`${t('empty.invites')}`"
            />
            <span class="pb-4 text-center">
              {{ t("empty.invites") }}
            </span>
            <ButtonSecondary
              :label="t('add.new')"
              filled
              @click="addNewInvitee"
            />
          </div>
        </div>
        <div
          v-if="newInvites.length"
          class="flex flex-col items-start px-4 py-4 mt-4 border rounded border-dividerLight"
        >
          <span
            class="flex items-center justify-center px-2 py-1 mb-4 font-semibold border rounded-full bg-primaryDark border-divider"
          >
            <component
              :is="IconHelpCircle"
              class="mr-2 text-secondaryLight svg-icons"
            />
            {{ t("profile.roles") }}
          </span>
          <p>
            <span class="text-secondaryLight">
              {{ t("profile.roles_description") }}
            </span>
          </p>
          <ul class="mt-4 space-y-4">
            <li class="flex">
              <span
                class="w-1/4 font-semibold uppercase truncate text-secondaryDark max-w-16"
              >
                {{ t("profile.owner") }}
              </span>
              <span class="flex flex-1">
                {{ t("profile.owner_description") }}
              </span>
            </li>
            <li class="flex">
              <span
                class="w-1/4 font-semibold uppercase truncate text-secondaryDark max-w-16"
              >
                {{ t("profile.editor") }}
              </span>
              <span class="flex flex-1">
                {{ t("profile.editor_description") }}
              </span>
            </li>
            <li class="flex">
              <span
                class="w-1/4 font-semibold uppercase truncate text-secondaryDark max-w-16"
              >
                {{ t("profile.viewer") }}
              </span>
              <span class="flex flex-1">
                {{ t("profile.viewer_description") }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </template>
    <template #footer>
      <p
        v-if="sendInvitesResult.length"
        class="flex justify-between flex-1 text-secondaryLight"
      >
        <ButtonSecondary
          class="link !p-0"
          :label="t('team.invite_more')"
          :icon="IconArrowLeft"
          @click="
            () => {
              sendInvitesResult = []
              newInvites = [
                {
                  key: '',
                  value: TeamMemberRole.Viewer,
                },
              ]
            }
          "
        />
        <ButtonSecondary
          class="link !p-0"
          :label="`${t('action.dismiss')}`"
          @click="hideModal"
        />
      </p>
      <span v-else class="flex space-x-2">
        <ButtonPrimary :label="t('team.invite')" outline @click="sendInvites" />
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
import { watch, ref } from "vue"

import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import { pipe } from "fp-ts/function"
import { Email, EmailCodec } from "../../helpers/backend/types/Email"
import { TeamMemberRole } from "../../helpers/backend/graphql"
import { CreateTeamInvitationErrors } from "../../helpers/backend/mutations/TeamInvitation"
import { GQLError } from "~/helpers/backend/GQLClient"

import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"
import { useColorMode } from "~/composables/theming"

import IconTrash from "~icons/lucide/trash"
import IconPlus from "~icons/lucide/plus"
import IconHelpCircle from "~icons/lucide/help-circle"
import IconAlertTriangle from "~icons/lucide/alert-triangle"
import IconMailCheck from "~icons/lucide/mail-check"
import IconCircleDot from "~icons/lucide/circle-dot"
import IconCircle from "~icons/lucide/circle"
import IconArrowLeft from "~icons/lucide/arrow-left"
import { TippyComponent } from "vue-tippy"
import { useAxios } from "~/composables/axios"

const t = useI18n()

const toast = useToast()
const axios = useAxios()

interface TeamInvitation {
  teamUserId: string
  role: string
  userEmail: string
  userId: string
}
const colorMode = useColorMode()
const pendingInvites = ref<TeamInvitation[]>([])

// Template refs
const tippyActions = ref<TippyComponent[] | null>(null)

const props = defineProps({
  show: Boolean,
  editingTeamID: { type: String, default: null },
})

const emit = defineEmits<{
  (e: "hide-modal"): void
}>()

const getPendingInvitesList = async (teamId: string) => {
  const response = await axios.get(
    `/team-users?teamId=${teamId}&acceptStatus=false`
  )
  pendingInvites.value = response.data.data.items
}

watch(
  () => props.show,
  async () => {
    await getPendingInvitesList(props.editingTeamID)
  }
)

const isLoadingIndex = ref<null | number>(null)

const removeInvitee = async (id: string, index: number) => {
  isLoadingIndex.value = index
  const result = await axios.delete(`/team-users/${id}`)
  if (!result) {
    toast.error(`${t("error.something_went_wrong")}`)
  } else {
    pendingInvites.value.splice(index, 1)
    toast.success(`${t("team.invite_remove")}`)
  }
  isLoadingIndex.value = null
}

const newInvites = ref<Array<{ key: string; value: TeamMemberRole }>>([
  {
    key: "",
    value: TeamMemberRole.Viewer,
  },
])

const addNewInvitee = () => {
  newInvites.value.push({
    key: "",
    value: TeamMemberRole.Viewer,
  })
}

const updateNewInviteeRole = (index: number, role: TeamMemberRole) => {
  newInvites.value[index].value = role
}

const removeNewInvitee = (id: number) => {
  newInvites.value.splice(id, 1)
}

type SendInvitesErrorType =
  | {
      email: Email
      status: "error"
      error: GQLError<CreateTeamInvitationErrors>
    }
  | {
      email: Email
      status: "success"
    }

const sendInvitesResult = ref<Array<SendInvitesErrorType>>([])

const sendingInvites = ref<boolean>(false)

const sendInvites = () => {
  sendingInvites.value = true
  const validationResult = pipe(
    newInvites.value,
    O.fromPredicate(
      (invites): invites is Array<{ key: Email; value: TeamMemberRole }> =>
        pipe(
          invites,
          A.every((invitee) => EmailCodec.is(invitee.key))
        )
    ),
    O.map(
      A.map(async (invitee) => {
        try {
          const res = await axios.post("/team-users/inviteUser", {
            email: invitee.key,
            role: invitee.value,
            teamId: props.editingTeamID,
          })
          pendingInvites.value.push({
            teamUserId: res.data?.data?.id,
            role: res.data?.data?.role,
            userEmail: res.data?.data?.userId?.email,
            userId: res.data?.data?.userId?.id,
          })
          await axios.post("/email", {
            to: invitee.key,
            teamUserId: res.data?.data?.id,
          })
        } catch (err) {
          toast.error(err.response?.data?.message)
        }
      })
    )
  )

  if (O.isNone(validationResult)) {
    // Error handling for no validation
    toast.error(`${t("error.incorrect_email")}`)
    sendingInvites.value = false
    return
  }
  newInvites.value = [
    {
      key: "",
      value: TeamMemberRole.Viewer,
    },
  ]
  getPendingInvitesList(props.editingTeamID).then(() => {
    toast.success("Send invited success")
    sendingInvites.value = false
  })
}

const getErrorMessage = (error: SendInvitesErrorType) => {
  if (error.type === "network_error") {
    return t("error.network_error")
  } else {
    switch (error.error) {
      case "team/invalid_id":
        return t("team.invalid_id")
      case "team/member_not_found":
        return t("team.member_not_found")
      case "team_invite/already_member":
        return t("team.already_member")
      case "team_invite/member_has_invite":
        return t("team.member_has_invite")
    }
  }
}

const hideModal = () => {
  sendingInvites.value = false
  sendInvitesResult.value = []
  newInvites.value = [
    {
      key: "",
      value: TeamMemberRole.Viewer,
    },
  ]
  emit("hide-modal")
}
</script>
