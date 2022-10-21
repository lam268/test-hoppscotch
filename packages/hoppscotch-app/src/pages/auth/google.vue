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
  const res = await axios
    .get(`auth/google/callback?${serialize(query)}`)
    .then((response: any) => response.data)

  const user = {
    uid: res.user.id,
    email: res.user.email,
    displayName: res.user.username,
    provider: res.user.provider,
    photoURL: res.avatar,
  } as HoppUser

  probableUser$.next(user)
  currentUser$.next(user)

  authEvents$.next({
    event: "login",
    user,
  })
  router.replace("/")
})
</script>
