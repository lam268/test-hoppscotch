import { useStream } from "@composables/stream"
import mitt from "mitt"
import { cloneDeep } from "lodash-es"
import { pluck, distinctUntilChanged } from "rxjs/operators"
import { HoppRESTRequest, RESTReqSchemaVersion } from "@hoppscotch/data"
import DispatchingStore, { defineDispatchers } from "./DispatchingStore"

export interface ITabRequest extends HoppRESTRequest {
  isActive: boolean
  tabId?: string
}

type TABSession = {
  tabs: ITabRequest[]
}

type EventEmitters = {
  activeTab: string
  updateCurrentMethod: string
  addTabRequest: ITabRequest
}

export const EventEmitter = mitt<EventEmitters>()

export const getDefaultTABRequest = (tabId?: string): ITabRequest => ({
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
  isActive: false,
  document: "",
  tabId: tabId,
})

export function safelyExtractTabRequest(
  x: any,
  defaultReq: ITabRequest
): ITabRequest {
  const req = cloneDeep(defaultReq)
  if (!!x && typeof x === "object") {
    if (x.hasOwnProperty("v") && typeof x.v === "string") req.v = x.v
    if (x.hasOwnProperty("id") && typeof x.id === "string") req.id = x.id
    if (x.hasOwnProperty("document") && typeof x.document === "string")
      req.document = x.document
    if (x.hasOwnProperty("name") && typeof x.name === "string")
      req.name = x.name
    if (x.hasOwnProperty("method") && typeof x.method === "string")
      req.method = x.method
    if (x.hasOwnProperty("endpoint") && typeof x.endpoint === "string")
      req.endpoint = x.endpoint
    if (
      x.hasOwnProperty("preRequestScript") &&
      typeof x.preRequestScript === "string"
    )
      req.preRequestScript = x.preRequestScript
    if (x.hasOwnProperty("testScript") && typeof x.testScript === "string")
      req.testScript = x.testScript
    if (x.hasOwnProperty("body") && typeof x.body === "object" && !!x.body)
      req.body = x.body as any
    if (x.hasOwnProperty("auth") && typeof x.auth === "object" && !!x.auth)
      req.auth = x.auth as any
    if (x.hasOwnProperty("params") && Array.isArray(x.params))
      req.params = x.params
    if (x.hasOwnProperty("headers") && Array.isArray(x.headers))
      req.headers = x.headers
    if (x.hasOwnProperty("isActive") && typeof x.isActive === "boolean")
      req.isActive = x.isActive
    if (x.hasOwnProperty("tabId") && typeof x.tabId === "string")
      req.tabId = x.tabId
  }
  return req
}

const defaultTABSession: TABSession = {
  tabs: [],
}

const dispatchers = defineDispatchers({
  setTabsRequest(_: TABSession, newTabs: ITabRequest[]): TABSession {
    return {
      tabs: newTabs,
    }
  },
  addTabRequest(
    { tabs }: TABSession,
    { newRequest }: { newRequest: ITabRequest }
  ): TABSession {
    return {
      tabs: [...tabs, newRequest],
    }
  },
  removeTabRequest(
    { tabs }: TABSession,
    { tabId }: { tabId: string }
  ): TABSession {
    return {
      tabs: tabs.filter((tab) => tab.tabId !== tabId),
    }
  },
  updateTabRequest(
    { tabs }: TABSession,
    { tabId, newRequest }: { tabId: string; newRequest: ITabRequest }
  ): TABSession {
    return {
      tabs: tabs.map((tab) => (tab.tabId === tabId ? newRequest : tab)),
    }
  },
  setActiveTabRequest(
    { tabs }: TABSession,
    { tabId }: { tabId: string }
  ): TABSession {
    return {
      tabs: tabs.map((tab) => ({
        ...tab,
        isActive: tab.tabId === tabId,
      })),
    }
  },
})

export const tabSessionStore = new DispatchingStore(
  defaultTABSession,
  dispatchers
)

export const setTabsRequest = (newTabs: ITabRequest[]) => {
  tabSessionStore.dispatch({
    dispatcher: "setTabsRequest",
    payload: newTabs,
  })
}

export const getTabsRequest = () => {
  return tabSessionStore.value.tabs
}

export const addTabRequest = (newRequest: ITabRequest) => {
  tabSessionStore.dispatch({
    dispatcher: "addTabRequest",
    payload: { newRequest },
  })
}

export const removeTabRequest = (tabId: string) => {
  tabSessionStore.dispatch({
    dispatcher: "removeTabRequest",
    payload: { tabId },
  })
}

export const updateTabRequest = (tabId: string, newRequest: ITabRequest) => {
  tabSessionStore.dispatch({
    dispatcher: "updateTabRequest",
    payload: { tabId, newRequest },
  })
}

export const setActiveTabRequest = (tabId: string) => {
  tabSessionStore.dispatch({
    dispatcher: "setActiveTabRequest",
    payload: { tabId: tabId },
  })
}

export const getTabSize = () => {
  return tabSessionStore.value.tabs.length
}

export const getActiveTabRequest = () => {
  return tabSessionStore.value.tabs.find((tab) => tab.isActive)
}

export const getTabRequest = (tabId: string) => {
  return tabSessionStore.value.tabs.find((tab) => tab.tabId === tabId)
}

export const tabsRequest$ = tabSessionStore.subject$.pipe(
  pluck("tabs"),
  distinctUntilChanged()
)

export const useTabsRequest = () => {
  useStream(tabsRequest$, tabSessionStore.value.tabs, setTabsRequest)
}
