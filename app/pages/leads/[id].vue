<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { Lead } from '~/server/database/schema'

const route = useRoute()
const toast = useToast()

const { data: lead, error } = await useFetch<Lead>(`/api/leads/${route.params.id}`)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Lead not found' })
}

const { copy, copied } = useClipboard()

const statusConfig: Record<string, { color: string, icon: string, bg: string, ring: string, badgeColor: 'error' | 'warning' | 'info' | 'secondary' }> = {
  Hot: { color: 'text-red-600 dark:text-red-400', icon: 'i-lucide-flame', bg: 'bg-red-500/10', ring: 'ring-red-500/30', badgeColor: 'error' },
  Warm: { color: 'text-amber-600 dark:text-amber-400', icon: 'i-lucide-sun', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', badgeColor: 'warning' },
  Cold: { color: 'text-sky-600 dark:text-sky-400', icon: 'i-lucide-snowflake', bg: 'bg-sky-500/10', ring: 'ring-sky-500/30', badgeColor: 'info' },
  Nurture: { color: 'text-violet-600 dark:text-violet-400', icon: 'i-lucide-droplets', bg: 'bg-violet-500/10', ring: 'ring-violet-500/30', badgeColor: 'secondary' }
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
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

// Follow-up
interface FollowUp {
  id: number
  note: string
  createdAt: string
  userName: string | null
}

const { data: followUps, refresh: refreshFollowUps } = await useFetch<FollowUp[]>(
  `/api/leads/${route.params.id}/follow-ups`
)

const newNote = ref('')
const addingNote = ref(false)

async function addFollowUp() {
  if (!newNote.value.trim()) return
  addingNote.value = true
  try {
    await $fetch(`/api/leads/${route.params.id}/follow-ups`, {
      method: 'POST',
      body: { note: newNote.value.trim() }
    })
    newNote.value = ''
    await refreshFollowUps()
    toast.add({ title: 'Note added successfully', color: 'success', icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: 'Failed to add note', color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    addingNote.value = false
  }
}
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
        class="p-4 lg:p-6 max-w-3xl mx-auto space-y-6"
      >
        <!-- Score header -->
        <UCard>
          <div class="flex items-center gap-4">
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
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <UIcon
                  v-if="lead.status"
                  :name="statusConfig[lead.status]?.icon"
                  :class="['size-5', statusConfig[lead.status]?.color]"
                />
                <span
                  class="text-xl font-bold"
                  :class="statusConfig[lead.status!]?.color"
                >
                  {{ lead.status || 'Not analyzed yet' }}
                </span>
              </div>
              <p
                v-if="lead.aiAnalysis"
                class="text-sm text-muted"
              >
                {{ lead.aiAnalysis }}
              </p>
              <p class="text-xs text-muted mt-2">
                <UIcon
                  name="i-lucide-clock"
                  class="size-3 inline mr-1"
                />
                {{ formatDate(lead.createdAt) }}
                <span
                  v-if="lead.source"
                  class="ml-2"
                >
                  <UIcon
                    name="i-lucide-tag"
                    class="size-3 inline mr-1"
                  />{{ lead.source }}
                </span>
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
              <p class="font-medium text-highlighted text-sm">
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
              <p class="font-medium text-highlighted text-sm">
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

        <!-- Pesan Asli -->
        <UCard>
          <template #header>
            <p class="font-semibold text-highlighted">
              Original Inquiry Message
            </p>
          </template>
          <p class="text-sm text-default whitespace-pre-line bg-elevated/50 rounded-lg p-3">
            {{ lead.rawMessage }}
          </p>
        </UCard>

        <!-- Draft Balasan -->
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

        <!-- Follow-up History -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <p class="font-semibold text-highlighted">
                Follow-up History
              </p>
              <UBadge
                v-if="followUps?.length"
                color="neutral"
                variant="subtle"
              >
                {{ followUps.length }}
              </UBadge>
            </div>
          </template>

          <!-- List catatan -->
          <div
            v-if="followUps?.length"
            class="space-y-3 mb-4"
          >
            <div
              v-for="fu in followUps"
              :key="fu.id"
              class="flex gap-3"
            >
              <div class="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UIcon
                  name="i-lucide-user"
                  class="size-4 text-primary"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-highlighted">{{ fu.userName || 'Sales' }}</span>
                  <span class="text-xs text-muted">{{ timeAgo(fu.createdAt) }}</span>
                </div>
                <p class="text-sm text-default mt-0.5">
                  {{ fu.note }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-sm text-muted mb-4"
          >
            No follow-up notes yet.
          </div>

          <!-- Form tambah catatan -->
          <div class="flex gap-2 pt-3 border-t border-default">
            <UTextarea
              v-model="newNote"
              placeholder="Write a follow-up note..."
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
          <p class="text-xs text-muted mt-1">
            Ctrl+Enter to send
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
