<!-- eslint-disable no-prototype-builtins -->
<template>
  <div></div>
</template>
<script setup lang="ts">
import {
  useRoute,
  onMounted,
  useRouter,
  useContext,
} from "@nuxtjs/composition-api"
import axios from "axios"
import { authEvents$, probableUser$, currentUser$ } from "../../helpers/fb/auth"
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars

const route = useRoute()
const router = useRouter()
const { $auth } = useContext()

onMounted(async () => {
  const { query } = route.value
  const serialize = (obj: any) => {
    const str = []
    for (const p in obj) {
      // eslint-disable-next-line no-prototype-builtins
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]))
      }
    }

    return str.join("&")
  }
  const res = await axios
    .get(`auth/google/callback?${serialize(query)}`)
    .then((response: any) => response.data)

  const user = {
    uid: res.user.id,
    email: res.user.email,
    displayName: res.user.username,
    provider: res.user.provider,
    photoURL: res.avatar,
  }

  probableUser$.next(user)
  currentUser$.next(user)

  authEvents$.next({
    event: "login",
    user,
  })
  $auth.setUser(user)
  $auth.setUserToken(res.jwt)
  router.replace("/")
})
</script>
