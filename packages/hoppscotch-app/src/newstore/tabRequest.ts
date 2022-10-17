import mitt from "mitt"
import DispatchingStore, { defineDispatchers } from "./DispatchingStore"
import { HoppRESTRequest, RESTReqSchemaVersion } from "@hoppscotch/data"

export interface ITab extends HoppRESTRequest {
  isActive: boolean | undefined
}

export type EventsEmit = {
  "update:activeTab": string
}

export const getDefaultRESTRequest = (): HoppRESTRequest => ({
  v: RESTReqSchemaVersion,
  endpoint: "https://echo.hoppscotch.io",
  name: "Untitled request",
  params: [],
  headers: [],
  method: "GET",
  auth: {
    authType: "none",
    authActive: true,
  },
  preRequestScript: "",
  testScript: "",
  body: {
    contentType: null,
    body: null,
  },
})

export const makeNewRESTRequest = (id?: string): ITab => {
  const newRequest = getDefaultRESTRequest()
  if (!id) {
    let i = tabRequestStore.value.state.length
    while (tabRequestStore.value.state.some((tab) => tab.id === `tab-${i}`)) i++
    id = `tab-${i}`
  }
  return {
    ...newRequest,
    id: id,
    isActive: false,
  }
}

export const translateToNewTabRequest = (x: HoppRESTRequest): ITab => {
  if (!x.id) {
    let i = tabRequestStore.value.state.length
    while (tabRequestStore.value.state.some((tab) => tab.id === `tab-${i}`)) i++
    x.id = `tab-${i}`
  }
  return {
    ...x,
    isActive: false,
  }
}

const defaultTabRequests = {
  state: [] as ITab[],
}

type TabRequestsStoreType = typeof defaultTabRequests

const tabRequestsDispatcher = defineDispatchers({
  addTab({ state }: TabRequestsStoreType, request: ITab) {
    return {
      state: [...state, request],
    }
  },

  removeTab({ state }: TabRequestsStoreType, tabId: string) {
    return {
      state: state.filter((tab) => tab.id !== tabId),
    }
  },
  updateTab(
    { state }: TabRequestsStoreType,
    { index, request }: { index: number; request: ITab }
  ) {
    const newState = [...state]
    newState[index] = request
    return {
      state: newState,
    }
  },

  setActiveTab({ state }: TabRequestsStoreType, tabId: string) {
    const newState = [...state]
    return {
      state: newState.map((tab) => {
        tab.isActive = tab.id === tabId
        return tab
      }),
    }
  },
})

export const tabRequestStore = new DispatchingStore(
  defaultTabRequests,
  tabRequestsDispatcher
)

export const getActiveTabRequest = () => {
  return tabRequestStore.value.state.find((tab) => tab.isActive)
}

export const getActiveTabIndex = () => {
  const activeTab = getActiveTabRequest()
  if (!activeTab) return -1
  return tabRequestStore.value.state.findIndex((tab) => tab.id === activeTab.id)
}

export const getTabRequestById = (id: string) => {
  return tabRequestStore.value.state.find((tab) => tab.id === id)
}

export const EventBus = mitt<EventsEmit>()
