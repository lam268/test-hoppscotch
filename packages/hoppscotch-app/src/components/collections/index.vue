<template>
  <div :class="{ 'rounded border border-divider': saveRequest }">
    <div
      class="sticky z-10 flex flex-col border-b rounded-t bg-primary border-dividerLight"
      :style="
        saveRequest ? 'top: calc(-1.35 * var(--font-size-body))' : 'top: 0'
      "
    >
      <div class="flex flex-col border-b border-dividerLight">
        <input
          v-model="filterText"
          type="search"
          autocomplete="off"
          :placeholder="t('action.search')"
          class="py-2 pl-4 pr-2 bg-transparent"
          :disabled="collectionsType.type == 'team-collections'"
        />
      </div>
      <CollectionsChooseType
        :collections-type="collectionsType"
        @update-collection-type="updateCollectionType"
        @update-selected-team="updateSelectedTeam"
      />
      <div class="flex justify-between flex-1">
        <ButtonSecondary
          v-if="
            collectionsType.type == 'team-collections' &&
            (collectionsType.selectedTeam == undefined ||
              collectionsType.selectedTeam.myRole == 'VIEWER')
          "
          v-tippy="{ theme: 'tooltip' }"
          disabled
          class="!rounded-none"
          :icon="IconPlus"
          :title="t('team.no_access')"
          :label="t('action.new')"
        />
        <ButtonSecondary
          v-else
          :icon="IconPlus"
          :label="t('action.new')"
          class="!rounded-none"
          @click="displayModalAdd(true)"
        />
        <span class="flex">
          <ButtonSecondary
            v-tippy="{ theme: 'tooltip' }"
            to="https://docs.hoppscotch.io/features/collections"
            blank
            :title="t('app.wiki')"
            :icon="IconHelpCircle"
          />
          <ButtonSecondary
            v-if="!saveRequest"
            v-tippy="{ theme: 'tooltip' }"
            :disabled="
              collectionsType.type == 'team-collections' &&
              collectionsType.selectedTeam == undefined
            "
            :icon="IconArchive"
            :title="t('modal.import_export')"
            @click="displayModalImportExport(true)"
          />
        </span>
      </div>
    </div>
    <div class="flex flex-col flex-1">
      <component
        :is="
          collectionsType.type == 'my-collections'
            ? 'CollectionsMyCollection'
            : 'CollectionsTeamsCollection'
        "
        v-for="(collection, index) in filteredCollections"
        :key="`collection-${index}`"
        :collection-index="parseInt(index)"
        :collection="collection"
        :is-filtered="filterText.length > 0"
        :save-request="saveRequest"
        :collections-type="collectionsType"
        :picked="picked"
        :loading-collection-i-ds="loadingCollectionIDs"
        @edit-collection="editCollection(collection, index)"
        @add-request="addRequest($event, collection.id)"
        @add-folder="addFolder($event, collection.id, index)"
        @edit-folder="editFolder($event, collection.id)"
        @edit-request="editRequest($event, collection.id)"
        @duplicate-request="duplicateRequest($event)"
        @update-team-collections="updateTeamCollections"
        @select-collection="$emit('use-collection', collection)"
        @unselect-collection="$emit('remove-collection', collection)"
        @select="$emit('select', $event)"
        @expand-collection="expandCollection"
        @remove-collection="removeCollection"
        @remove-request="removeRequest($event, collection.id)"
        @remove-folder="removeFolder($event, collection.id)"
      />
    </div>
    <div
      v-if="loadingCollectionIDs.includes('root')"
      class="flex flex-col items-center justify-center p-4"
    >
      <SmartSpinner class="my-4" />
      <span class="text-secondaryLight">{{ t("state.loading") }}</span>
    </div>
    <div
      v-else-if="filteredCollections.length === 0 && filterText.length === 0"
      class="flex flex-col items-center justify-center p-4 text-secondaryLight"
    >
      <img
        :src="`/images/states/${colorMode.value}/pack.svg`"
        loading="lazy"
        class="inline-flex flex-col object-contain object-center w-16 h-16 my-4"
        :alt="t('empty.collections')"
      />
      <span class="pb-4 text-center">
        {{ t("empty.collections") }}
      </span>
      <ButtonSecondary
        v-if="
          collectionsType.type == 'team-collections' &&
          (collectionsType.selectedTeam == undefined ||
            collectionsType.selectedTeam.myRole == 'VIEWER')
        "
        v-tippy="{ theme: 'tooltip' }"
        :title="t('team.no_access')"
        :label="t('add.new')"
        class="mb-4"
        filled
        outline
      />
      <ButtonSecondary
        v-else
        :label="t('add.new')"
        filled
        class="mb-4"
        outline
        @click="displayModalAdd(true)"
      />
    </div>
    <div
      v-if="filterText.length !== 0 && filteredCollections.length === 0"
      class="flex flex-col items-center justify-center p-4 text-secondaryLight"
    >
      <icon-lucide-search class="pb-2 opacity-75 svg-icons" />
      <span class="my-2 text-center">
        {{ t("state.nothing_found") }} "{{ filterText }}"
      </span>
    </div>
    <CollectionsAdd
      :show="showModalAdd"
      :loading-state="modalLoadingState"
      @submit="addNewRootCollection"
      @hide-modal="displayModalAdd(false)"
    />
    <CollectionsEdit
      :show="showModalEdit"
      :editing-collection-name="
        editingCollection
          ? editingCollection.name || editingCollection.title
          : ''
      "
      :loading-state="modalLoadingState"
      @hide-modal="displayModalEdit(false)"
      @submit="updateEditingCollection"
    />
    <CollectionsAddRequest
      :show="showModalAddRequest"
      :folder="editingFolder"
      :folder-path="editingFolderPath"
      :loading-state="modalLoadingState"
      @add-request="onAddRequest($event)"
      @hide-modal="displayModalAddRequest(false)"
    />
    <CollectionsAddFolder
      :show="showModalAddFolder"
      :folder="editingFolder"
      :folder-path="editingFolderPath"
      :loading-state="modalLoadingState"
      @add-folder="onAddFolder($event)"
      @hide-modal="displayModalAddFolder(false)"
    />
    <CollectionsEditFolder
      :show="showModalEditFolder"
      :editing-folder-name="
        editingFolder ? editingFolder.name || editingFolder.title : ''
      "
      :loading-state="modalLoadingState"
      @submit="updateEditingFolder"
      @hide-modal="displayModalEditFolder(false)"
    />
    <CollectionsEditRequest
      :show="showModalEditRequest"
      :editing-request-name="editingRequest ? editingRequest.name : ''"
      :loading-state="modalLoadingState"
      @submit="updateEditingRequest"
      @hide-modal="displayModalEditRequest(false)"
    />
    <CollectionsImportExport
      :show="showModalImportExport"
      :collections-type="collectionsType"
      @hide-modal="displayModalImportExport(false)"
      @update-team-collections="updateTeamCollections"
    />
    <SmartConfirmModal
      :show="showConfirmModal"
      :title="confirmModalTitle"
      :loading-state="modalLoadingState"
      @hide-modal="showConfirmModal = false"
      @resolve="resolveConfirmModal"
    />
  </div>
