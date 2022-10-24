// import * as E from "fp-ts/Either"
import { BehaviorSubject } from "rxjs"
import { GQLError } from "../backend/GQLClient"
import { GetMyTeamsQuery } from "../backend/graphql"
// import { authIdToken$ } from "~/helpers/fb/auth"
import { AxiosInstance } from "axios"
import { useAxios } from "~/composables/axios"

// const BACKEND_PAGE_SIZE = 10
const POLL_DURATION = 10000

export default class TeamListAdapter {
  error$: BehaviorSubject<GQLError<string> | null>
  loading$: BehaviorSubject<boolean>
  teamList$: BehaviorSubject<any>
  axios: AxiosInstance

  private timeoutHandle: ReturnType<typeof setTimeout> | null
  private isDispose: boolean

  constructor(deferInit = false) {
    this.error$ = new BehaviorSubject<GQLError<string> | null>(null)
    this.loading$ = new BehaviorSubject<boolean>(false)
    this.teamList$ = new BehaviorSubject<GetMyTeamsQuery["myTeams"]>([])
    this.timeoutHandle = null
    this.isDispose = false
    this.axios = useAxios()

    if (!deferInit) this.initialize()
  }

  initialize() {
    if (this.timeoutHandle) throw new Error(`Adapter already initialized`)
    if (this.isDispose) throw new Error(`Adapter has been disposed`)

    const func = async () => {
      await this.fetchList()

      if (!this.isDispose) {
        this.timeoutHandle = setTimeout(() => func(), POLL_DURATION)
      }
    }

    func()
  }

  public dispose() {
    this.isDispose = true
    clearTimeout(this.timeoutHandle as any)
    this.timeoutHandle = null
  }

  async fetchList() {
    this.loading$.next(true)
    const response = await this.axios.get(`/teams`)

    this.teamList$.next(response?.data?.data?.items || [])

    this.loading$.next(false)
  }
}
