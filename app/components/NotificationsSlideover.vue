<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard()

const notifications = ref([{
  id: 1,
  unread: true,
  sender: {
    name: 'Benjamin Canac',
    avatar: { src: 'https://github.com/benjamincanac.png', alt: 'Benjamin Canac' }
  },
  date: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  body: 'Hey, just wanted to follow up on the latest changes.'
}, {
  id: 2,
  unread: true,
  sender: {
    name: 'Sylvain Marroufin',
    avatar: { src: 'https://github.com/smarroufin.png', alt: 'Sylvain Marroufin' }
  },
  date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  body: 'The new dashboard looks great! Can we schedule a call?'
}, {
  id: 3,
  unread: false,
  sender: {
    name: 'Ahad Sanatkaran',
    avatar: { src: 'https://github.com/iAhad.png', alt: 'Ahad Sanatkaran' }
  },
  date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  body: 'Deployment completed successfully.'
}])

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hours ago`
  return `${Math.floor(hours / 24)} days ago`
}
</script>

<template>
  <USlideover
    v-model:open="isNotificationsSlideoverOpen"
    title="Notifications"
  >
    <template #body>
      <NuxtLink
        v-for="notification in notifications"
        :key="notification.id"
        :to="`/inbox?id=${notification.id}`"
        class="px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-center gap-3 relative -mx-3 first:-mt-3 last:-mb-3"
      >
        <UChip
          color="error"
          :show="!!notification.unread"
          inset
        >
          <UAvatar
            v-bind="notification.sender.avatar"
            :alt="notification.sender.name"
            size="md"
          />
        </UChip>

        <div class="text-sm flex-1">
          <p class="flex items-center justify-between">
            <span class="text-highlighted font-medium">{{ notification.sender.name }}</span>
            <time
              :datetime="notification.date"
              class="text-muted text-xs"
            >{{ timeAgo(notification.date) }}</time>
          </p>
          <p class="text-dimmed">
            {{ notification.body }}
          </p>
        </div>
      </NuxtLink>
    </template>
  </USlideover>
</template>
