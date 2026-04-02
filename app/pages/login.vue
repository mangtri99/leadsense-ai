<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: false
})

const { fetch: refreshSession } = useUserSession()

const state = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: state
    })
    await refreshSession()
    await navigateTo('/')
  } catch (err) {
    const e = err as { data?: { message?: string } }
    error.value = e?.data?.message || 'Email atau password salah.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-default px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-highlighted">
          LeadSense AI
        </h1>
        <p class="text-sm text-muted mt-1">
          Login ke dashboard sales Anda
        </p>
      </div>

      <UCard>
        <UForm
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField
            label="Email"
            name="email"
            required
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="sales@travelpartner.com"
              autocomplete="email"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Password"
            name="password"
            required
          >
            <UInput
              v-model="state.password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            :title="error"
            icon="i-lucide-circle-alert"
          />

          <UButton
            type="submit"
            block
            :loading="loading"
            class="mt-2"
          >
            Login
          </UButton>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
