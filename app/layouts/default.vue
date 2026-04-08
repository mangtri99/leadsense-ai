<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()
const open = ref(false)
const { hotLeadCount } = useDashboard()
const { user } = useUserSession()
const isAdmin = computed(() => (user.value as { role?: string } | null)?.role === 'admin')

// SSE — real-time notifications for new Hot leads
onMounted(() => {
  const es = new EventSource('/api/notifications/stream')

  es.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.type === 'new-hot-lead' && data.leads?.length) {
      hotLeadCount.value += data.leads.length
      data.leads.forEach((lead: { name: string, score: number }) => {
        toast.add({
          title: `New Hot Lead: ${lead.name}`,
          description: `Score: ${lead.score}/100 — Contact immediately!`,
          color: 'error',
          icon: 'i-lucide-flame',
          duration: 8000
        })
      })
    }
  }

  es.onerror = () => es.close()

  onUnmounted(() => es.close())
})

const mainLinks = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
    onSelect: () => { open.value = false }
  },
  {
    label: 'Leads',
    icon: 'i-lucide-users',
    to: '/leads',
    onSelect: () => { open.value = false }
  },
  {
    label: 'New Lead',
    icon: 'i-lucide-plus-circle',
    to: '/leads/new',
    onSelect: () => { open.value = false }
  },
  ...(isAdmin.value
    ? [{
        label: 'Team',
        icon: 'i-lucide-shield-check',
        to: '/admin/users',
        onSelect: () => { open.value = false }
      }]
    : [])
])

const bottomLinks: NavigationMenuItem[] = [{
  label: 'Documentation',
  icon: 'i-lucide-book-open',
  to: 'https://ui.nuxt.com',
  target: '_blank'
}]

// const links = computed(() => [mainLinks.value, bottomLinks])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groups = computed(() => [{ id: 'links', label: 'Navigation', items: [...mainLinks.value, ...bottomLinks] as any }])

onMounted(() => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') return

  toast.add({
    title: 'We use cookies to improve your experience.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => { cookie.value = 'accepted' }
    }, {
      label: 'Decline',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-2 py-1">
          <UIcon
            name="i-lucide-brain-circuit"
            class="size-6 text-primary shrink-0"
          />
          <span
            v-if="!collapsed"
            class="font-bold text-highlighted truncate"
          >LeadSense AI</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="mainLinks"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="bottomLinks"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