</template>

<script>
import IconArchive from "~icons/lucide/archive"
import IconPlus from "~icons/lucide/plus"
import IconHelpCircle from "~icons/lucide/help-circle"
import { cloneDeep } from "lodash-es"
import { defineComponent, markRaw } from "vue"
import { makeCollection } from "@hoppscotch/data"
import { useColorMode } from "@composables/theming"
import CollectionsMyCollection from "./my/Collection.vue"
import CollectionsTeamsCollection from "./teams/Collection.vue"
import { currentUser$ } from "~/helpers/fb/auth"
import TeamCollectionAdapter from "~/helpers/teams/TeamCollectionAdapter"
import {
  restCollections$,
  addRESTCollection,
  editRESTCollection,
  addRESTFolder,
  removeRESTCollection,
  removeRESTFolder,
  editRESTFolder,
  removeRESTRequest,
  editRESTRequest,
  saveRESTRequestAs,
} from "~/newstore/collections"
import {
  setRESTRequest,
  getRESTRequest,
  getRESTSaveContext,
} from "~/newstore/RESTSession"
import { useReadonlyStream, useStreamSubscriber } from "@composables/stream"
import { useToast } from "@composables/toast"
import { useI18n } from "~/composables/i18n"
import { useAxios } from "@composables/axios"

