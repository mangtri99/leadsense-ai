<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: false })

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

const state = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { name: event.data.name, email: event.data.email, password: event.data.password }
    })
    await navigateTo('/')
  } catch (err) {
    error.value = (err as { data?: { message?: string } }).data?.message || 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-default p-4">
    <div class="w-full max-w-sm">
      <div class="flex flex-col items-center gap-2 mb-8">
        <UIcon
          name="i-lucide-brain-circuit"
          class="size-10 text-primary"
        />
        <h1 class="text-2xl font-bold text-highlighted">
          Create an account
        </h1>
        <p class="text-muted text-sm">
          Join LeadSense AI
        </p>
      </div>

      <UCard>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField
            label="Name"
            name="name"
          >
            <UInput
              v-model="state.name"
              placeholder="Your full name"
              icon="i-lucide-user"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Email"
            name="email"
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="you@example.com"
              icon="i-lucide-mail"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Password"
            name="password"
          >
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Min. 8 characters"
              icon="i-lucide-lock"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Confirm Password"
            name="confirmPassword"
          >
            <UInput
              v-model="state.confirmPassword"
              type="password"
              placeholder="Repeat password"
              icon="i-lucide-lock"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            :description="error"
            icon="i-lucide-alert-circle"
          />

          <UButton
            type="submit"
            block
            :loading="loading"
          >
            Create Account
          </UButton>
        </UForm>
      </UCard>

      <p class="text-center text-sm text-muted mt-4">
        Already have an account?
        <NuxtLink
          to="/login"
          class="text-primary font-medium hover:underline"
        >
          Sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
