<script setup lang="ts">
import type { Lead } from '~/server/database/schema'

const route = useRoute()
const router = useRouter()

const activeStatus = ref((route.query.status as string) || '')
const currentPage = ref(Number(route.query.page) || 1)

watch(activeStatus, () => {
  currentPage.value = 1
  router.replace({ query: { ...(activeStatus.value ? { status: activeStatus.value } : {}), page: 1 } })
})

watch(currentPage, (val) => {
  router.replace({ query: { ...(activeStatus.value ? { status: activeStatus.value } : {}), page: val } })
})

const { data, pending, refresh } = await useFetch<{
  data: Lead[]
  total: number
  page: number
  limit: number
  totalPages: number
}>('/api/leads', {
  query: computed(() => ({
    ...(activeStatus.value ? { status: activeStatus.value } : {}),
    page: currentPage.value,
    limit: 20
  }))
})

const leads = computed(() => data.value?.data ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)
const total = computed(() => data.value?.total ?? 0)

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Hot', value: 'Hot' },
  { label: 'Warm', value: 'Warm' },
  { label: 'Cold', value: 'Cold' },
  { label: 'Nurture', value: 'Nurture' }
]

const statusConfig: Record<string, { color: string, icon: string, badge: 'error' | 'warning' | 'info' | 'secondary' }> = {
  Hot: { color: 'text-red-500', icon: 'i-lucide-flame', badge: 'error' },
  Warm: { color: 'text-amber-500', icon: 'i-lucide-sun', badge: 'warning' },
  Cold: { color: 'text-sky-500', icon: 'i-lucide-snowflake', badge: 'info' },
  Nurture: { color: 'text-violet-500', icon: 'i-lucide-droplets', badge: 'secondary' }
}

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hours ago`
  return `${Math.floor(hours / 24)} days ago`
}

function exportCSV() {
  const query = activeStatus.value ? `?status=${activeStatus.value}` : ''
  window.location.href = `/api/leads/export${query}`
}
</script>

<template>
  <UDashboardPanel id="leads">
    <template #header>
      <UDashboardNavbar
        title="Leads"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            to="/leads/new"
            icon="i-lucide-plus"
            size="md"
          >
            New Lead
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <div class="flex gap-2">
            <UButton
              v-for="opt in statusOptions"
              :key="opt.value"
              :variant="activeStatus === opt.value ? 'solid' : 'ghost'"
              :color="activeStatus === opt.value ? 'primary' : 'neutral'"
              size="sm"
              @click="activeStatus = opt.value"
            >
              {{ opt.label }}
            </UButton>
          </div>
        </template>
        <template #right>
          <span
            v-if="total > 0"
            class="text-xs text-muted"
          >{{ total }} leads</span>
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="exportCSV"
          >
            Export CSV
          </UButton>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="pending"
            @click="refresh()"
          >
            Refresh
          </UButton>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="p-4 lg:p-6 flex flex-col gap-4">
        <!-- Empty state -->
        <div
          v-if="!pending && leads.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <UIcon
            name="i-lucide-inbox"
            class="size-12 text-muted mb-4"
          />
          <p class="text-highlighted font-medium">
            No leads yet
          </p>
          <p class="text-muted text-sm mt-1">
            {{ activeStatus ? `No leads with status ${activeStatus}` : 'Start by adding your first lead' }}
          </p>
          <UButton
            to="/leads/new"
            icon="i-lucide-plus"
            class="mt-4"
          >
            New Lead
          </UButton>
        </div>

        <!-- Lead list -->
        <div
          v-else
          class="space-y-3"
        >
          <NuxtLink
            v-for="lead in leads"
            :key="lead.id"
            :to="`/leads/${lead.id}`"
            class="block"
          >
            <UCard class="hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
              <div class="flex items-center gap-4">
                <!-- Score badge -->
                <div
                  class="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ring-2"
                  :class="lead.status === 'Hot' ? 'bg-red-500/10 ring-red-500/30 text-red-600 dark:text-red-400'
                    : lead.status === 'Warm' ? 'bg-amber-500/10 ring-amber-500/30 text-amber-600 dark:text-amber-400'
                      : lead.status === 'Cold' ? 'bg-sky-500/10 ring-sky-500/30 text-sky-600 dark:text-sky-400'
                        : lead.status === 'Nurture' ? 'bg-violet-500/10 ring-violet-500/30 text-violet-600 dark:text-violet-400'
                          : 'bg-muted ring-default text-muted'"
                >
                  {{ lead.score ?? '?' }}
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-semibold text-highlighted truncate">
                      {{ lead.name }}
                    </p>
                    <UBadge
                      v-if="lead.status"
                      :color="statusConfig[lead.status]?.badge"
                      variant="subtle"
                      size="sm"
                    >
                      <UIcon
                        :name="statusConfig[lead.status]?.icon"
                        class="size-3 mr-1"
                      />
                      {{ lead.status }}
                    </UBadge>
                    <UBadge
                      v-if="lead.source"
                      color="neutral"
                      variant="outline"
                      size="sm"
                    >
                      {{ lead.source }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-muted truncate mt-0.5">
                    {{ lead.rawMessage }}
                  </p>
                  <div class="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
                    <span v-if="lead.destination">
                      <UIcon
                        name="i-lucide-map-pin"
                        class="size-3 inline mr-0.5"
                      />{{ lead.destination }}
                    </span>
                    <span v-if="lead.budget">
                      <UIcon
                        name="i-lucide-wallet"
                        class="size-3 inline mr-0.5"
                      />{{ lead.budget }}
                    </span>
                    <span v-if="lead.paxCount">
                      <UIcon
                        name="i-lucide-users"
                        class="size-3 inline mr-0.5"
                      />{{ lead.paxCount }} pax
                    </span>
                    <span v-if="lead.travelDate">
                      <UIcon
                        name="i-lucide-calendar"
                        class="size-3 inline mr-0.5"
                      />{{ lead.travelDate }}
                    </span>
                    <span class="ml-auto">{{ timeAgo(lead.createdAt) }}</span>
                  </div>
                </div>

                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4 text-muted shrink-0"
                />
              </div>
            </UCard>
          </NuxtLink>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex justify-center pt-2"
        >
          <UPagination
            v-model:page="currentPage"
            :total="total"
            :items-per-page="20"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
