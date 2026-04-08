<script setup lang="ts">
import type { User } from '#shared/types'

const toast = useToast()

const { data: users, refresh } = await useFetch<User[]>('/api/users')

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Sales', value: 'sales' }
]

const roleConfig: Record<string, { color: 'primary' | 'warning', icon: string }> = {
  admin: { color: 'primary', icon: 'i-lucide-shield-check' },
  sales: { color: 'warning', icon: 'i-lucide-user' }
}

const updatingId = ref<number | null>(null)

async function updateRole(userId: number, role: string) {
  updatingId.value = userId
  try {
    await $fetch(`/api/users/${userId}/role`, { method: 'PATCH', body: { role } })
    await refresh()
    toast.add({ title: 'Role updated', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (err: unknown) {
    const message = (err as { data?: { message?: string } })?.data?.message || 'Failed to update role.'
    toast.add({ title: message, color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    updatingId.value = null
  }
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <UDashboardPanel id="admin-users">
    <template #header>
      <UDashboardNavbar
        title="Team Management"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <p class="font-semibold text-highlighted">
                Users
              </p>
              <UBadge
                color="neutral"
                variant="subtle"
              >
                {{ users?.length ?? 0 }} members
              </UBadge>
            </div>
          </template>

          <div class="divide-y divide-default">
            <div
              v-for="user in users"
              :key="user.id"
              class="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
            >
              <!-- Avatar -->
              <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-medium text-highlighted text-sm truncate">
                  {{ user.name }}
                </p>
                <p class="text-xs text-muted truncate">
                  {{ user.email }}
                </p>
              </div>

              <p class="text-xs text-muted hidden sm:block">
                Joined {{ formatDate(user.createdAt) }}
              </p>

              <!-- Role badge + selector -->
              <UDropdownMenu
                :items="roleOptions.map(opt => ({
                  label: opt.label,
                  icon: roleConfig[opt.value]?.icon,
                  onSelect: () => updateRole(user.id, opt.value)
                }))"
              >
                <UButton
                  :icon="roleConfig[user.role]?.icon || 'i-lucide-user'"
                  :color="roleConfig[user.role]?.color || 'neutral'"
                  variant="subtle"
                  size="sm"
                  :loading="updatingId === user.id"
                  trailing-icon="i-lucide-chevron-down"
                >
                  {{ user.role === 'admin' ? 'Admin' : 'Sales' }}
                </UButton>
              </UDropdownMenu>
            </div>
          </div>
        </UCard>

        <UAlert
          color="info"
          variant="subtle"
          icon="i-lucide-info"
          title="Role permissions"
          description="Admins can see all leads, manage users, and view team stats. Sales reps only see leads assigned to them."
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
