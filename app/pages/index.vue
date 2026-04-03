<script setup lang="ts">
const { isNotificationsSlideoverOpen, hotLeadCount } = useDashboard()

const { data: stats } = await useFetch('/api/dashboard/stats')

const statCards = computed(() => [
  {
    label: 'Total Leads',
    value: stats.value?.total ?? 0,
    icon: 'i-lucide-users',
    color: 'text-primary'
  },
  {
    label: 'Hot',
    value: stats.value?.breakdown?.Hot ?? 0,
    icon: 'i-lucide-flame',
    color: 'text-red-500'
  },
  {
    label: 'Warm',
    value: stats.value?.breakdown?.Warm ?? 0,
    icon: 'i-lucide-sun',
    color: 'text-amber-500'
  },
  {
    label: 'Cold',
    value: stats.value?.breakdown?.Cold ?? 0,
    icon: 'i-lucide-snowflake',
    color: 'text-sky-500'
  },
  {
    label: 'Nurture',
    value: stats.value?.breakdown?.Nurture ?? 0,
    icon: 'i-lucide-droplets',
    color: 'text-violet-500'
  },
  {
    label: 'Average Score',
    value: stats.value?.averageScore ?? 0,
    icon: 'i-lucide-bar-chart-2',
    color: 'text-green-500',
    suffix: '/100'
  }
])
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Dashboard"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UTooltip
            text="Notifications"
            :shortcuts="['N']"
          >
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip
                :show="hotLeadCount > 0"
                :text="hotLeadCount > 9 ? '9+' : String(hotLeadCount)"
                color="error"
                inset
              >
                <UIcon
                  name="i-lucide-bell"
                  class="size-5 shrink-0"
                />
              </UChip>
            </UButton>
          </UTooltip>
          <UButton
            to="/leads/new"
            icon="i-lucide-plus"
            size="md"
            class="rounded-full"
          >
            New Lead
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 lg:p-6 space-y-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <UCard
            v-for="stat in statCards"
            :key="stat.label"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-muted">
                {{ stat.label }}
              </p>
              <UIcon
                :name="stat.icon"
                :class="['size-4', stat.color]"
              />
            </div>
            <p class="text-2xl font-bold text-highlighted">
              {{ stat.value }}<span
                v-if="stat.suffix"
                class="text-sm font-normal text-muted"
              >{{ stat.suffix }}</span>
            </p>
          </UCard>
        </div>

        <!-- Lead Distribution -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <UCard>
            <template #header>
              <p class="font-semibold text-highlighted">
                Lead Status Distribution
              </p>
            </template>
            <div class="space-y-3">
              <div
                v-for="item in [
                  { label: 'Hot', count: stats?.breakdown?.Hot ?? 0, color: 'bg-red-500', icon: 'i-lucide-flame' },
                  { label: 'Warm', count: stats?.breakdown?.Warm ?? 0, color: 'bg-amber-500', icon: 'i-lucide-sun' },
                  { label: 'Cold', count: stats?.breakdown?.Cold ?? 0, color: 'bg-sky-500', icon: 'i-lucide-snowflake' },
                  { label: 'Nurture', count: stats?.breakdown?.Nurture ?? 0, color: 'bg-violet-500', icon: 'i-lucide-droplets' }
                ]"
                :key="item.label"
                class="flex items-center gap-3"
              >
                <UIcon
                  :name="item.icon"
                  class="size-4 text-muted shrink-0"
                />
                <span class="text-sm text-default w-16">{{ item.label }}</span>
                <div class="flex-1 bg-elevated rounded-full h-2">
                  <div
                    :class="['h-2 rounded-full transition-all', item.color]"
                    :style="{ width: stats?.total ? `${Math.round((item.count / stats.total) * 100)}%` : '0%' }"
                  />
                </div>
                <span class="text-sm font-medium text-highlighted w-6 text-right">{{ item.count }}</span>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <p class="font-semibold text-highlighted">
                Priority Guide
              </p>
            </template>
            <div class="space-y-3 text-sm">
              <div class="flex items-start gap-3 p-3 rounded-lg bg-red-500/10">
                <UIcon
                  name="i-lucide-flame"
                  class="size-4 text-red-500 mt-0.5 shrink-0"
                />
                <div>
                  <p class="font-medium text-highlighted">
                    Hot (80–100)
                  </p>
                  <p class="text-muted">
                    Contact within 1 hour
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10">
                <UIcon
                  name="i-lucide-sun"
                  class="size-4 text-amber-500 mt-0.5 shrink-0"
                />
                <div>
                  <p class="font-medium text-highlighted">
                    Warm (50–79)
                  </p>
                  <p class="text-muted">
                    Follow up same day
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-3 rounded-lg bg-sky-500/10">
                <UIcon
                  name="i-lucide-snowflake"
                  class="size-4 text-sky-500 mt-0.5 shrink-0"
                />
                <div>
                  <p class="font-medium text-highlighted">
                    Cold (20–49)
                  </p>
                  <p class="text-muted">
                    Send catalog, follow up in 3 days
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3 p-3 rounded-lg bg-violet-500/10">
                <UIcon
                  name="i-lucide-droplets"
                  class="size-4 text-violet-500 mt-0.5 shrink-0"
                />
                <div>
                  <p class="font-medium text-highlighted">
                    Nurture (0–19)
                  </p>
                  <p class="text-muted">
                    Add to email sequence
                  </p>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Quick Actions -->
        <UCard>
          <template #header>
            <p class="font-semibold text-highlighted">
              Quick Actions
            </p>
          </template>
          <div class="flex flex-wrap gap-3">
            <UButton
              to="/leads/new"
              icon="i-lucide-plus"
              color="primary"
            >
              New Lead
            </UButton>
            <UButton
              to="/leads"
              icon="i-lucide-list"
              color="neutral"
              variant="outline"
            >
              View All Leads
            </UButton>
            <UButton
              to="/leads?status=Hot"
              icon="i-lucide-flame"
              color="neutral"
              variant="outline"
            >
              Filter Hot Leads
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
