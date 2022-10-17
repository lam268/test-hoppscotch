import { pluck, distinctUntilChanged, map, filter } from "rxjs/operators"
import { Ref } from "vue"
import {
  FormDataKeyValue,
  HoppRESTHeader,
  HoppRESTParam,
  HoppRESTReqBody,
  HoppRESTRequest,
  RESTReqSchemaVersion,
  HoppRESTAuth,
  ValidContentTypes,
} from "@hoppscotch/data"
import {
  tabRequestStore,
  getActiveTabIndex,
  getActiveTabRequest,
} from "~/newstore/tabRequest"
import DispatchingStore, { defineDispatchers } from "./DispatchingStore"
import { HoppRESTResponse } from "~/helpers/types/HoppRESTResponse"
import { useStream } from "@composables/stream"
import { HoppTestResult } from "~/helpers/types/HoppTestResult"
import { HoppRequestSaveContext } from "~/helpers/types/HoppRequestSaveContext"
import { applyBodyTransition } from "~/helpers/rules/BodyTransition"

type RESTSession = {
  request: HoppRESTRequest
  response: HoppRESTResponse | null
  testResults: HoppTestResult | null
  saveContext: HoppRequestSaveContext | null
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

const defaultRESTSession: RESTSession = {
  request: getDefaultRESTRequest(),
  response: null,
  testResults: null,
  saveContext: null,
}

export const updateTabRequest = (payload: any) => {
  tabRequestStore.dispatch({
    dispatcher: "updateTab",
    payload: {
      index: getActiveTabIndex(),
      request: {
        ...getActiveTabRequest(),
        ...payload,
      },
    },
  })
}

const dispatchers = defineDispatchers({
  setRequest(_: RESTSession, { req }: { req: HoppRESTRequest }) {
    return {
      request: req,
    }
  },
  setRequestName(curr: RESTSession, { newName }: { newName: string }) {
    updateTabRequest({ name: newName })
    return {
      request: {
        ...curr.request,
        name: newName,
      },
    }
  },
  setEndpoint(curr: RESTSession, { newEndpoint }: { newEndpoint: string }) {
    updateTabRequest({ endpoint: newEndpoint })
    return {
      request: {
        ...curr.request,
        endpoint: newEndpoint,
      },
    }
  },
  setParams(curr: RESTSession, { entries }: { entries: HoppRESTParam[] }) {
    updateTabRequest({ params: entries })
    return {
      request: {
        ...curr.request,
        params: entries,
      },
    }
  },
  addParam(curr: RESTSession, { newParam }: { newParam: HoppRESTParam }) {
    const newParams = [...curr.request.params, newParam]
    updateTabRequest({ params: newParams })
    return {
      request: {
        ...curr.request,
        params: newParams,
      },
    }
  },
  updateParam(
    curr: RESTSession,
    { index, updatedParam }: { index: number; updatedParam: HoppRESTParam }
  ) {
    const newParams = curr.request.params.map((param, i) => {
      if (i === index) return updatedParam
      else return param
    })

    updateTabRequest({ params: newParams })
    return {
      request: {
        ...curr.request,
        params: newParams,
      },
    }
  },
  deleteParam(curr: RESTSession, { index }: { index: number }) {
    const newParams = curr.request.params.filter((_x, i) => i !== index)
    updateTabRequest({ params: newParams })

    return {
      request: {
        ...curr.request,
        params: newParams,
      },
    }
  },
  deleteAllParams(curr: RESTSession) {
    updateTabRequest({ params: [] })
    return {
      request: {
        ...curr.request,
        params: [],
      },
    }
  },
  updateMethod(curr: RESTSession, { newMethod }: { newMethod: string }) {
    updateTabRequest({ method: newMethod })
    return {
      request: {
        ...curr.request,
        method: newMethod,
      },
    }
  },
  setHeaders(curr: RESTSession, { entries }: { entries: HoppRESTHeader[] }) {
    updateTabRequest({ headers: entries })
    return {
      request: {
        ...curr.request,
        headers: entries,
      },
    }
  },
  addHeader(curr: RESTSession, { entry }: { entry: HoppRESTHeader }) {
    const newHeaders = [...curr.request.headers, entry]
    updateTabRequest({ headers: newHeaders })
    return {
      request: {
        ...curr.request,
        headers: newHeaders,
      },
    }
  },
  updateHeader(
    curr: RESTSession,
    { index, updatedEntry }: { index: number; updatedEntry: HoppRESTHeader }
  ) {
    const newHeaders = curr.request.headers.map((header, i) => {
      if (i === index) return updatedEntry
      else return header
    })
    updateTabRequest({ headers: newHeaders })
    return {
      request: {
        ...curr.request,
        headers: newHeaders,
      },
    }
  },
  deleteHeader(curr: RESTSession, { index }: { index: number }) {
    const newHeaders = curr.request.headers.filter((_x, i) => i !== index)
    updateTabRequest({ headers: newHeaders })
    return {
      request: {
        ...curr.request,
        headers: newHeaders,
      },
    }
  },
  deleteAllHeaders(curr: RESTSession) {
    updateTabRequest({ headers: [] })
    return {
      request: {
        ...curr.request,
        headers: [],
      },
    }
  },
  setAuth(curr: RESTSession, { newAuth }: { newAuth: HoppRESTAuth }) {
    updateTabRequest({ auth: newAuth })
    return {
      request: {
        ...curr.request,
        auth: newAuth,
      },
    }
  },
  setPreRequestScript(curr: RESTSession, { newScript }: { newScript: string }) {
    updateTabRequest({ preRequestScript: newScript })
    return {
      request: {
        ...curr.request,
        preRequestScript: newScript,
      },
    }
  },
  setTestScript(curr: RESTSession, { newScript }: { newScript: string }) {
    updateTabRequest({ testScript: newScript })
    return {
      request: {
        ...curr.request,
        testScript: newScript,
      },
    }
  },
  setContentType(
    curr: RESTSession,
    { newContentType }: { newContentType: ValidContentTypes | null }
  ) {
    // TODO: persist body evenafter switching content typees
    const newBody = applyBodyTransition(curr.request.body, newContentType)
    updateTabRequest({ body: newBody })
    return {
      request: {
        ...curr.request,
        body: newBody,
      },
    }
  },
  addFormDataEntry(curr: RESTSession, { entry }: { entry: FormDataKeyValue }) {
    // Only perform update if the current content-type is formdata
    if (curr.request.body.contentType !== "multipart/form-data") return {}

    const newBody: HoppRESTReqBody = {
      contentType: "multipart/form-data",
      body: [...curr.request.body.body, entry],
    }
    updateTabRequest({ body: newBody })
    return {
      request: {
        ...curr.request,
        body: newBody,
      },
    }
  },
  deleteFormDataEntry(curr: RESTSession, { index }: { index: number }) {
    // Only perform update if the current content-type is formdata
    if (curr.request.body.contentType !== "multipart/form-data") return {}

    const newBody: HoppRESTReqBody = {
      contentType: "multipart/form-data",
      body: curr.request.body.body.filter((_x, i) => i !== index),
    }
    updateTabRequest({ body: newBody })

    return {
      request: {
        ...curr.request,
        body: newBody,
      },
    }
  },
  updateFormDataEntry(
    curr: RESTSession,
    { index, entry }: { index: number; entry: FormDataKeyValue }
  ) {
    // Only perform update if the current content-type is formdata
    if (curr.request.body.contentType !== "multipart/form-data") return {}

    const newBody: HoppRESTReqBody = {
      contentType: "multipart/form-data",
      body: curr.request.body.body.map((x, i) => (i !== index ? x : entry)),
    }

    updateTabRequest({ body: newBody })

    return {
      request: {
        ...curr.request,
        body: newBody,
      },
    }
  },
  deleteAllFormDataEntries(curr: RESTSession) {
    // Only perform update if the current content-type is formdata
    if (curr.request.body.contentType !== "multipart/form-data") return {}

    const newBody: HoppRESTReqBody = {
      contentType: "multipart/form-data",
      body: [],
    }

    updateTabRequest({ body: newBody })

    return {
      request: {
        ...curr.request,
        body: newBody,
      },
    }
  },
  setRequestBody(curr: RESTSession, { newBody }: { newBody: HoppRESTReqBody }) {
    updateTabRequest({ body: newBody })
    return {
      request: {
        ...curr.request,
        body: newBody,
      },
    }
  },
  updateResponse(
    _curr: RESTSession,
    { updatedRes }: { updatedRes: HoppRESTResponse | null }
  ) {
    return {
      response: updatedRes,
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clearResponse(_curr: RESTSession) {
    return {
      response: null,
    }
  },
  setTestResults(
    _curr: RESTSession,
    { newResults }: { newResults: HoppTestResult | null }
  ) {
    return {
      testResults: newResults,
    }
  },
  setSaveContext(
    _,
    { newContext }: { newContext: HoppRequestSaveContext | null }
  ) {
    return {
      saveContext: newContext,
    }
  },
})

const restSessionStore = new DispatchingStore(defaultRESTSession, dispatchers)

export function getRESTRequest() {
  return restSessionStore.subject$.value.request
}

export function setRESTRequest(
  req: HoppRESTRequest,
  saveContext?: HoppRequestSaveContext | null
) {
  restSessionStore.dispatch({
    dispatcher: "setRequest",
    payload: {
      req,
    },
  })

  if (saveContext) setRESTSaveContext(saveContext)
}

export function setRESTSaveContext(saveContext: HoppRequestSaveContext | null) {
  restSessionStore.dispatch({
    dispatcher: "setSaveContext",
    payload: {
      newContext: saveContext,
    },
  })
}

export function getRESTSaveContext() {
  return restSessionStore.value.saveContext
}

export function resetRESTRequest() {
  setRESTRequest(getDefaultRESTRequest())
}

export function setRESTEndpoint(newEndpoint: string) {
  restSessionStore.dispatch({
    dispatcher: "setEndpoint",
    payload: {
      newEndpoint,
    },
  })
}

export function setRESTRequestName(newName: string) {
  restSessionStore.dispatch({
    dispatcher: "setRequestName",
    payload: {
      newName,
    },
  })
}

export function setRESTParams(entries: HoppRESTParam[]) {
  restSessionStore.dispatch({
    dispatcher: "setParams",
    payload: {
      entries,
    },
  })
}

export function addRESTParam(newParam: HoppRESTParam) {
  restSessionStore.dispatch({
    dispatcher: "addParam",
    payload: {
      newParam,
    },
  })
}

export function updateRESTParam(index: number, updatedParam: HoppRESTParam) {
  restSessionStore.dispatch({
    dispatcher: "updateParam",
    payload: {
      updatedParam,
      index,
    },
  })
}

export function deleteRESTParam(index: number) {
  restSessionStore.dispatch({
    dispatcher: "deleteParam",
    payload: {
      index,
    },
  })
}

export function deleteAllRESTParams() {
  restSessionStore.dispatch({
    dispatcher: "deleteAllParams",
    payload: {},
  })
}

export function updateRESTMethod(newMethod: string) {
  restSessionStore.dispatch({
    dispatcher: "updateMethod",
    payload: {
      newMethod,
    },
  })
}

export function setRESTHeaders(entries: HoppRESTHeader[]) {
  restSessionStore.dispatch({
    dispatcher: "setHeaders",
    payload: {
      entries,
    },
  })
}

export function addRESTHeader(entry: HoppRESTHeader) {
  restSessionStore.dispatch({
    dispatcher: "addHeader",
    payload: {
      entry,
    },
  })
}

export function updateRESTHeader(index: number, updatedEntry: HoppRESTHeader) {
  restSessionStore.dispatch({
    dispatcher: "updateHeader",
    payload: {
      index,
      updatedEntry,
    },
  })
}

export function deleteRESTHeader(index: number) {
  restSessionStore.dispatch({
    dispatcher: "deleteHeader",
    payload: {
      index,
    },
  })
}

export function deleteAllRESTHeaders() {
  restSessionStore.dispatch({
    dispatcher: "deleteAllHeaders",
    payload: {},
  })
}

export function setRESTAuth(newAuth: HoppRESTAuth) {
  restSessionStore.dispatch({
    dispatcher: "setAuth",
    payload: {
      newAuth,
    },
  })
}

export function setRESTPreRequestScript(newScript: string) {
  restSessionStore.dispatch({
    dispatcher: "setPreRequestScript",
    payload: {
      newScript,
    },
  })
}

export function setRESTTestScript(newScript: string) {
  restSessionStore.dispatch({
    dispatcher: "setTestScript",
    payload: {
      newScript,
    },
  })
}

export function setRESTReqBody(newBody: HoppRESTReqBody | null) {
  restSessionStore.dispatch({
    dispatcher: "setRequestBody",
    payload: {
      newBody,
    },
  })
}

export function updateRESTResponse(updatedRes: HoppRESTResponse | null) {
  restSessionStore.dispatch({
    dispatcher: "updateResponse",
    payload: {
      updatedRes,
    },
  })
}

export function clearRESTResponse() {
  restSessionStore.dispatch({
    dispatcher: "clearResponse",
    payload: {},
  })
}

export function setRESTTestResults(newResults: HoppTestResult | null) {
  restSessionStore.dispatch({
    dispatcher: "setTestResults",
    payload: {
      newResults,
    },
  })
}

export function addFormDataEntry(entry: FormDataKeyValue) {
  restSessionStore.dispatch({
    dispatcher: "addFormDataEntry",
    payload: {
      entry,
    },
  })
}

export function deleteFormDataEntry(index: number) {
  restSessionStore.dispatch({
    dispatcher: "deleteFormDataEntry",
    payload: {
      index,
    },
  })
}

export function updateFormDataEntry(index: number, entry: FormDataKeyValue) {
  restSessionStore.dispatch({
    dispatcher: "updateFormDataEntry",
    payload: {
      index,
      entry,
    },
  })
}

export function setRESTContentType(newContentType: ValidContentTypes | null) {
  restSessionStore.dispatch({
    dispatcher: "setContentType",
    payload: {
      newContentType,
    },
  })
}

export function deleteAllFormDataEntries() {
  restSessionStore.dispatch({
    dispatcher: "deleteAllFormDataEntries",
    payload: {},
  })
}

export const restSaveContext$ = restSessionStore.subject$.pipe(
  pluck("saveContext"),
  distinctUntilChanged()
)

export const restRequest$ = restSessionStore.subject$.pipe(
  pluck("request"),
  distinctUntilChanged()
)

export const restRequestName$ = restRequest$.pipe(
  pluck("name"),
  distinctUntilChanged()
)

export const restEndpoint$ = restSessionStore.subject$.pipe(
  pluck("request", "endpoint"),
  distinctUntilChanged()
)

export const restParams$ = restSessionStore.subject$.pipe(
  pluck("request", "params"),
  distinctUntilChanged()
)

export const restActiveParamsCount$ = restParams$.pipe(
  map(
    (params) =>
      params.filter((x) => x.active && (x.key !== "" || x.value !== "")).length
  )
)

export const restMethod$ = restSessionStore.subject$.pipe(
  pluck("request", "method"),
  distinctUntilChanged()
)

export const restHeaders$ = restSessionStore.subject$.pipe(
  pluck("request", "headers"),
  distinctUntilChanged()
)

export const restActiveHeadersCount$ = restHeaders$.pipe(
  map(
    (params) =>
      params.filter((x) => x.active && (x.key !== "" || x.value !== "")).length
  )
)

export const restAuth$ = restRequest$.pipe(pluck("auth"))

export const restPreRequestScript$ = restSessionStore.subject$.pipe(
  pluck("request", "preRequestScript"),
  distinctUntilChanged()
)

export const restContentType$ = restRequest$.pipe(
  pluck("body", "contentType"),
  distinctUntilChanged()
)

export const restTestScript$ = restSessionStore.subject$.pipe(
  pluck("request", "testScript"),
  distinctUntilChanged()
)

export const restReqBody$ = restSessionStore.subject$.pipe(
  pluck("request", "body"),
  distinctUntilChanged()
)

export const restResponse$ = restSessionStore.subject$.pipe(
  pluck("response"),
  distinctUntilChanged()
)

export const completedRESTResponse$ = restResponse$.pipe(
  filter(
    (res) =>
      res !== null &&
      res.type !== "loading" &&
      res.type !== "network_fail" &&
      res.type !== "script_fail"
  )
)

export const restTestResults$ = restSessionStore.subject$.pipe(
  pluck("testResults"),
  distinctUntilChanged()
)

/**
 * A Vue 3 composable function that gives access to a ref
 * which is updated to the preRequestScript value in the store.
 * The ref value is kept in sync with the store and all writes
 * to the ref are dispatched to the store as `setPreRequestScript`
 * dispatches.
 */
export function usePreRequestScript(): Ref<string> {
  return useStream(
    restPreRequestScript$,
    restSessionStore.value.request.preRequestScript,
    (value) => {
      setRESTPreRequestScript(value)
    }
  )
}

/**
 * A Vue 3 composable function that gives access to a ref
 * which is updated to the testScript value in the store.
 * The ref value is kept in sync with the store and all writes
 * to the ref are dispatched to the store as `setTestScript`
 * dispatches.
 */
export function useTestScript(): Ref<string> {
  return useStream(
    restTestScript$,
    restSessionStore.value.request.testScript,
    (value) => {
      setRESTTestScript(value)
    }
  )
}

export function useRESTRequestBody(): Ref<HoppRESTReqBody> {
  return useStream(
    restReqBody$,
    restSessionStore.value.request.body,
    setRESTReqBody
  )
}

export function useRESTRequestName(): Ref<string> {
  return useStream(
    restRequestName$,
    restSessionStore.value.request.name,
    setRESTRequestName
  )
}
