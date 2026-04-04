<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { Lead } from '#shared/types'

const route = useRoute()
const toast = useToast()

const { data: lead, error, refresh: refreshLead } = await useFetch<Lead>(`/api/leads/${route.params.id}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Lead not found' })
}

const { copy, copied } = useClipboard()

// ── AI Score Status ──────────────────────────────────────
const statusConfig: Record<string, { color: string, icon: string, bg: string, ring: string, badgeColor: 'error' | 'warning' | 'info' | 'secondary' }> = {
  Hot: { color: 'text-red-600 dark:text-red-400', icon: 'i-lucide-flame', bg: 'bg-red-500/10', ring: 'ring-red-500/30', badgeColor: 'error' },
  Warm: { color: 'text-amber-600 dark:text-amber-400', icon: 'i-lucide-sun', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', badgeColor: 'warning' },
  Cold: { color: 'text-sky-600 dark:text-sky-400', icon: 'i-lucide-snowflake', bg: 'bg-sky-500/10', ring: 'ring-sky-500/30', badgeColor: 'info' },
  Nurture: { color: 'text-violet-600 dark:text-violet-400', icon: 'i-lucide-droplets', bg: 'bg-violet-500/10', ring: 'ring-violet-500/30', badgeColor: 'secondary' }
}

// ── Pipeline Stage ───────────────────────────────────────
const pipelineStages = [
  { value: 'new', label: 'New', icon: 'i-lucide-inbox', color: 'primary' as const },
  { value: 'contacted', label: 'Contacted', icon: 'i-lucide-phone', color: 'info' as const },
  { value: 'negotiating', label: 'Negotiating', icon: 'i-lucide-handshake', color: 'warning' as const },
  { value: 'closed_won', label: 'Closed Won', icon: 'i-lucide-check-circle-2', color: 'success' as const },
  { value: 'closed_lost', label: 'Closed Lost', icon: 'i-lucide-x-circle', color: 'error' as const }
]

const currentStage = computed(() =>
  pipelineStages.find(s => s.value === ((lead.value as { pipelineStage?: string })?.pipelineStage || 'new')) ?? pipelineStages[0]!
)

const updatingStage = ref(false)
async function updateStage(value: string) {
  updatingStage.value = true
  try {
    await $fetch(`/api/leads/${route.params.id}/stage`, { method: 'PATCH', body: { pipelineStage: value } })
    await refreshLead()
    toast.add({ title: `Stage updated to ${pipelineStages.find(s => s.value === value)?.label}`, color: 'success', icon: 'i-lucide-check' })
  } catch {
    toast.add({ title: 'Failed to update stage', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    updatingStage.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────
function formatDate(date: string | Date) {
  return new Date(date).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ── Conversation Timeline ─────────────────────────────────
interface TimelineEntry {
  id: number | string
  type: 'customer_message' | 'internal'
  note: string
  createdAt: string | Date
  userName: string | null
  senderName: string | null
  isInitial?: boolean
}

interface FollowUp {
  id: number
  note: string
  type: string
  senderName: string | null
  createdAt: string
  userName: string | null
}

const { data: followUps, refresh: refreshFollowUps } = await useFetch<FollowUp[]>(
  `/api/leads/${route.params.id}/follow-ups`
)

const timelineEntries = computed<TimelineEntry[]>(() => {
  const entries: TimelineEntry[] = []
  if (lead.value) {
    entries.push({
      id: 'initial',
      type: 'customer_message',
      note: lead.value.rawMessage,
      createdAt: lead.value.createdAt,
      userName: null,
      senderName: lead.value.name,
      isInitial: true
    })
  }
  followUps.value?.forEach(fu => entries.push({
    id: fu.id,
    type: fu.type as 'customer_message' | 'internal',
    note: fu.note,
    createdAt: fu.createdAt,
    userName: fu.userName,
    senderName: fu.senderName
  }))
  return entries
})

// ── Add Note ─────────────────────────────────────────────
const activeInput = ref<'note' | 'reply'>('note')
const newNote = ref('')
const addingNote = ref(false)

async function addFollowUp() {
  if (!newNote.value.trim()) return
  addingNote.value = true
  try {
    await $fetch(`/api/leads/${route.params.id}/follow-ups`, {
      method: 'POST',
      body: { note: newNote.value.trim(), type: 'internal' }
    })
    newNote.value = ''
    await refreshFollowUps()
    toast.add({ title: 'Note added', color: 'success', icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: 'Failed to add note', color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    addingNote.value = false
  }
}

// ── Log Customer Reply ────────────────────────────────────
const replyMessage = ref('')
const reanalyze = ref(true)
const submittingReply = ref(false)

interface ReplyAnalysis {
  score: number
  status: string
  previousScore: number | null
  previousStatus: string | null
  scoreDiff: number
  statusChanged: boolean
  replyDraft: string
}
const lastAnalysis = ref<ReplyAnalysis | null>(null)

async function submitReply() {
  if (!replyMessage.value.trim()) return
  submittingReply.value = true
  lastAnalysis.value = null
  try {
    const result = await $fetch<{ followUp: FollowUp, analysis: ReplyAnalysis | null }>(
      `/api/leads/${route.params.id}/analyze-reply`,
      { method: 'POST', body: { message: replyMessage.value.trim(), reanalyze: reanalyze.value } }
    )
    replyMessage.value = ''
    lastAnalysis.value = result.analysis
    await refreshFollowUps()
    await refreshLead()
    toast.add({ title: 'Customer reply logged', color: 'success', icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: 'Failed to log reply', color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    submittingReply.value = false
  }
}

// ── Hotel Recommendations ─────────────────────────────────
interface Hotel {
  id: string
  name: string
  starRating: number | null
  guestRating: number
  guestRatingCount: number
  price: number
  strikethroughPrice: number | null
  strikethroughDesc: string | null
  currency: string
  image: string | null
  city: string
  country: string
  displayName: string
  isRefundable: boolean
  amenities: string[]
}

const { data: hotels, pending: hotelsPending } = await useFetch<Hotel[]>('/api/hotels', {
  query: computed(() => ({ destination: lead.value?.destination || '', limit: 6 })),
  immediate: !!lead.value?.destination
})
</script>

<template>
  <UDashboardPanel :id="`lead-${route.params.id}`">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            to="/leads"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
          >
            Back
          </UButton>
        </template>
        <template #title>
          <div class="flex items-center gap-2">
            <span class="font-semibold">{{ lead?.name }}</span>
            <UBadge
              v-if="lead?.status"
              :color="statusConfig[lead.status]?.badgeColor"
              variant="subtle"
            >
              <UIcon
                :name="statusConfig[lead.status]?.icon"
                class="size-3 mr-1"
              />
              {{ lead.status }}
            </UBadge>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="lead"
        class="p-4 lg:p-6"
      >
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 max-w-7xl mx-auto items-start">
          <!-- ── Left column ── -->
          <div class="space-y-6">
            <!-- Score + Pipeline Stage -->
            <UCard>
              <div class="flex items-start gap-4">
                <div
                  class="w-20 h-20 rounded-full flex flex-col items-center justify-center text-center ring-4 shrink-0"
                  :class="[statusConfig[lead.status!]?.bg, statusConfig[lead.status!]?.ring]"
                >
                  <span
                    class="text-2xl font-bold"
                    :class="statusConfig[lead.status!]?.color"
                  >
                    {{ lead.score ?? '?' }}
                  </span>
                  <span
                    class="text-xs"
                    :class="statusConfig[lead.status!]?.color"
                  >/ 100</span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div class="flex items-center gap-2">
                      <UIcon
                        v-if="lead.status"
                        :name="statusConfig[lead.status]?.icon"
                        :class="['size-5', statusConfig[lead.status]?.color]"
                      />
                      <span
                        class="text-xl font-bold"
                        :class="statusConfig[lead.status!]?.color"
                      >
                        {{ lead.status || 'Not analyzed' }}
                      </span>
                    </div>

                    <!-- Pipeline Stage Selector -->
                    <UDropdownMenu
                      :items="pipelineStages.map(s => ({
                        label: s.label,
                        icon: s.icon,
                        onSelect: () => updateStage(s.value)
                      }))"
                    >
                      <UButton
                        :icon="currentStage.icon"
                        :color="currentStage.color"
                        variant="subtle"
                        size="sm"
                        :loading="updatingStage"
                        trailing-icon="i-lucide-chevron-down"
                      >
                        {{ currentStage.label }}
                      </UButton>
                    </UDropdownMenu>
                  </div>

                  <p
                    v-if="lead.aiAnalysis"
                    class="text-sm text-muted"
                  >
                    {{ lead.aiAnalysis }}
                  </p>

                  <p class="text-xs text-muted mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <UIcon
                        name="i-lucide-clock"
                        class="size-3 inline mr-1"
                      />{{ formatDate(lead.createdAt) }}
                    </span>
                    <span v-if="lead.source">
                      <UIcon
                        name="i-lucide-tag"
                        class="size-3 inline mr-1"
                      />{{ lead.source }}
                    </span>
                    <a
                      v-if="(lead as any).email"
                      :href="`mailto:${(lead as any).email}`"
                      class="hover:text-primary transition-colors"
                    >
                      <UIcon
                        name="i-lucide-mail"
                        class="size-3 inline mr-1"
                      />{{ (lead as any).email }}
                    </a>
                    <a
                      v-if="(lead as any).phone"
                      :href="`tel:${(lead as any).phone}`"
                      class="hover:text-primary transition-colors"
                    >
                      <UIcon
                        name="i-lucide-phone"
                        class="size-3 inline mr-1"
                      />{{ (lead as any).phone }}
                    </a>
                  </p>
                </div>
              </div>
            </UCard>

            <!-- Extracted Info -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <UCard v-if="lead.destination">
                <p class="text-xs text-muted mb-1">
                  Destination
                </p>
                <div class="flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-map-pin"
                    class="size-4 text-primary shrink-0"
                  />
                  <p class="font-medium text-highlighted text-sm truncate">
                    {{ lead.destination }}
                  </p>
                </div>
              </UCard>
              <UCard v-if="lead.budget">
                <p class="text-xs text-muted mb-1">
                  Budget
                </p>
                <div class="flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-wallet"
                    class="size-4 text-primary shrink-0"
                  />
                  <p class="font-medium text-highlighted text-sm truncate">
                    {{ lead.budget }}
                  </p>
                </div>
              </UCard>
              <UCard v-if="lead.paxCount">
                <p class="text-xs text-muted mb-1">
                  Pax Count
                </p>
                <div class="flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-users"
                    class="size-4 text-primary shrink-0"
                  />
                  <p class="font-medium text-highlighted text-sm">
                    {{ lead.paxCount }} pax
                  </p>
                </div>
              </UCard>
              <UCard v-if="lead.travelDate">
                <p class="text-xs text-muted mb-1">
                  Travel Date
                </p>
                <div class="flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-calendar"
                    class="size-4 text-primary shrink-0"
                  />
                  <p class="font-medium text-highlighted text-sm">
                    {{ lead.travelDate }}
                  </p>
                </div>
              </UCard>
            </div>

            <!-- Reply Draft -->
            <UCard v-if="lead.aiReplyDraft">
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
                    @click="copy(lead!.aiReplyDraft || '')"
                  >
                    {{ copied ? 'Copied!' : 'Copy' }}
                  </UButton>
                </div>
              </template>
              <p class="text-sm text-default whitespace-pre-line">
                {{ lead.aiReplyDraft }}
              </p>
            </UCard>

            <!-- Conversation Timeline -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <p class="font-semibold text-highlighted">
                    Conversation
                  </p>
                  <UBadge
                    color="neutral"
                    variant="subtle"
                  >
                    {{ timelineEntries.length }}
                  </UBadge>
                </div>
              </template>

              <!-- Timeline entries -->
              <div class="space-y-4 mb-4">
                <div
                  v-for="entry in timelineEntries"
                  :key="entry.id"
                  class="flex gap-3"
                >
                  <!-- Avatar -->
                  <div
                    class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    :class="entry.type === 'customer_message'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-elevated text-muted'"
                  >
                    <span v-if="entry.type === 'customer_message'">
                      {{ (entry.senderName || 'C').charAt(0).toUpperCase() }}
                    </span>
                    <UIcon
                      v-else
                      name="i-lucide-lock"
                      class="size-3.5"
                    />
                  </div>

                  <!-- Bubble -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-medium text-highlighted">
                        {{ entry.type === 'customer_message'
                          ? (entry.senderName || lead?.name)
                          : (entry.userName || 'Sales') }}
                      </span>
                      <UBadge
                        v-if="entry.type === 'internal'"
                        color="neutral"
                        variant="subtle"
                        size="xs"
                      >
                        Internal
                      </UBadge>
                      <UBadge
                        v-if="entry.isInitial"
                        color="primary"
                        variant="subtle"
                        size="xs"
                      >
                        Initial inquiry
                      </UBadge>
                      <span class="text-xs text-muted ml-auto">{{ timeAgo(entry.createdAt) }}</span>
                    </div>
                    <div
                      class="text-sm rounded-xl px-3 py-2 whitespace-pre-line"
                      :class="entry.type === 'customer_message'
                        ? 'bg-primary/8 text-default'
                        : 'bg-elevated text-default'"
                    >
                      {{ entry.note }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- AI re-analysis result -->
              <div
                v-if="lastAnalysis"
                class="mb-4 rounded-xl border border-default p-3 space-y-2 bg-elevated/50"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <UIcon
                    name="i-lucide-brain-circuit"
                    class="size-4 text-primary"
                  />
                  <span class="text-sm font-medium text-highlighted">AI Re-analysis</span>
                  <UBadge
                    :color="lastAnalysis.scoreDiff > 0 ? 'success' : lastAnalysis.scoreDiff < 0 ? 'warning' : 'neutral'"
                    variant="subtle"
                    size="sm"
                  >
                    {{ lastAnalysis.scoreDiff > 0 ? '↑' : lastAnalysis.scoreDiff < 0 ? '↓' : '=' }}
                    {{ lastAnalysis.previousScore }} → {{ lastAnalysis.score }}
                  </UBadge>
                  <UBadge
                    v-if="lastAnalysis.statusChanged"
                    color="primary"
                    variant="subtle"
                    size="sm"
                  >
                    {{ lastAnalysis.previousStatus }} → {{ lastAnalysis.status }}
                  </UBadge>
                </div>
                <p class="text-xs text-muted">
                  New reply draft updated above.
                </p>
              </div>

              <!-- Input area -->
              <div class="border-t border-default pt-4 space-y-3">
                <!-- Toggle -->
                <div class="flex gap-2">
                  <UButton
                    size="sm"
                    :variant="activeInput === 'note' ? 'solid' : 'ghost'"
                    :color="activeInput === 'note' ? 'neutral' : 'neutral'"
                    icon="i-lucide-lock"
                    @click="activeInput = 'note'; lastAnalysis = null"
                  >
                    Add Note
                  </UButton>
                  <UButton
                    size="sm"
                    :variant="activeInput === 'reply' ? 'solid' : 'ghost'"
                    :color="activeInput === 'reply' ? 'primary' : 'neutral'"
                    icon="i-lucide-message-circle"
                    @click="activeInput = 'reply'; lastAnalysis = null"
                  >
                    Log Customer Reply
                  </UButton>
                </div>

                <!-- Add Note form -->
                <div
                  v-if="activeInput === 'note'"
                  class="flex gap-2"
                >
                  <UTextarea
                    v-model="newNote"
                    placeholder="Write an internal note..."
                    :rows="2"
                    class="flex-1"
                    @keydown.ctrl.enter="addFollowUp"
                  />
                  <UButton
                    icon="i-lucide-send"
                    :loading="addingNote"
                    :disabled="!newNote.trim()"
                    class="self-end"
                    @click="addFollowUp"
                  />
                </div>

                <!-- Log Customer Reply form -->
                <div
                  v-else
                  class="space-y-2"
                >
                  <UTextarea
                    v-model="replyMessage"
                    placeholder="Paste customer's reply here..."
                    :rows="3"
                    class="w-full"
                    @keydown.ctrl.enter="submitReply"
                  />
                  <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2 text-sm text-muted cursor-pointer">
                      <USwitch
                        v-model="reanalyze"
                        size="sm"
                      />
                      Re-analyze with AI
                    </label>
                    <UButton
                      :loading="submittingReply"
                      :disabled="!replyMessage.trim()"
                      icon="i-lucide-brain-circuit"
                      size="sm"
                      @click="submitReply"
                    >
                      {{ reanalyze ? 'Log & Analyze' : 'Log Reply' }}
                    </UButton>
                  </div>
                </div>

                <p class="text-xs text-muted">
                  Ctrl+Enter to submit
                </p>
              </div>
            </UCard>
          </div>

          <!-- ── Right column: Hotel Recommendations ── -->
          <div
            v-if="lead.destination"
            class="space-y-3"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-highlighted">
                  Recommended Hotels
                </p>
                <p class="text-xs text-muted mt-0.5">
                  {{ lead.destination }}
                </p>
              </div>
              <UIcon
                name="i-lucide-hotel"
                class="size-5 text-muted"
              />
            </div>

            <div
              v-if="hotelsPending"
              class="space-y-3"
            >
              <USkeleton
                v-for="i in 3"
                :key="i"
                class="h-28 rounded-xl"
              />
            </div>

            <UCard
              v-else-if="!hotels?.length"
              class="text-center py-6"
            >
              <UIcon
                name="i-lucide-building-2"
                class="size-8 text-muted mx-auto mb-2"
              />
              <p class="text-sm text-muted">
                No hotels found for {{ lead.destination }}
              </p>
            </UCard>

            <UCard
              v-for="hotel in hotels"
              :key="hotel.id"
              class="overflow-hidden p-0"
            >
              <div class="relative h-32 bg-muted overflow-hidden">
                <img
                  v-if="hotel.image"
                  :src="hotel.image"
                  :alt="hotel.name"
                  class="w-full h-full object-cover"
                >
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-building-2"
                    class="size-8 text-muted"
                  />
                </div>
                <UBadge
                  v-if="hotel.isRefundable"
                  color="success"
                  variant="solid"
                  size="sm"
                  class="absolute top-2 left-2"
                >
                  Free cancellation
                </UBadge>
                <UBadge
                  v-if="hotel.strikethroughDesc"
                  color="error"
                  variant="solid"
                  size="sm"
                  class="absolute top-2 right-2"
                >
                  {{ hotel.strikethroughDesc }}
                </UBadge>
              </div>

              <div class="p-3 space-y-1.5">
                <p class="font-semibold text-highlighted text-sm leading-tight line-clamp-1">
                  {{ hotel.name }}
                </p>
                <div class="flex items-center gap-2">
                  <div
                    v-if="hotel.starRating"
                    class="flex"
                  >
                    <UIcon
                      v-for="s in Math.floor(hotel.starRating)"
                      :key="s"
                      name="i-lucide-star"
                      class="size-3 text-amber-400 fill-amber-400"
                    />
                  </div>
                  <span class="text-xs text-muted">
                    <span class="text-highlighted font-medium">{{ (hotel.guestRating / 10).toFixed(1) }}</span>
                    /10 ({{ hotel.guestRatingCount.toLocaleString() }})
                  </span>
                </div>
                <p class="text-xs text-muted flex items-center gap-1">
                  <UIcon
                    name="i-lucide-map-pin"
                    class="size-3 shrink-0"
                  />
                  {{ hotel.displayName }}
                </p>
                <div
                  v-if="hotel.amenities.length"
                  class="flex flex-wrap gap-1"
                >
                  <UBadge
                    v-for="amenity in hotel.amenities"
                    :key="amenity"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  >
                    {{ amenity }}
                  </UBadge>
                </div>
                <div class="flex items-baseline gap-2 pt-1">
                  <span class="text-base font-bold text-highlighted">
                    {{ hotel.currency }} {{ hotel.price.toLocaleString() }}
                  </span>
                  <span
                    v-if="hotel.strikethroughPrice"
                    class="text-xs text-muted line-through"
                  >
                    {{ hotel.currency }} {{ hotel.strikethroughPrice.toLocaleString() }}
                  </span>
                  <span class="text-xs text-muted">/night</span>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
