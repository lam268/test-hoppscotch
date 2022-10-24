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
  console.log(serialize(query))
  const res = await axios
    .get(
      `${import.meta.env.VITE_BACKEND_URL}/auth/google/callback?${serialize(
        query
      )}`
    )
    .then((response: any) => response.data)
  const user = {
    uid: res.data.user.id.toString(),
    email: res.data.user.email,
    displayName: res.data.user.username,
    provider: res.data.user.provider,
    photoURL: res.data.avatar,
  } as HoppUser
  setLocalConfig("accessToken", res.data.jwt)
  probableUser$.next(user)
  currentUser$.next(user)
  authEvents$.next({
    event: "login",
    user,
  })
  router.replace("/")
})
</script>
