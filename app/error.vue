<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

function handleError() {
  clearError({ redirect: '/' })
}

const title = computed(() => {
  if (props.error.statusCode === 404) return 'Page Not Found'
  if (props.error.statusCode === 403) return 'Access Denied'
  if (props.error.statusCode === 401) return 'Not Logged In'
  return 'An Error Occurred'
})

const description = computed(() => {
  if (props.error.statusCode === 404) return 'The page you are looking for is not available or has been moved.'
  if (props.error.statusCode === 401) return 'Please log in to access this page.'
  return props.error.statusMessage || props.error.message || 'An unexpected error occurred.'
})
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-default px-4">
      <div class="text-center max-w-md">
        <p class="text-6xl font-bold text-primary mb-4">
          {{ error.statusCode }}
        </p>
        <h1 class="text-2xl font-bold text-highlighted mb-2">
          {{ title }}
        </h1>
        <p class="text-muted mb-8">
          {{ description }}
        </p>
        <div class="flex items-center justify-center gap-3">
          <UButton
            icon="i-lucide-house"
            @click="handleError"
          >
            Back to Dashboard
          </UButton>
          <UButton
            v-if="error.statusCode === 401"
            to="/login"
            color="neutral"
            variant="outline"
            icon="i-lucide-log-in"
          >
            Login
          </UButton>
        </div>
      </div>
    </div>
  </UApp>
</template>
