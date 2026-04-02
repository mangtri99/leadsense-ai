<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()
const open = ref(false)
const { hotLeadCount } = useDashboard()

// SSE — real-time notifikasi lead Hot baru
onMounted(() => {
  const es = new EventSource('/api/notifications/stream')

  es.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.type === 'new-hot-lead' && data.leads?.length) {
      hotLeadCount.value += data.leads.length
      data.leads.forEach((lead: { name: string, score: number }) => {
        toast.add({
          title: `Hot Lead Baru: ${lead.name}`,
          description: `Skor: ${lead.score}/100 — Hubungi segera!`,
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

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
  to: '/',
  onSelect: () => { open.value = false }
}, {
  label: 'Leads',
  icon: 'i-lucide-users',
  to: '/leads',
  onSelect: () => { open.value = false }
}, {
  label: 'Input Lead Baru',
  icon: 'i-lucide-plus-circle',
  to: '/leads/new',
  onSelect: () => { open.value = false }
}], [{
  label: 'Dokumentasi',
  icon: 'i-lucide-book-open',
  to: 'https://ui.nuxt.com',
  target: '_blank'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Navigasi',
  items: links.flat()
}])

onMounted(() => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') return

  toast.add({
    title: 'Kami menggunakan cookie untuk meningkatkan pengalaman Anda.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Terima',
      color: 'neutral',
      variant: 'outline',
      onClick: () => { cookie.value = 'accepted' }
    }, {
      label: 'Tolak',
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
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
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
