<template>
  <div class="flex flex-col" :class="[{ 'bg-primaryLight': dragging }]">
    <div
      class="flex items-stretch group"
      draggable="false"
      @dragstart="dragStart"
      @dragover.stop
      @dragleave="dragging = false"
      @dragend="dragging = false"
      @contextmenu.prevent="options?.tippy.show()"
    >
      <span
        class="flex items-center justify-center w-16 px-2 truncate cursor-pointer"
        :class="getRequestLabelColor(request.method)"
        @click="selectRequest()"
      >
        <component
          :is="IconCheckCircle"
          v-if="isSelected"
          class="svg-icons"
          :class="{ 'text-accent': isSelected }"
        />
        <span v-else class="font-semibold truncate text-tiny">
          {{ request.method }}
        </span>
      </span>
      <span
        class="flex items-center flex-1 min-w-0 py-2 pr-2 cursor-pointer transition group-hover:text-secondaryDark"
        @click="selectRequest()"
      >
        <span class="truncate" :class="{ 'text-accent': isSelected }">
          {{ request.name }}
        </span>
        <span
          v-if="isActive"
          v-tippy="{ theme: 'tooltip' }"
          class="relative h-1.5 w-1.5 flex flex-shrink-0 mx-3"
          :title="`${t('collection.request_in_use')}`"
        >
          <span
            class="absolute inline-flex flex-shrink-0 w-full h-full bg-green-500 rounded-full opacity-75 animate-ping"
          >
          </span>
          <span
            class="relative inline-flex flex-shrink-0 rounded-full h-1.5 w-1.5 bg-green-500"
          ></span>
        </span>
      </span>
      <div class="flex">
        <ButtonSecondary
          v-if="!saveRequest"
          v-tippy="{ theme: 'tooltip' }"
          :icon="IconRotateCCW"
          :title="t('action.restore')"
          class="hidden group-hover:inline-flex"
          @click="selectRequest()"
        />
        <span>
          <tippy
            v-if="collectionsType?.selectedTeam?.myRole !== 'VIEWER'"
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
                @keyup.e="edit.$el.click()"
                @keyup.d="duplicate.$el.click()"
                @keyup.delete="deleteAction.$el.click()"
                @keyup.escape="hide()"
              >
                <SmartItem
                  ref="edit"
                  :icon="IconEdit"
                  :label="t('action.edit')"
                  :shortcut="['E']"
                  @click="
                    () => {
                      emit('edit-request', {
                        collectionIndex,
                        folderIndex,
                        folderName,
                        request,
                        requestIndex,
                        folderPath,
                      })
                      hide()
                    }
                  "
                />
                <SmartItem
                  ref="duplicate"
                  :icon="IconCopy"
                  :label="t('action.duplicate')"
                  :shortcut="['D']"
                  @click="
                    () => {
                      emit('duplicate-request', {
                        collectionID,
                        request,
                        folderPath,
                      })
                      hide()
                    }
                  "
                />
                <SmartItem
                  ref="deleteAction"
                  :icon="IconTrash2"
                  :label="t('action.delete')"
                  :shortcut="['⌫']"
                  @click="
                    () => {
                      removeRequest()
                      hide()
                    }
                  "
                />
              </div>
            </template>
          </tippy>
        </span>
      </div>
    </div>
    <HttpReqChangeConfirmModal
      :show="confirmChange"
      @hide-modal="confirmChange = false"
      @save-change="saveRequestChange"
      @discard-change="discardRequestChange"
    />
    <CollectionsSaveRequest
      mode="rest"
      :show="showSaveRequestModal"
      @hide-modal="showSaveRequestModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import IconMoreVertical from "~icons/lucide/more-vertical"
import IconCheckCircle from "~icons/lucide/check-circle"
import IconRotateCCW from "~icons/lucide/rotate-ccw"
import IconEdit from "~icons/lucide/edit"
import IconCopy from "~icons/lucide/copy"
import IconTrash2 from "~icons/lucide/trash-2"
import { ref, computed } from "vue"
import {
  HoppRESTRequest,
  isEqualHoppRESTRequest,
  safelyExtractRESTRequest,
  translateToNewRequest,
} from "@hoppscotch/data"
import { useI18n } from "@composables/i18n"
import { useToast } from "@composables/toast"
import { useReadonlyStream } from "@composables/stream"
import {
  getDefaultRESTRequest,
  restSaveContext$,
  setRESTRequest,
  setRESTSaveContext,
  getRESTSaveContext,
  getRESTRequest,
} from "~/newstore/RESTSession"
import { editRESTRequest } from "~/newstore/collections"
import { Team } from "~/helpers/backend/graphql"
import { HoppRequestSaveContext } from "~/helpers/types/HoppRequestSaveContext"
import { TeamCollection } from "~/helpers/teams/TeamCollection"
import { useAxios } from "~/composables/axios"

const props = defineProps<{
  request: HoppRESTRequest
  collectionIndex: number
  folderPath: string
  parentCollection: TeamCollection
  folderIndex: number
  folderName: string
  requestIndex: number
  saveRequest: boolean
  collectionsType: {
    type: "my-collections" | "team-collections"
    selectedTeam: Team | undefined
  }
  collectionID: number
  picked?: {
    pickedType: string
    requestID: number
    folderPath: string
  }
}>()

const emit = defineEmits<{
  (
    e: "select",
    data:
      | {
          picked: {
            pickedType: string
            requestID: number
          }
        }
      | undefined
  ): void

  (
    e: "remove-request",
    data: {
      folderPath: string | undefined
      requestIndex: number
    }
  ): void

  (
    e: "edit-request",
    data: {
      collectionIndex: number
      folderIndex: number
      folderName: string
      request: HoppRESTRequest
      requestIndex: number
      folderPath: string
    }
  ): void

  (
    e: "duplicate-request",
    data: {
      collectionID: number | string
      request: HoppRESTRequest
      folderPath: string
    }
  ): void
}>()

