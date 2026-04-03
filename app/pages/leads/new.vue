<script setup lang="ts">
import { z } from 'zod'
import { useClipboard } from '@vueuse/core'
import type { Lead } from '~/server/database/schema'

const toast = useToast()

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  rawMessage: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be at most 2000 characters'),
  source: z.string()
})

const state = reactive({
  name: '',
  rawMessage: '',
  source: 'WhatsApp',
  email: '',
  phone: ''
})

const sourceOptions = [
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Email', value: 'Email' },
  { label: 'Instagram', value: 'Instagram' },
  { label: 'Website', value: 'Website' },
  { label: 'Referral', value: 'Referral' },
  { label: 'Manual', value: 'manual' }
]

const loading = ref(false)
const result = ref<(Lead & { recommendations?: string[] }) | null>(null)

async function onSubmit() {
  loading.value = true
  result.value = null

  try {
    const data = await $fetch<Lead & { recommendations: string[] }>('/api/leads', {
      method: 'POST',
      body: state
    })
    result.value = data
    toast.add({ title: 'Analysis complete!', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (err) {
    const e = err as { data?: { message?: string }, status?: number }
    const message = e?.data?.message || 'An error occurred. Please try again.'
    toast.add({
      title: e?.status === 429 ? 'Too many requests' : 'Failed to analyze lead',
      description: message,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    loading.value = false
  }
}

const { copy, copied } = useClipboard()

const statusConfig: Record<string, { color: string, icon: string, bg: string, ring: string }> = {
  Hot: { color: 'text-red-600 dark:text-red-400', icon: 'i-lucide-flame', bg: 'bg-red-500/10', ring: 'ring-red-500/30' },
  Warm: { color: 'text-amber-600 dark:text-amber-400', icon: 'i-lucide-sun', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30' },
  Cold: { color: 'text-sky-600 dark:text-sky-400', icon: 'i-lucide-snowflake', bg: 'bg-sky-500/10', ring: 'ring-sky-500/30' },
  Nurture: { color: 'text-violet-600 dark:text-violet-400', icon: 'i-lucide-droplets', bg: 'bg-violet-500/10', ring: 'ring-violet-500/30' }
}
</script>

<template>
  <UDashboardPanel id="leads-new">
    <template #header>
      <UDashboardNavbar title="New Lead">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
        <!-- Form -->
        <UCard>
          <template #header>
            <p class="font-semibold text-highlighted">
              Lead Data
            </p>
            <p class="text-sm text-muted">
              Enter the inquiry message from the prospective customer to be analyzed by AI
            </p>
          </template>

          <UForm
            :schema="schema"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField
                label="Lead Name"
                name="name"
                required
              >
                <UInput
                  v-model="state.name"
                  placeholder="e.g. John Smith"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Lead Source"
                name="source"
              >
                <USelect
                  v-model="state.source"
                  :options="sourceOptions"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField
                label="Email"
                name="email"
              >
                <UInput
                  v-model="state.email"
                  type="email"
                  placeholder="customer@example.com"
                  icon="i-lucide-mail"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Phone / WhatsApp"
                name="phone"
              >
                <UInput
                  v-model="state.phone"
                  type="tel"
                  placeholder="+62 812 3456 7890"
                  icon="i-lucide-phone"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UFormField
              label="Inquiry Message"
              name="rawMessage"
              required
            >
              <UTextarea
                v-model="state.rawMessage"
                placeholder="Paste the original message from the prospective customer here..."
                :rows="5"
                class="w-full"
              />
            </UFormField>

            <div class="flex items-center gap-3">
              <UButton
                type="submit"
                icon="i-lucide-brain-circuit"
                :loading="loading"
                :disabled="!state.name.trim() || !state.rawMessage.trim()"
              >
                {{ loading ? 'Analyzing...' : 'Analyze with AI' }}
              </UButton>
              <UButton
                v-if="result"
                :to="`/leads/${result.id}`"
                color="neutral"
                variant="outline"
                icon="i-lucide-external-link"
              >
                View Details
              </UButton>
            </div>
          </UForm>
        </UCard>

        <!-- AI Result -->
        <template v-if="loading">
          <UCard>
            <div class="flex items-center gap-3 py-4">
              <UIcon
                name="i-lucide-brain-circuit"
                class="size-6 text-primary animate-pulse"
              />
              <div>
                <p class="font-medium text-highlighted">
                  AI is analyzing...
                </p>
                <p class="text-sm text-muted">
                  Usually done in 3–5 seconds
                </p>
              </div>
            </div>
          </UCard>
        </template>

        <template v-if="result && !loading">
          <!-- Score & Status -->
          <UCard>
            <div class="flex items-center gap-4">
              <div
                class="w-20 h-20 rounded-full flex flex-col items-center justify-center text-center ring-4 shrink-0"
                :class="[statusConfig[result.status!]?.bg, statusConfig[result.status!]?.ring]"
              >
                <span
                  class="text-2xl font-bold"
                  :class="statusConfig[result.status!]?.color"
                >
                  {{ result.score }}
                </span>
                <span
                  class="text-xs"
                  :class="statusConfig[result.status!]?.color"
                >/ 100</span>
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <UIcon
                    :name="statusConfig[result.status!]?.icon"
                    :class="['size-5', statusConfig[result.status!]?.color]"
                  />
                  <span
                    class="text-xl font-bold"
                    :class="statusConfig[result.status!]?.color"
                  >
                    {{ result.status }}
                  </span>
                </div>
                <p class="text-sm text-muted">
                  {{ result.aiAnalysis }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Extracted Info -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <UCard v-if="result.destination">
              <p class="text-xs text-muted mb-1">
                Destination
              </p>
              <div class="flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-map-pin"
                  class="size-4 text-primary shrink-0"
                />
                <p class="font-medium text-highlighted text-sm">
                  {{ result.destination }}
                </p>
              </div>
            </UCard>
            <UCard v-if="result.budget">
              <p class="text-xs text-muted mb-1">
                Budget
              </p>
              <div class="flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-wallet"
                  class="size-4 text-primary shrink-0"
                />
                <p class="font-medium text-highlighted text-sm">
                  {{ result.budget }}
                </p>
              </div>
            </UCard>
            <UCard v-if="result.paxCount">
              <p class="text-xs text-muted mb-1">
                Pax Count
              </p>
              <div class="flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-users"
                  class="size-4 text-primary shrink-0"
                />
                <p class="font-medium text-highlighted text-sm">
                  {{ result.paxCount }} pax
                </p>
              </div>
            </UCard>
            <UCard v-if="result.travelDate">
              <p class="text-xs text-muted mb-1">
                Travel Date
              </p>
              <div class="flex items-center gap-1.5">
                <UIcon
                  name="i-lucide-calendar"
                  class="size-4 text-primary shrink-0"
                />
                <p class="font-medium text-highlighted text-sm">
                  {{ result.travelDate }}
                </p>
              </div>
            </UCard>
          </div>

          <!-- Draft Balasan -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="font-semibold text-highlighted">
                  Reply Draft
                </p>
                <UButton
                  :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                  :color="copied ? 'success' : 'neutral'"
                  variant="ghost"
                  size="sm"
                  @click="copy(result!.aiReplyDraft || '')"
                >
                  {{ copied ? 'Copied!' : 'Copy' }}
                </UButton>
              </div>
            </template>
            <p class="text-sm text-default whitespace-pre-line">
              {{ result.aiReplyDraft }}
            </p>
          </UCard>

          <!-- Rekomendasi Paket -->
          <UCard v-if="result.recommendations && result.recommendations.length">
            <template #header>
              <p class="font-semibold text-highlighted">
                Tour Package Recommendations
              </p>
            </template>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="(rec, i) in result.recommendations"
                :key="i"
                color="primary"
                variant="subtle"
                size="lg"
              >
                <UIcon
                  name="i-lucide-map"
                  class="size-3 mr-1"
                />
                {{ rec }}
              </UBadge>
            </div>
          </UCard>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
