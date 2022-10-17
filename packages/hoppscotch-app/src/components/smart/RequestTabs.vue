<template>
  <div class="flex flex-1 h-full flex-nowrap flex-col h-auto">
    <div class="relative tabs border-dividerLight border-b" :class="[styles]">
      <div class="flex flex-1">
        <div class="flex justify-between flex-1 h-10">
          <div class="flex">
            <button
              v-for="([tabID, tabMeta], index) in tabEntries"
              :key="`tab-${index}`"
              class="tab group"
              :class="[
                { active: modelValue === tabID },
                { 'opacity-75 !cursor-not-allowed': tabMeta.disabled },
              ]"
              :aria-label="tabMeta.name || ''"
              :disabled="tabMeta.disabled"
              role="button"
              @keyup.enter="selectTab(tabID)"
              @click="selectTab(tabID)"
            >
              <!--  -->
              <span
                class="w-14 pr-2 truncate cursor-pointer"
                :class="getRequestLabelColor(tabMeta.method)"
              >
                <span class="font-semibold text-tiny">
                  {{ tabMeta.method }}
                </span>
              </span>
              <span
                class="flex items-center flex-1 min-w-0 py-2 pr-2 cursor-pointer transition group-hover:text-secondaryDark"
              >
                <span
                  class="truncate"
                  :class="{ 'text-accent text-white': modelValue === tabID }"
                >
                  {{ tabMeta.name }}
                </span>
              </span>
              <ButtonSecondary
                v-tippy="{ theme: 'tooltip' }"
                :icon="IconX"
                :title="t('action.close')"
                class="hidden group-hover:inline-flex float-center"
                @click="closeTabButton(tabID)"
              />
            </button>

            <ButtonSecondary
              v-tippy="{ theme: 'tooltip', allowHTML: true }"
              title="Add"
              :icon="IconPlus"
              class="rounded hover:bg-primaryDark focus-visible:bg-primaryDark z-10 inline-flex"
              @click="addTabButton"
            />
          </div>
          <div class="flex items-center justify-center">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    </div>
    <div class="w-full h-full contents">
      <div
        v-if="emptyState"
        class="flex flex-col items-center justify-center p-4 text-secondaryLight"
      >
        <div class="flex flex-col pb-4 my-4">
          <img
            :src="`/images/postman.svg`"
            loading="lazy"
            class="w-[150px] h-[150px] my-4 inline-flex mx-auto"
            :alt="t('empty.collections')"
          />
          <ButtonSecondary
            :label="`Create new request`"
            :icon="IconPlus"
            blank
            outline
            reverse
            @click="addTabButton"
          />
        </div>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pipe } from "fp-ts/function"
import { not } from "fp-ts/Predicate"
import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import IconPlus from "~icons/lucide/plus"
import IconX from "~icons/lucide/x"
import { ref, ComputedRef, computed, provide } from "vue"
import { throwError } from "~/helpers/functional/error"
import { useI18n } from "@composables/i18n"
import {
  tabRequestStore,
  makeNewRESTRequest,
  EventBus,
} from "~/newstore/tabRequest"
import { cloneDeep } from "lodash-es"
import { translateToNewRequest } from "@hoppscotch/data"
import { setRESTRequest } from "~/newstore/RESTSession"

export type TabMeta = {
  indicator: boolean
  disabled: boolean
  name: string
  method: string
}

export type TabProvider = {
  // Whether inactive tabs should remain rendered
  renderInactive: ComputedRef<boolean>
  activeTabID: ComputedRef<string>
  addTabEntry: (tabID: string, meta: TabMeta) => void
  updateTabEntry: (tabID: string, newMeta: TabMeta) => void
  removeTabEntry: (tabID: string) => void
}

const props = defineProps({
  styles: {
    type: String,
    default: "",
  },
  renderInactiveTabs: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: "update:modelValue", newTabID: string): void
}>()

const tabEntries = ref<Array<[string, TabMeta]>>([])
const emptyState = computed(() => tabEntries.value.length === 0)
const t = useI18n()

const requestMethodLabels = {
  get: "text-green-500",
  post: "text-yellow-500",
  put: "text-blue-500",
  delete: "text-red-500",
  default: "text-gray-500",
}

const getRequestLabelColor = (method: string) =>
  requestMethodLabels[
    method.toLowerCase() as keyof typeof requestMethodLabels
  ] || requestMethodLabels.default

const addTabButton = () => {
  let i = tabRequestStore.value.state.length
  while (tabRequestStore.value.state.some((tab) => tab.id === `tab-${i}`)) {
    i++
  }
  const newRequest = makeNewRESTRequest(`tab-${i}`)
  selectTab(`tab-${i}`)
  tabRequestStore.dispatch({
    dispatcher: "addTab",
    payload: newRequest,
  })
}

