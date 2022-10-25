import { BehaviorSubject } from "rxjs"
import { authIdToken$, HoppUser } from "../fb/auth"
import { useAxios } from "./../../composables/axios"

/*
 * This file deals with interfacing data provided by the
 * Hoppscotch Backend server
 */

/**
 * Defines the information provided about a user
 */
export interface UserInfo {
  /**
   * UID of the user
   */
  uid: string
  /**
   * Displayable name of the user (or null if none available)
   */
  displayName: string | null
  /**
   * Email of the user (or null if none available)
   */
  email: string | null
  /**
   * URL to the profile photo of the user (or null if none available)
   */
  photoURL: string | null
}

/**
 * An observable subject onto the currently logged in user info (is null if not logged in)
 */
export const currentUserInfo$ = new BehaviorSubject<UserInfo | null>(null)

/**
 * Initializes the currenUserInfo$ view and sets up its update mechanism
 */
export function initUserInfo() {
  authIdToken$.subscribe(async (token) => {
    if (token) {
      await updateUserInfo()
    } else {
      currentUserInfo$.next(null)
    }
  })
}

/**
 * Runs the actual user info fetching
 */
async function updateUserInfo() {
  const axios = useAxios()
  const res = await axios.get("/users/me")
  const user = {
    uid: res.data.id.toString(),
    email: res.data.email,
    displayName: res.data.username,
    provider: res.data.provider,
    photoURL: res.data.avatar,
  } as HoppUser
  currentUserInfo$.next(user)
}
