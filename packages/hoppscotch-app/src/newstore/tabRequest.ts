import DispatchingStore, { defineDispatchers } from "./DispatchingStore"
import type { HoppRESTRequest } from "@hoppscotch/data"
import { getDefaultRESTRequest } from "~/newstore/RESTSession"

export interface ITab extends HoppRESTRequest {
  isActive?: boolean
}

export const makeNewRESTRequest = (id?: string): ITab => {
  return {
    ...getDefaultRESTRequest(),
    id: id || "",
    isActive: false,
  }
}

const defaultTabRequests = {
  state: [makeNewRESTRequest("tab-0")] as ITab[],
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
