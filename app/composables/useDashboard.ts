import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()
  const isNotificationsSlideoverOpen = ref(false)
  const hotLeadCount = ref(0)

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-l': () => router.push('/leads'),
    'g-n': () => router.push('/leads/new'),
    'n': () => {
      isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value
      if (isNotificationsSlideoverOpen.value) hotLeadCount.value = 0
    }
  })

  watch(() => route.fullPath, () => {
    isNotificationsSlideoverOpen.value = false
  })

  return {
    isNotificationsSlideoverOpen,
    hotLeadCount
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