export default defineComponent({
  components: {
    CollectionsMyCollection,
    CollectionsTeamsCollection,
  },
  props: {
    saveRequest: Boolean,
    picked: { type: Object, default: () => ({}) },
  },
  emits: [
    "update-collection",
    "update-coll-type",
    "update-team-collections",
    "select-request",
    "select",
    "use-collection",
    "remove-collection",
  ],
  setup() {
    const { subscribeToStream } = useStreamSubscriber()

    return {
      subscribeTo: subscribeToStream,
      collections: useReadonlyStream(restCollections$, [], "deep"),
      currentUser: useReadonlyStream(currentUser$, null),
      colorMode: useColorMode(),
      toast: useToast(),
      t: useI18n(),
    }
  },
  data() {
    return {
      IconArchive: markRaw(IconArchive),
      IconHelpCircle: markRaw(IconHelpCircle),
      IconPlus: markRaw(IconPlus),
      showModalAdd: false,
      showModalEdit: false,
      showModalImportExport: false,
      showModalAddRequest: false,
      showModalAddFolder: false,
      showModalEditFolder: false,
      showModalEditRequest: false,
      showConfirmModal: false,
      modalLoadingState: false,
      editingCollection: undefined,
      editingCollectionIndex: undefined,
      editingCollectionID: undefined,
      editingFolder: undefined,
      editingFolderName: undefined,
      editingFolderIndex: undefined,
      editingFolderPath: undefined,
      editingRequest: undefined,
      editingRequestIndex: undefined,
      confirmModalTitle: undefined,
      removeFolderIndex: undefined,
      filterText: "",
      collectionsType: {
        type: "my-collections",
        selectedTeam: undefined,
      },
      teamCollectionAdapter: new TeamCollectionAdapter(null),
      teamCollectionsNew: [],
      loadingCollectionIDs: [],
    }
  },
  computed: {
    filteredCollections() {
      const collections =
        this.collectionsType.type === "my-collections"
          ? this.collections
          : this.teamCollectionsNew

      if (!this.filterText) {
        return collections
      }

      if (this.collectionsType.type === "team-collections") {
        return []
      }

      const filterText = this.filterText.toLowerCase()
      const filteredCollections = []

      for (const collection of collections) {
        const filteredRequests = []
        const filteredFolders = []
        for (const request of collection.requests) {
          if (request.name.toLowerCase().includes(filterText))
            filteredRequests.push(request)
        }
        for (const folder of this.collectionsType.type === "team-collections"
          ? collection.children
          : collection.folders) {
          const filteredFolderRequests = []
          for (const request of folder.requests) {
            if (request.name.toLowerCase().includes(filterText))
              filteredFolderRequests.push(request)
          }
          if (filteredFolderRequests.length > 0) {
            const filteredFolder = Object.assign({}, folder)
            filteredFolder.requests = filteredFolderRequests
            filteredFolders.push(filteredFolder)
          }
        }

        if (
          filteredRequests.length + filteredFolders.length > 0 ||
          collection.name.toLowerCase().includes(filterText)
        ) {
          const filteredCollection = Object.assign({}, collection)
          filteredCollection.requests = filteredRequests
          filteredCollection.children = filteredFolders
          filteredCollections.push(filteredCollection)
        }
      }

      return filteredCollections
    },
  },
  watch: {
    "collectionsType.type": function emitstuff() {
      this.$emit("update-collection", this.$data.collectionsType.type)
    },
    "collectionsType.selectedTeam"(value) {
      if (value?.id) this.teamCollectionAdapter.changeTeamID(value.id)
    },
    currentUser(newValue) {
      if (!newValue) this.updateCollectionType("my-collections")
    },
  },
  beforeUnmount() {
    this.teamCollectionAdapter.unsubscribeSubscriptions()
  },
  mounted() {
    this.subscribeTo(this.teamCollectionAdapter.collections$, (colls) => {
      this.teamCollectionsNew = cloneDeep(colls)
    })
    this.subscribeTo(
      this.teamCollectionAdapter.loadingCollections$,
      (collectionsIDs) => {
        this.loadingCollectionIDs = collectionsIDs
      }
    )
  },
  methods: {
    updateTeamCollections() {
      // TODO: Remove this at some point
    },
    async updateSelectedTeam(newSelectedTeam) {
      this.collectionsType.selectedTeam = newSelectedTeam
      this.$emit("update-coll-type", this.collectionsType)
    },
    async updateCollectionType(newCollectionType) {
      this.collectionsType.type = newCollectionType
      this.$emit("update-coll-type", this.collectionsType)
    },
    // Intented to be called by the CollectionAdd modal submit event
    async addNewRootCollection(title) {
      const axios = useAxios()
      if (this.collectionsType.type === "my-collections") {
        addRESTCollection(
          makeCollection({
            title,
            folders: [],
            requests: [],
          })
        )
        this.modalLoadingState = true
        try {
          const newTeamFolder = await axios.post("/collections", {
            title: title,
            isTeam: false,
          })
          this.modalLoadingState = false
          if (newTeamFolder) {
            this.toast.success(this.t("collection.created"))
          } else {
            this.toast.error(this.t("error.something_went_wrong"))
          }
          this.displayModalAdd(false)
        } catch (err) {
          this.toast.error(err?.response?.message)
        }
      } else if (
        this.collectionsType.type === "team-collections" &&
        this.collectionsType.selectedTeam.myRole !== "VIEWER"
      ) {
        this.modalLoadingState = true
        try {
          const newTeamFolder = await axios.post("/collections", {
            title: title,
            teamId: this.collectionsType.selectedTeam.id,
            isTeam: true,
          })
          this.modalLoadingState = false
          if (newTeamFolder) {
            this.filteredCollections.push({
              id: newTeamFolder.data?.data?.id,
              title: title,
              children: [],
              requests: [],
            })
            this.toast.success(this.t("collection.created"))
          } else {
            this.toast.error(this.t("error.something_went_wrong"))
          }
          this.displayModalAdd(false)
        } catch (err) {
          this.toast.error(err?.response?.message)
        }
      }
    },
    // Intented to be called by CollectionEdit modal submit event
    async updateEditingCollection(newTitle) {
      if (!newTitle) {
        this.toast.error(this.t("collection.invalid_name"))
        return
      }
      const axios = useAxios()
      if (this.collectionsType.type === "my-collections") {
        const collectionUpdated = {
          ...this.editingCollection,
          title: newTitle,
        }

        editRESTCollection(this.editingCollectionIndex, collectionUpdated)
        this.displayModalEdit(false)
      } else if (
        this.collectionsType.type === "team-collections" &&
        this.collectionsType.selectedTeam.myRole !== "VIEWER"
      ) {
        this.modalLoadingState = true
        const collectionUpdated = {
          ...this.editingCollection,
          title: newTitle,
        }
        try {
          const updatedCollection = await axios.put(
            `/collections/${this.editingCollection.id}`,
            {
              teamId: this.collectionsType.selectedTeam.id,
              newCollectionJson: collectionUpdated,
            }
          )
          this.modalLoadingState = false
          if (updatedCollection) {
            this.filteredCollections[this.$data.editingCollectionIndex] =
              collectionUpdated
            this.toast.success(this.t("collection.renamed"))
          } else {
            this.toast.error(this.t("error.something_went_wrong"))
          }
          this.displayModalEdit(false)
        } catch (err) {
          this.toast.error(err?.response?.message)
        }
      }
    },
    // Intended to be called by CollectionEditFolder modal submit event
    async updateEditingFolder(title) {
      const pathTree = this.$data.editingFolderPath
        .split("/")
        .map((x) => parseInt(x))
      let targetJson = this.filteredCollections[pathTree[0]]
      const axios = useAxios()
      for (let i = 1; i < pathTree.length; i++) {
        targetJson = targetJson.children[pathTree[i]]
      }
      targetJson.title = title
      if (this.collectionsType.type === "my-collections") {
        editRESTFolder(this.editingFolderPath, { ...this.editingFolder, title })
        this.displayModalEditFolder(false)
      } else if (
        this.collectionsType.type === "team-collections" &&
        this.collectionsType.selectedTeam.myRole !== "VIEWER"
      ) {
        this.modalLoadingState = true
        targetJson.title = title
        try {
          const updatedCollection = await axios.put(
            `/collections/${this.$data.editingCollectionID}`,
            {
              teamId: this.collectionsType.selectedTeam.id,
              newCollectionJson: this.filteredCollections[pathTree[0]],
            }
          )
          this.modalLoadingState = false
          if (updatedCollection) {
            this.toast.success(this.t("folder.renamed"))
            this.updateTeamCollections()
          } else {
            this.toast.error(this.t("error.something_went_wrong"))
          }
          this.displayModalEditFolder(false)
        } catch (err) {
          this.toast.error(err?.response?.message)
        }
      }
    },
    // Intented to by called by CollectionsEditRequest modal submit event
    async updateEditingRequest(requestUpdateData) {
      const saveCtx = getRESTSaveContext()
      const pathTree = this.$data.editingFolderPath
        .split("/")
        .map((x) => parseInt(x))
      let targetJson = this.filteredCollections[pathTree[0]]
      const axios = useAxios()
      for (let i = 1; i < pathTree.length - 1; i++) {
        targetJson = targetJson.children[pathTree[i]]
      }
      const requestUpdated = {
        ...this.editingRequest,
        name: requestUpdateData.name || this.editingRequest.name,
      }

      if (this.collectionsType.type === "my-collections") {
        // Update REST Session with the updated state
        if (
          saveCtx &&
          saveCtx.originLocation === "user-collection" &&
          saveCtx.requestIndex === this.editingRequestIndex &&
          saveCtx.folderPath === this.editingFolderPath
        ) {
          setRESTRequest({
            ...getRESTRequest(),
            name: requestUpdateData.name,
          })
        }

        editRESTRequest(
          this.editingFolderPath,
          this.editingRequestIndex,
          requestUpdated
        )
        this.displayModalEditRequest(false)
      } else if (
        this.collectionsType.type === "team-collections" &&
        this.collectionsType.selectedTeam.myRole !== "VIEWER"
      ) {
        this.modalLoadingState = true

        const requestName = requestUpdateData.name || this.editingRequest.name

        // Update REST Session with the updated state
        if (
          saveCtx &&
          saveCtx.originLocation === "team-collection" &&
          saveCtx.requestID === this.editingRequestIndex
        ) {
          setRESTRequest({
            ...getRESTRequest(),
            name: requestUpdateData.name,
          })
        }
        targetJson.requests[pathTree[pathTree.length - 1]].name = requestName

        try {
          const updatedCollection = await axios.put(
            `/collections/${this.$data.editingCollectionID}`,
            {
              teamId: this.collectionsType.selectedTeam.id,
              newCollectionJson: this.filteredCollections[pathTree[0]],
            }
          )
          this.modalLoadingState = false
          if (updatedCollection) {
            this.toast.success(this.t("request.renamed"))
            this.$emit("update-team-collections")
          } else {
            this.toast.error(this.t("error.something_went_wrong"))
          }
          this.displayModalEditRequest(false)
        } catch (err) {
          this.toast.error(err?.response?.message)
        }
      }
    },
    displayModalAdd(shouldDisplay) {
      this.showModalAdd = shouldDisplay
    },
    displayModalEdit(shouldDisplay) {
      this.showModalEdit = shouldDisplay

      if (!shouldDisplay) this.resetSelectedData()
    },
    displayModalImportExport(shouldDisplay) {
      this.showModalImportExport = shouldDisplay
    },
    displayModalAddRequest(shouldDisplay) {
      this.showModalAddRequest = shouldDisplay

      if (!shouldDisplay) this.resetSelectedData()
    },
    displayModalAddFolder(shouldDisplay) {
      this.showModalAddFolder = shouldDisplay

      if (!shouldDisplay) this.resetSelectedData()
    },
    displayModalEditFolder(shouldDisplay) {
      this.showModalEditFolder = shouldDisplay

      if (!shouldDisplay) this.resetSelectedData()
    },
    displayModalEditRequest(shouldDisplay) {
      this.showModalEditRequest = shouldDisplay

      if (!shouldDisplay) this.resetSelectedData()
    },
    displayConfirmModal(shouldDisplay) {
      this.showConfirmModal = shouldDisplay

      if (!shouldDisplay) this.resetSelectedData()
    },
    editCollection(collection, collectionIndex) {
      this.$data.editingCollection = collection
      this.$data.editingCollectionIndex = collectionIndex
      this.displayModalEdit(true)
    },
    async onAddFolder({ title, folder, path }) {
      const pathTree = path.split("/").map((x) => parseInt(x))
      const axios = useAxios()
      if (this.collectionsType.type === "my-collections") {
        addRESTFolder(title, path)
        this.displayModalAddFolder(false)
      } else if (
        this.collectionsType.type === "team-collections" &&
        this.collectionsType.selectedTeam.myRole !== "VIEWER"
      ) {
        this.modalLoadingState = true
        if (!folder.children) folder.children = []
        folder.children.push({
          id: folder.children.length,
          title: title,
          children: [],
          requests: [],
        })
        try {
          const updatedCollection = await axios.put(
            `/collections/${this.editingCollectionID}`,
            {
              teamId: this.collectionsType.selectedTeam.id,
              newCollectionJson: this.filteredCollections[pathTree[0]],
            }
          )
          this.modalLoadingState = false
          if (updatedCollection) {
            this.toast.success(this.t("folder.created"))
            this.$emit("update-team-collections")
          } else {
            this.toast.error(this.t("error.something_went_wrong"))
          }
          this.displayModalAddFolder(false)
        } catch (err) {
          this.toast.error(err?.response?.message)
        }
      }
    },
    addFolder(payload, collectionId, collectionIndex) {
      const { folder, path } = payload
      this.$data.editingFolder = folder
      this.$data.editingFolderPath = path
      this.$data.editingCollectionID = collectionId
      this.$data.editingCollectionIndex = collectionIndex
      this.displayModalAddFolder(true)
    },
    editFolder(payload, collectionID) {
      const { folder, folderIndex, folderPath } = payload
      this.$data.editingFolder = folder
      this.$data.editingFolderIndex = folderIndex
      this.$data.editingFolderPath = folderPath
      this.$data.collectionsType = this.collectionsType
      this.$data.editingCollectionID = collectionID
      this.displayModalEditFolder(true)
    },
    editRequest(payload, collectionID) {
      const {
        collectionIndex,
        folderIndex,
        folderName,
        request,
        requestIndex,
        folderPath,
      } = payload
      this.$data.editingCollectionIndex = collectionIndex
      this.$data.editingFolderIndex = folderIndex
      this.$data.editingFolderName = folderName
      this.$data.editingRequest = request
      this.$data.editingRequestIndex = requestIndex
      this.editingFolderPath = folderPath
      this.$data.editingCollectionID = collectionID
      this.$emit("select-request", requestIndex)
      this.displayModalEditRequest(true)
    },
    resetSelectedData() {
      this.$data.editingCollection = undefined
      this.$data.editingCollectionIndex = undefined
      this.$data.editingCollectionID = undefined
      this.$data.editingFolder = undefined
      this.$data.editingFolderPath = undefined
      this.$data.editingFolderIndex = undefined
      this.$data.editingRequest = undefined
      this.$data.editingRequestIndex = undefined

      this.$data.confirmModalTitle = undefined
    },
    expandCollection(collectionID) {
      this.teamCollectionAdapter.expandCollection(collectionID)
    },
    removeCollection({ collectionIndex, collectionID }) {
      this.$data.editingCollectionIndex = collectionIndex
      this.$data.editingCollectionID = collectionID
      this.confirmModalTitle = `${this.t("confirm.remove_collection")}`

      this.displayConfirmModal(true)
    },
    async onRemoveCollection() {
      const collectionIndex = this.$data.editingCollectionIndex
      const collectionID = this.$data.editingCollectionID

      if (this.collectionsType.type === "my-collections") {
        // Cancel pick if picked collection is deleted
        if (
          this.picked &&
          this.picked.pickedType === "my-collection" &&
          this.picked.collectionIndex === collectionIndex
        ) {
          this.$emit("select", { picked: null })
        }

        removeRESTCollection(collectionIndex)

        this.toast.success(this.t("state.deleted"))
        this.displayConfirmModal(false)
      } else if (this.collectionsType.type === "team-collections") {
        this.modalLoadingState = true

        // Cancel pick if picked collection is deleted
        if (
          this.picked &&
          this.picked.pickedType === "teams-collection" &&
          this.picked.collectionID === collectionID
        ) {
          this.$emit("select", { picked: null })
        }

        if (this.collectionsType.selectedTeam.myRole !== "VIEWER") {
          const axios = useAxios()
          try {
            const deletedCollection = await axios.delete(
              `/collections/${collectionID}?teamId=${this.collectionsType.selectedTeam.id}`
            )
            if (deletedCollection) {
              this.filteredCollections.splice(collectionIndex, 1)
              this.modalLoadingState = false
              this.toast.success(this.t("state.deleted"))
            } else {
              this.toast.error(this.t("error.something_went_wrong"))
            }
            this.displayConfirmModal(false)
          } catch (err) {
            this.toast.error(err?.response?.message)
          }
        }
      }
    },
    removeFolder({ folder, folderPath, folderIndex }, collectionID) {
      this.$data.editingCollectionID = collectionID
      this.$data.editingFolder = folder
      this.$data.editingFolderPath = folderPath
      this.$data.removeFolderIndex = folderIndex
      this.confirmModalTitle = `${this.t("confirm.remove_folder")}`
      this.displayConfirmModal(true)
    },
    async onRemoveFolder() {
      const folderPath = this.$data.editingFolderPath
      const folderIndex = this.$data.removeFolderIndex
      const pathTree = folderPath.split("/").map((x) => parseInt(x))
      let targetJson = this.filteredCollections[pathTree[0]]
      const axios = useAxios()
      for (let i = 1; i < pathTree.length - 1; i++) {
        targetJson = targetJson.children[pathTree[i]]
      }
      targetJson.children.splice(+folderIndex, 1)
      if (this.collectionsType.type === "my-collections") {
        // Cancel pick if picked folder was deleted
        if (
          this.picked &&
          this.picked.pickedType === "my-folder" &&
          this.picked.folderPath === folderPath
        ) {
          this.$emit("select", { picked: null })
        }
        removeRESTFolder(folderPath)

        this.toast.success(this.t("state.deleted"))
        this.displayConfirmModal(false)
      } else if (this.collectionsType.type === "team-collections") {
        this.modalLoadingState = true

        // Cancel pick if picked collection folder was deleted
        if (
          this.picked &&
          this.picked.pickedType === "teams-folder" &&
          this.picked.folderID === folder.id
        ) {
          this.$emit("select", { picked: null })
        }

        if (this.collectionsType.selectedTeam.myRole !== "VIEWER") {
          try {
            const updatedCollection = await axios.put(
              `/collections/${this.$data.editingCollectionID}`,
              {
                teamId: this.collectionsType.selectedTeam.id,
                newCollectionJson: this.filteredCollections[pathTree[0]],
              }
            )
            this.modalLoadingState = false
            if (updatedCollection) {
              this.toast.success(`${this.t("state.deleted")}`)
              this.updateTeamCollections()
            } else {
              this.toast.error(this.t("error.something_went_wrong"))
            }
            this.displayConfirmModal(false)
          } catch (err) {
            this.toast.error(err?.response?.message)
          }
        }
      }
    },
    removeRequest({ requestIndex, folderPath }, collectionID) {
      this.$data.editingCollectionID = collectionID
      this.$data.editingRequestIndex = requestIndex
      this.$data.editingFolderPath = folderPath
      this.confirmModalTitle = `${this.t("confirm.remove_request")}`

      this.displayConfirmModal(true)
    },
    async onRemoveRequest() {
      const requestIndex = this.$data.editingRequestIndex
      const folderPath = this.$data.editingFolderPath
      const pathTree = folderPath.split("/").map((x) => parseInt(x))
      let targetJson = this.filteredCollections[pathTree[0]]
      const axios = useAxios()
      for (let i = 1; i < pathTree.length - 1; i++) {
        targetJson = targetJson.children[pathTree[i]]
      }

      if (this.collectionsType.type === "my-collections") {
        // Cancel pick if the picked item is being deleted
        if (
          this.picked &&
          this.picked.pickedType === "my-request" &&
          this.picked.folderPath === folderPath &&
          this.picked.requestIndex === requestIndex
        ) {
          this.$emit("select", { picked: null })
        }
        removeRESTRequest(folderPath, requestIndex)

        this.toast.success(this.t("state.deleted"))
        this.displayConfirmModal(false)
      } else if (this.collectionsType.type === "team-collections") {
        this.modalLoadingState = true
        // Cancel pick if the picked item is being deleted
        if (
          this.picked &&
          this.picked.pickedType === "teams-request" &&
          this.picked.requestID === requestIndex
        ) {
          this.$emit("select", { picked: null })
        }
        targetJson.requests.splice(pathTree[pathTree.length - 1], 1)
        if (this.collectionsType.selectedTeam.myRole !== "VIEWER") {
          try {
            const updatedCollection = await axios.put(
              `/collections/${this.$data.editingCollectionID}`,
              {
                teamId: this.collectionsType.selectedTeam.id,
                newCollectionJson: this.filteredCollections[pathTree[0]],
              }
            )
            this.modalLoadingState = false
            if (updatedCollection) {
              this.toast.success(`${this.t("state.deleted")}`)
            } else {
              this.toast.error(this.t("error.something_went_wrong"))
            }
            this.displayConfirmModal(false)
          } catch (err) {
            this.toast.error(err?.response?.message)
          }
        }
      }
    },
    addRequest(payload, collectionID) {
      // TODO: check if the request being worked on
      // is being overwritten (selected or not)
      const { folder, path } = payload
      this.$data.editingFolder = folder
      this.$data.editingFolderPath = path.toString()
      this.$data.editingCollectionID = collectionID
      this.displayModalAddRequest(true)
    },
    async onAddRequest({ name, folder, path }) {
      const newRequest = {
        ...cloneDeep(getRESTRequest()),
        name,
      }
      const pathTree = path.split("/").map((x) => parseInt(x))
      const axios = useAxios()
      if (this.collectionsType.type === "my-collections") {
        const insertionIndex = saveRESTRequestAs(path, newRequest)
        // point to it
        setRESTRequest(newRequest, {
          originLocation: "user-collection",
          folderPath: path,
          requestIndex: insertionIndex,
        })

        this.displayModalAddRequest(false)
      } else if (
        this.collectionsType.type === "team-collections" &&
        this.collectionsType.selectedTeam.myRole !== "VIEWER"
      ) {
        this.modalLoadingState = true
        if (!folder.requests) folder.requests = []
        newRequest.id = folder.requests.length
        folder.requests.push(newRequest)

        try {
          const updatedCollection = await axios.put(
            `/collections/${this.$data.editingCollectionID}`,
            {
              teamId: this.collectionsType.selectedTeam.id,
              newCollectionJson: this.filteredCollections[pathTree[0]],
            }
          )
          this.modalLoadingState = false
          if (updatedCollection) {
            setRESTRequest(newRequest, {
              originLocation: "team-collection",
              requestID: newRequest.id,
              collectionID: this.$data.editingCollectionID,
              teamID: this.collectionsType.selectedTeam.id,
            })
          } else {
            this.toast.error(this.t("error.something_went_wrong"))
          }
          this.displayModalAddRequest(false)
        } catch (err) {
          this.toast.error(err?.response?.message)
        }
      }
    },
    async duplicateRequest({ collectionID, request, folderPath }) {
      const axios = useAxios()
      const pathTree = folderPath.split("/").map((x) => parseInt(x))
      let targetJson = this.filteredCollections[pathTree[0]]
      for (let i = 1; i < pathTree.length - 1; i++) {
        targetJson = targetJson.children[pathTree[i]]
      }
      if (this.collectionsType.type === "team-collections") {
        const newReq = {
          ...cloneDeep(request),
          name: `${request.name} - ${this.t("action.duplicate")}`,
        }
        newReq.id = targetJson.requests.length
        targetJson.requests.push(newReq)

        try {
          const updatedCollection = await axios.put(
            `/collections/${collectionID}`,
            {
              teamId: this.collectionsType.selectedTeam.id,
              newCollectionJson: this.filteredCollections[pathTree[0]],
            }
          )
          if (updatedCollection) {
            setRESTRequest(newReq, {
              originLocation: "team-collection",
              requestID: newReq.id,
              collectionID: this.$data.editingCollectionID,
              teamID: this.collectionsType.selectedTeam.id,
            })
          } else {
            targetJson.splice(newReq.id, 1)
            this.toast.error(this.t("error.something_went_wrong"))
          }
        } catch (err) {
          this.toast.error(err?.response?.message)
        }
      } else if (this.collectionsType.type === "my-collections") {
        saveRESTRequestAs(folderPath, {
          ...cloneDeep(request),
          name: `${request.name} - ${this.t("action.duplicate")}`,
        })
      }
    },
    resolveConfirmModal(title) {
      if (title === `${this.t("confirm.remove_collection")}`)
        this.onRemoveCollection()
      else if (title === `${this.t("confirm.remove_request")}`)
        this.onRemoveRequest()
      else if (title === `${this.t("confirm.remove_folder")}`)
        this.onRemoveFolder()
      else {
        console.error(
          `Confirm modal title ${title} is not handled by the component`
        )
        this.toast.error(this.t("error.something_went_wrong"))
        this.displayConfirmModal(false)
      }
    },
  },
})
// request inside folder is not being deleted, you dumb fuck
</script>