const t = useI18n()
const toast = useToast()

const dragging = ref(false)
const requestMethodLabels = {
  get: "text-green-500",
  post: "text-yellow-500",
  put: "text-blue-500",
  delete: "text-red-500",
  default: "text-gray-500",
}
const confirmChange = ref(false)
const showSaveRequestModal = ref(false)

// Template refs
const tippyActions = ref<any | null>(null)
const options = ref<any | null>(null)
const edit = ref<any | null>(null)
const duplicate = ref<any | null>(null)
const deleteAction = ref<any | null>(null)

const active = useReadonlyStream(restSaveContext$, null)

const isSelected = computed(
  () =>
    props.picked &&
    props.picked.pickedType === "teams-request" &&
    props.picked.requestID === props.requestIndex &&
    props.picked.folderPath === props.folderPath
)

const isActive = computed(
  () =>
    active.value &&
    active.value.originLocation === "team-collection" &&
    active.value.folderPath === props.folderPath
)

const dragStart = ({ dataTransfer }: DragEvent) => {
  if (dataTransfer) {
    dragging.value = !dragging.value
    dataTransfer.setData("requestIndex", props.requestIndex)
  }
}

const removeRequest = () => {
  emit("remove-request", {
    folderPath: props.folderPath,
    requestIndex: props.requestIndex,
  })
}

const getRequestLabelColor = (method: string): string => {
  return (
    (requestMethodLabels as any)[method.toLowerCase()] ||
    requestMethodLabels.default
  )
}

const setRestReq = (request: HoppRESTRequest) => {
  setRESTRequest(
    safelyExtractRESTRequest(
      translateToNewRequest(request),
      getDefaultRESTRequest()
    ),
    {
      originLocation: "team-collection",
      requestID: props.requestIndex.toString(),
      req: request,
      folderPath: props.folderPath,
    }
  )
}

const selectRequest = () => {
  // Check if this is a save as request popup, if so we don't need to prompt the confirm change popup.
  if (props.saveRequest) {
    emit("select", {
      picked: {
        pickedType: "teams-request",
        requestID: props.requestIndex,
        folderPath: props.folderPath,
      },
      parentCollection: props.parentCollection,
    })
  } else if (isEqualHoppRESTRequest(props.request, getDefaultRESTRequest())) {
    confirmChange.value = false
    setRestReq(props.request)
  } else if (!active.value) {
    confirmChange.value = true
  } else {
    const currentReqWithNoChange = active.value.req
    const currentFullReq = getRESTRequest()
    currentFullReq.id = active.value.req?.id
    // Check if whether user clicked the same request or not
    if (!isActive.value && currentReqWithNoChange) {
      // Check if there is any changes done on the current request
      if (isEqualHoppRESTRequest(currentReqWithNoChange, currentFullReq)) {
        setRestReq(props.request)
        setRESTSaveContext({
          originLocation: "team-collection",
          requestID: props.requestIndex.toString(),
          req: props.request,
          folderPath: props.folderPath,
        })
      } else {
        if (props.folderPath[0] !== active.value.folderPath[0]) {
          showSaveRequestModal.value = true
        } else {
          confirmChange.value = true
        }
      }
    } else {
      setRESTSaveContext(null)
    }
  }
}

/** Save current request to the collection */
const saveRequestChange = () => {
  const saveCtx = getRESTSaveContext()
  saveCurrentRequest(saveCtx)
  confirmChange.value = false
}

/** Discard changes and change the current request and context */
const discardRequestChange = () => {
  setRestReq(props.request)
  if (!isActive.value) {
    setRESTSaveContext({
      originLocation: "team-collection",
      requestID: props.requestIndex.toString(),
      req: props.request,
      folderPath: props.folderPath,
    })
  }
  confirmChange.value = false
}

const saveCurrentRequest = async (saveCtx: HoppRequestSaveContext | null) => {
  const axios = useAxios()
  if (!saveCtx) {
    showSaveRequestModal.value = true
    return
  }
  if (saveCtx.originLocation === "team-collection") {
    const pathTree =
      active.value?.folderPath.split("/").map((x) => parseInt(x)) ?? []
    const req = getRESTRequest()
    saveCtx.req = req
    saveCtx.req.id = saveCtx.requestID
    let currentCollection = props.parentCollection
    for (let i = 1; i < pathTree.length - 1; i++) {
      currentCollection = currentCollection.children[pathTree[i]]
    }
    currentCollection.requests[pathTree[pathTree.length - 1]] = saveCtx.req
    try {
      const updatedCollection = await axios.put(
        `/collections/${props.collectionID}`,
        {
          teamId: props.collectionsType?.selectedTeam?.id,
          newCollectionJson: currentCollection,
        }
      )
      if (updatedCollection) {
        setRestReq(props.request)
        setRESTSaveContext({
          originLocation: "team-collection",
          requestID: props.requestIndex.toString(),
          req: props.request,
          folderPath: props.folderPath,
        })
        showSaveRequestModal.value = false
      } else {
        toast.error(t("error.something_went_wrong"))
      }
    } catch (err) {
      toast.error(err?.response?.data?.message)
      showSaveRequestModal.value = false
    }
  } else if (saveCtx.originLocation === "user-collection") {
    try {
      editRESTRequest(
        saveCtx.folderPath,
        saveCtx.requestIndex,
        getRESTRequest()
      )
      setRestReq(props.request)
      toast.success(`${t("request.saved")}`)
    } catch (e) {
      setRESTSaveContext(null)
      saveCurrentRequest(null)
    }
  }
}
</script>
