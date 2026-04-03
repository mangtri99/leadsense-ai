<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const { user } = useUserSession()
const toast = useToast()

// Profile form
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100)
})
type ProfileSchema = z.output<typeof profileSchema>

const profileState = reactive({ name: (user.value as { name?: string })?.name || '' })
const profileLoading = ref(false)

async function onSaveProfile(event: FormSubmitEvent<ProfileSchema>) {
  profileLoading.value = true
  try {
    await $fetch('/api/auth/profile', { method: 'PATCH', body: { name: event.data.name } })
    toast.add({ title: 'Profile updated.', color: 'success', icon: 'i-lucide-check' })
  } catch (err) {
    toast.add({ title: (err as { data?: { message?: string } }).data?.message || 'Failed to update profile.', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    profileLoading.value = false
  }
}

// Password form
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
})
type PasswordSchema = z.output<typeof passwordSchema>

const passwordState = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const passwordLoading = ref(false)
const passwordError = ref('')

async function onChangePassword(event: FormSubmitEvent<PasswordSchema>) {
  passwordLoading.value = true
  passwordError.value = ''
  try {
    await $fetch('/api/auth/password', {
      method: 'PATCH',
      body: { currentPassword: event.data.currentPassword, newPassword: event.data.newPassword }
    })
    passwordState.currentPassword = ''
    passwordState.newPassword = ''
    passwordState.confirmPassword = ''
    toast.add({ title: 'Password changed successfully.', color: 'success', icon: 'i-lucide-check' })
  } catch (err) {
    passwordError.value = (err as { data?: { message?: string } }).data?.message || 'Failed to change password.'
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 lg:p-6 max-w-lg space-y-6">
        <!-- Profile info -->
        <UCard>
          <template #header>
            <p class="font-semibold text-highlighted">
              Account Info
            </p>
          </template>
          <UForm
            :schema="profileSchema"
            :state="profileState"
            class="space-y-4"
            @submit="onSaveProfile"
          >
            <UFormField
              label="Name"
              name="name"
            >
              <UInput
                v-model="profileState.name"
                icon="i-lucide-user"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Email">
              <UInput
                :model-value="(user as { email?: string })?.email"
                icon="i-lucide-mail"
                disabled
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              :loading="profileLoading"
            >
              Save Changes
            </UButton>
          </UForm>
        </UCard>

        <!-- Change password -->
        <UCard>
          <template #header>
            <p class="font-semibold text-highlighted">
              Change Password
            </p>
          </template>
          <UForm
            :schema="passwordSchema"
            :state="passwordState"
            class="space-y-4"
            @submit="onChangePassword"
          >
            <UFormField
              label="Current Password"
              name="currentPassword"
            >
              <UInput
                v-model="passwordState.currentPassword"
                type="password"
                icon="i-lucide-lock"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="New Password"
              name="newPassword"
            >
              <UInput
                v-model="passwordState.newPassword"
                type="password"
                placeholder="Min. 8 characters"
                icon="i-lucide-lock"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Confirm New Password"
              name="confirmPassword"
            >
              <UInput
                v-model="passwordState.confirmPassword"
                type="password"
                icon="i-lucide-lock"
                class="w-full"
              />
            </UFormField>

            <UAlert
              v-if="passwordError"
              color="error"
              variant="subtle"
              :description="passwordError"
              icon="i-lucide-alert-circle"
            />

            <UButton
              type="submit"
              color="neutral"
              :loading="passwordLoading"
            >
              Change Password
            </UButton>
          </UForm>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
