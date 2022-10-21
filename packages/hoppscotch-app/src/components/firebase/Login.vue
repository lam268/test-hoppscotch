<template>
  <SmartModal
    v-if="show"
    dialog
    :title="`${t('auth.login_to_hoppscotch')}`"
    max-width="sm:max-w-md"
    @close="hideModal"
  >
    <template #body>
      <div v-if="mode === 'sign-in'" class="flex flex-col space-y-2">
        <SmartItem
          :loading="signingInWithGoogle"
          :icon="IconGoogle"
          :label="`${t('auth.continue_with_google')}`"
          @click="signInWithGoogle"
        />
      </div>
      <form
        v-if="mode === 'email'"
        class="flex flex-col space-y-2"
        @submit.prevent="signInWithEmail"
      >
        <div class="flex flex-col">
          <input
            id="email"
            v-model="form.email"
            v-focus
            class="input floating-input"
            placeholder=" "
            type="email"
            name="email"
            autocomplete="off"
            required
            spellcheck="false"
            autofocus
          />
          <label for="email">
            {{ t("auth.email") }}
          </label>
        </div>
        <ButtonPrimary
          :loading="signingInWithEmail"
          type="submit"
          :label="`${t('auth.send_magic_link')}`"
        />
      </form>
      <div v-if="mode === 'email-sent'" class="flex flex-col px-4">
        <div class="flex flex-col items-center justify-center max-w-md">
          <icon-lucide-inbox class="w-6 h-6 text-accent" />
          <h3 class="my-2 text-lg text-center">
            {{ t("auth.we_sent_magic_link") }}
          </h3>
          <p class="text-center">
            {{
              t("auth.we_sent_magic_link_description", { email: form.email })
            }}
          </p>
        </div>
      </div>
    </template>
    <template #footer>
      <div v-if="mode === 'sign-in'" class="text-secondaryLight text-tiny">
        By signing in, you are agreeing to our
        <SmartAnchor
          class="link"
          to="https://docs.hoppscotch.io/terms"
          blank
          label="Terms of Service"
        />
        and
        <SmartAnchor
          class="link"
          to="https://docs.hoppscotch.io/privacy"
          blank
          label="Privacy Policy"
        />
      </div>
      <div v-if="mode === 'email'">
        <ButtonSecondary
          :label="t('auth.all_sign_in_options')"
          :icon="IconArrowLeft"
          class="!p-0"
          @click="mode = 'sign-in'"
        />
      </div>
      <div
        v-if="mode === 'email-sent'"
        class="flex justify-between flex-1 text-secondaryLight"
      >
        <SmartAnchor
          class="link"
          :label="t('auth.re_enter_email')"
          :icon="IconArrowLeft"
          @click="mode = 'email'"
        />
        <SmartAnchor
          class="link"
          :label="`${t('action.dismiss')}`"
          @click="hideModal"
        />
      </div>
    </template>
  </SmartModal>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { signInUserWithGoogle, currentUser$ } from "~/helpers/fb/auth"
import IconGoogle from "~icons/auth/google"
import IconArrowLeft from "~icons/lucide/arrow-left"
import { useStreamSubscriber } from "@composables/stream"
import { useToast } from "@composables/toast"
import { useI18n } from "@composables/i18n"

export default defineComponent({
  props: {
    show: Boolean,
  },
  emits: ["hide-modal"],
  setup() {
    const { subscribeToStream } = useStreamSubscriber()

    return {
      subscribeToStream,
      t: useI18n(),
      toast: useToast(),
      IconGoogle,
      IconArrowLeft,
    }
  },
  data() {
    return {
      form: {
        email: "",
      },
      signingInWithGoogle: false,
      signingInWithGitHub: false,
      signingInWithMicrosoft: false,
      signingInWithEmail: false,
      mode: "sign-in",
    }
  },
  mounted() {
    this.subscribeToStream(currentUser$, (user) => {
      if (user) this.hideModal()
    })
  },
  methods: {
    showLoginSuccess() {
      this.toast.success(`${this.t("auth.login_success")}`)
    },
    async signInWithGoogle() {
      this.signingInWithGoogle = true
      try {
        await signInUserWithGoogle()
        this.showLoginSuccess()
      } catch (e) {
        console.error(e)
        /*
        A auth/account-exists-with-different-credential Firebase error wont happen between Google and any other providers
        Seems Google account overwrites accounts of other providers https://github.com/firebase/firebase-android-sdk/issues/25
        */
        this.toast.error(`${this.t("error.something_went_wrong")}`)
      }

      this.signingInWithGoogle = false
    },
    hideModal() {
      this.mode = "sign-in"
      this.toast.clear()
      this.$emit("hide-modal")
    },
  },
})
</script>