const closeTabButton = (tabID: string) => {
  tabEntries.value = tabEntries.value.filter(([id]) => id !== tabID)
  tabRequestStore.dispatch({
    dispatcher: "removeTab",
    payload: tabID,
  })
  if (props.modelValue === tabID) {
    if (tabEntries.value.length > 1) {
      selectTab(tabEntries.value[0][0])
    } else {
      selectTab("")
    }
  }
}

const addTabEntry = (tabID: string, meta: TabMeta) => {
  tabEntries.value = pipe(
    tabEntries.value,
    O.fromPredicate(not(A.exists(([id]) => id === tabID))),
    O.map(A.append([tabID, meta] as [string, TabMeta])),
    O.getOrElseW(() => throwError(`Tab with duplicate ID created: '${tabID}'`))
  )
}

const updateTabEntry = (tabID: string, newMeta: TabMeta) => {
  tabEntries.value = pipe(
    tabEntries.value,
    A.findIndex(([id]) => id === tabID),
    O.chain((index) =>
      pipe(
        tabEntries.value,
        A.updateAt(index, [tabID, newMeta] as [string, TabMeta])
      )
    ),
    O.getOrElseW(() => throwError(`Failed to update tab entry: ${tabID}`))
  )
}

const removeTabEntry = (tabID: string) => {
  // check is exists tabID in tabEntries
  const isExists = tabEntries.value.some(([id]) => id === tabID)
  if (isExists) {
    tabEntries.value = pipe(
      tabEntries.value,
      A.findIndex(([id]) => id === tabID),
      O.chain((index) => pipe(tabEntries.value, A.deleteAt(index))),
      O.getOrElseW(() => throwError(`Failed to remove tab entry: ${tabID}`))
    )

    // If we tried to remove the active tabEntries, switch to first tab entry
    if (props.modelValue === tabID)
      if (tabEntries.value.length > 0) selectTab(tabEntries.value[0][0])
  }
}

provide<TabProvider>("tabs-system", {
  renderInactive: computed(() => props.renderInactiveTabs),
  activeTabID: computed(() => props.modelValue),
  addTabEntry,
  updateTabEntry,
  removeTabEntry,
})

const selectTab = (id: string) => {
  emit("update:modelValue", id)
  tabRequestStore.dispatch({
    dispatcher: "setActiveTab",
    payload: id,
  })
  const activeTab = tabRequestStore.value.state.find((tab) => tab.id === id)

  if (activeTab) {
    const newCloneTab = translateToNewRequest(cloneDeep(activeTab))
    setRESTRequest(newCloneTab)
  }
}

EventBus.on("update:activeTab", (id) => selectTab(id))
</script>

<style lang="scss" scoped>
.tabs {
  @apply flex;
  @apply whitespace-nowrap;
  @apply overflow-auto;
  @apply flex-shrink-0;

  &::after {
    @apply absolute;
    @apply inset-x-0;
    @apply bottom-0;
    @apply bg-dividerLight;
    @apply z-1;
    @apply h-0.5;
    content: "";
  }

  .tab {
    @apply relative;
    @apply flex;
    @apply flex-shrink-0;
    @apply items-center;
    @apply justify-center;
    @apply py-2;
    @apply text-secondary;
    @apply font-semibold;
    @apply cursor-pointer;
    @apply hover: text-secondaryDark;
    @apply focus: outline-none;
    @apply focus-visible: text-secondaryDark;
    @apply w-[150px];
    @apply border-r-2;
    @apply border-dividerLight;

    .tab-info {
      @apply inline-flex;
      @apply items-center;
      @apply justify-center;
      @apply w-5;
      @apply h-4;
      @apply ml-2;
      @apply text-8px;
      @apply border border-divider;
      @apply rounded;
      @apply text-secondaryLight;
    }

    &::after {
      @apply absolute;
      @apply left-4;
      @apply right-4;
      @apply bottom-0;
      @apply bg-transparent;
      @apply z-2;
      @apply h-0.5;
      content: "";
    }

    &:focus::after {
      @apply bg-divider;
    }

    &.active {
      @apply text-secondaryDark;

      .tab-info {
        @apply text-secondary;
        @apply border-dividerLight;
      }

      &::after {
        @apply bg-accent;
      }
    }

    &.vertical {
      @apply p-2;
      @apply rounded;

      &:focus::after {
        @apply hidden;
      }

      &.active {
        @apply text-accent;

        .tab-info {
          @apply text-secondary;
          @apply border-dividerLight;
        }

        &::after {
          @apply hidden;
        }
      }
    }
  }
}
</style>
