import DispatchingStore, { defineDispatchers } from "./DispatchingStore"

export interface ITab {
  target: string
  title: string
}

const defaultTabRequests = {
  state: [
    {
      target: "websocket",
      title: "websocket",
    },
    {
      target: "sse",
      title: "sse",
    },
  ] as ITab[],
}

type TabRequestsStoreType = typeof defaultTabRequests

const tabRequestsDispatcher = defineDispatchers({
  addTab({ state }: TabRequestsStoreType, request: ITab) {
    return {
      state: [...state, request],
    }
  },

  removeTab({ state }: TabRequestsStoreType, index: number) {
    return {
      state: state.splice(index, 1),
    }
  },
})

export const tabRequestStore = new DispatchingStore(
  defaultTabRequests,
  tabRequestsDispatcher
)
