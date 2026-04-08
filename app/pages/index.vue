<script setup lang="ts">
const { isNotificationsSlideoverOpen, hotLeadCount } = useDashboard()
const { user } = useUserSession()
const isAdmin = computed(() => (user.value as { role?: string } | null)?.role === 'admin')

const { data: stats } = await useFetch('/api/dashboard/stats')
const { data: charts } = await useFetch('/api/dashboard/charts')

interface TeamStat {
  id: number
  name: string
  total_assigned: number
  closed_won: number
  hot_leads: number
  new_leads: number
}
const { data: teamStats } = await useFetch<TeamStat[]>('/api/dashboard/team-stats', {
  immediate: isAdmin.value
})

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
    value: Math.round(stats.value?.avg ? Number(stats.value.avg) : 0),
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

        <!-- Lead Distribution + Pipeline -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
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

          <!-- Pipeline Stage Widget -->
          <UCard class="xl:col-span-2">
            <template #header>
              <div class="flex items-center justify-between">
                <p class="font-semibold text-highlighted">
                  Sales Pipeline
                </p>
                <NuxtLink
                  to="/leads"
                  class="text-xs text-primary hover:underline"
                >
                  View all
                </NuxtLink>
              </div>
            </template>

            <div class="grid grid-cols-5 gap-3">
              <NuxtLink
                v-for="stage in [
                  { key: 'new', label: 'New', icon: 'i-lucide-inbox', color: 'text-muted', bg: 'bg-muted/50', count: stats?.pipeline?.new ?? 0 },
                  { key: 'contacted', label: 'Contacted', icon: 'i-lucide-phone', color: 'text-sky-500', bg: 'bg-sky-500/10', count: stats?.pipeline?.contacted ?? 0 },
                  { key: 'negotiating', label: 'Negotiating', icon: 'i-lucide-handshake', color: 'text-amber-500', bg: 'bg-amber-500/10', count: stats?.pipeline?.negotiating ?? 0 },
                  { key: 'closed_won', label: 'Closed Won', icon: 'i-lucide-check-circle-2', color: 'text-green-500', bg: 'bg-green-500/10', count: stats?.pipeline?.closed_won ?? 0 },
                  { key: 'closed_lost', label: 'Closed Lost', icon: 'i-lucide-x-circle', color: 'text-red-400', bg: 'bg-red-400/10', count: stats?.pipeline?.closed_lost ?? 0 }
                ]"
                :key="stage.key"
                :to="`/leads?pipeline=${stage.key}`"
                class="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors hover:bg-elevated cursor-pointer text-center"
              >
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  :class="stage.bg"
                >
                  <UIcon
                    :name="stage.icon"
                    :class="['size-5', stage.color]"
                  />
                </div>
                <p class="text-2xl font-bold text-highlighted">
                  {{ stage.count }}
                </p>
                <p class="text-xs text-muted leading-tight">
                  {{ stage.label }}
                </p>
              </NuxtLink>
            </div>

            <!-- Progress bar -->
            <div class="mt-4 flex h-2 rounded-full overflow-hidden gap-0.5">
              <div
                v-for="stage in [
                  { key: 'new', color: 'bg-muted', count: stats?.pipeline?.new ?? 0 },
                  { key: 'contacted', color: 'bg-sky-500', count: stats?.pipeline?.contacted ?? 0 },
                  { key: 'negotiating', color: 'bg-amber-500', count: stats?.pipeline?.negotiating ?? 0 },
                  { key: 'closed_won', color: 'bg-green-500', count: stats?.pipeline?.closed_won ?? 0 },
                  { key: 'closed_lost', color: 'bg-red-400', count: stats?.pipeline?.closed_lost ?? 0 }
                ]"
                :key="stage.key"
                :class="['h-full transition-all rounded-full', stage.color]"
                :style="{ width: stats?.total ? `${Math.round((stage.count / stats.total) * 100)}%` : '0%' }"
              />
            </div>
          </UCard>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <!-- Leads Over Time -->
          <UCard class="xl:col-span-2">
            <template #header>
              <p class="font-semibold text-highlighted">
                Leads Over Time <span class="text-xs font-normal text-muted ml-1">(last 30 days)</span>
              </p>
            </template>
            <ChartLeadsOverTime
              v-if="charts?.leadsOverTime?.length"
              :data="charts.leadsOverTime"
            />
            <div
              v-else
              class="h-40 flex items-center justify-center text-sm text-muted"
            >
              No data yet
            </div>
          </UCard>

          <!-- Win Rate -->
          <UCard>
            <template #header>
              <p class="font-semibold text-highlighted">
                Win Rate
              </p>
            </template>
            <ChartWinRate
              :closed-won="charts?.winRate?.closed_won ?? 0"
              :closed-lost="charts?.winRate?.closed_lost ?? 0"
            />
          </UCard>
        </div>

        <!-- Top Destinations -->
        <UCard v-if="charts?.topDestinations?.length">
          <template #header>
            <p class="font-semibold text-highlighted">
              Top Destinations
            </p>
          </template>
          <ChartTopDestinations :data="charts.topDestinations" />
        </UCard>

        <!-- Team Leaderboard (admin only) -->
        <UCard v-if="isAdmin && teamStats?.length">
          <template #header>
            <div class="flex items-center justify-between">
              <p class="font-semibold text-highlighted">
                Sales Leaderboard
              </p>
              <NuxtLink
                to="/admin/users"
                class="text-xs text-primary hover:underline"
              >
                Manage team
              </NuxtLink>
            </div>
          </template>
          <div class="space-y-3">
            <div
              v-for="(member, index) in teamStats"
              :key="member.id"
              class="flex items-center gap-3"
            >
              <span class="text-sm font-bold text-muted w-5 text-center">{{ index + 1 }}</span>
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm shrink-0">
                {{ member.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-highlighted truncate">
                  {{ member.name }}
                </p>
                <p class="text-xs text-muted">
                  {{ member.total_assigned }} assigned · {{ member.hot_leads }} hot
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-green-500">
                  {{ member.closed_won }}
                </p>
                <p class="text-xs text-muted">
                  closed
                </p>
              </div>
            </div>
          </div>
        </UCard>

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
