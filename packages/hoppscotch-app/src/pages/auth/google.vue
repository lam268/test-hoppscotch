<template>
  <div></div>
</template>
<script setup lang="ts">
import {
  authEvents$,
  probableUser$,
  currentUser$,
  HoppUser,
} from "../../helpers/fb/auth"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"
import { onMounted } from "vue"
import { setLocalConfig } from "~/newstore/localpersistence"
const route = useRoute()
const router = useRouter()
onMounted(async () => {
  const { query } = route
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
  const res = await axios.get(
    `${import.meta.env.VITE_BACKEND_URL}/auth/google/callback?${serialize(
      query
    )}`
  )
  const user = {
    uid: res.data.data.user.id.toString(),
    email: res.data.data.user.email,
    displayName: res.data.data.user.username,
    provider: res.data.data.user.provider,
    photoURL: res.data.data.user.avatar,
  } as HoppUser
  setLocalConfig("accessToken", res.data.data.jwt)
  probableUser$.next(user)
  currentUser$.next(user)
  authEvents$.next({
    event: "login",
    user,
  })
  router.replace("/")
})
</script>
