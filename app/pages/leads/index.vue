<script setup lang="ts">
import type { Lead, User } from '#shared/types'

const route = useRoute()
const router = useRouter()
const { user: currentUser } = useUserSession()
const isAdmin = computed(() => (currentUser.value as { role?: string } | null)?.role === 'admin')

const { data: salesUsers } = await useFetch<User[]>('/api/users', {
  immediate: isAdmin.value,
  transform: users => users.filter(u => u.role === 'sales')
})

// --- Import modal state ---
const importModalOpen = ref(false)
const importFile = ref<File | null>(null)
const importLoading = ref(false)
const importFileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const toast = useToast()

function openImportModal() {
  importFile.value = null
  importModalOpen.value = true
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    importFile.value = input.files[0]
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    importFile.value = file
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function startImport() {
  if (!importFile.value) return
  importLoading.value = true

  try {
    const form = new FormData()
    form.append('file', importFile.value)

    const result = await $fetch<{
      total: number
      processed: number
      success: number
      failed: number
      errors: string[]
    }>('/api/leads/import', {
      method: 'POST',
      body: form
    })

    importModalOpen.value = false

    if (result.success > 0) {
      refresh()
      toast.add({
        title: `${result.success} lead${result.success > 1 ? 's' : ''} imported successfully`,
        description: result.failed > 0 ? `${result.failed} row${result.failed > 1 ? 's' : ''} failed to process.` : 'All leads have been analyzed by AI.',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })
    } else {
      toast.add({
        title: 'Import failed',
        description: result.errors[0] || 'No leads were successfully processed.',
        color: 'error',
        icon: 'i-lucide-x-circle'
      })
    }
  } catch (err: unknown) {
    importModalOpen.value = false
    const message = (err as { data?: { message?: string } })?.data?.message || 'An error occurred during import.'
    toast.add({
      title: 'Import failed',
      description: message,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  } finally {
    importLoading.value = false
  }
}

function downloadTemplate() {
  window.location.href = '/api/leads/template'
}

const activeStatus = ref((route.query.status as string) || 'all')
const activePipeline = ref((route.query.pipeline as string) || 'all')
const activeAssignee = ref(route.query.assignedTo ? String(route.query.assignedTo) : 'all')
const currentPage = ref(Number(route.query.page) || 1)

function buildQuery(overrides: Record<string, unknown> = {}) {
  return {
    ...(activeStatus.value !== 'all' ? { status: activeStatus.value } : {}),
    ...(activePipeline.value !== 'all' ? { pipeline: activePipeline.value } : {}),
    ...(activeAssignee.value !== 'all' ? { assignedTo: activeAssignee.value } : {}),
    page: currentPage.value,
    ...overrides
  }
}

watch(activeStatus, () => {
  currentPage.value = 1
  router.replace({ query: buildQuery({ page: 1 }) })
})

watch(activePipeline, () => {
  currentPage.value = 1
  router.replace({ query: buildQuery({ page: 1 }) })
})

watch(activeAssignee, () => {
  currentPage.value = 1
  router.replace({ query: buildQuery({ page: 1 }) })
})

watch(currentPage, (val) => {
  router.replace({ query: buildQuery({ page: val }) })
})

const { data, pending, refresh } = await useFetch<{
  data: Lead[]
  total: number
  page: number
  limit: number
  totalPages: number
}>('/api/leads', {
  query: computed(() => ({
    ...(activeStatus.value !== 'all' ? { status: activeStatus.value } : {}),
    ...(activePipeline.value !== 'all' ? { pipeline: activePipeline.value } : {}),
    ...(activeAssignee.value !== 'all' ? { assignedTo: activeAssignee.value } : {}),
    page: currentPage.value,
    limit: 20
  }))
})

const leads = computed(() => data.value?.data ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)
const total = computed(() => data.value?.total ?? 0)

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Hot', value: 'Hot' },
  { label: 'Warm', value: 'Warm' },
  { label: 'Cold', value: 'Cold' },
  { label: 'Nurture', value: 'Nurture' }
]

const pipelineOptions = [
  { label: 'All Stages', value: 'all', icon: 'i-lucide-layers' },
  { label: 'New', value: 'new', icon: 'i-lucide-inbox' },
  { label: 'Contacted', value: 'contacted', icon: 'i-lucide-phone' },
  { label: 'Negotiating', value: 'negotiating', icon: 'i-lucide-handshake' },
  { label: 'Closed Won', value: 'closed_won', icon: 'i-lucide-check-circle-2' },
  { label: 'Closed Lost', value: 'closed_lost', icon: 'i-lucide-x-circle' }
]

const statusConfig: Record<string, { color: string, icon: string, badge: 'error' | 'warning' | 'info' | 'secondary' }> = {
  Hot: { color: 'text-red-500', icon: 'i-lucide-flame', badge: 'error' },
  Warm: { color: 'text-amber-500', icon: 'i-lucide-sun', badge: 'warning' },
  Cold: { color: 'text-sky-500', icon: 'i-lucide-snowflake', badge: 'info' },
  Nurture: { color: 'text-violet-500', icon: 'i-lucide-droplets', badge: 'secondary' }
}

const pipelineConfig: Record<string, { label: string, icon: string }> = {
  new: { label: 'New', icon: 'i-lucide-inbox' },
  contacted: { label: 'Contacted', icon: 'i-lucide-phone' },
  negotiating: { label: 'Negotiating', icon: 'i-lucide-handshake' },
  closed_won: { label: 'Closed Won', icon: 'i-lucide-check-circle-2' },
  closed_lost: { label: 'Closed Lost', icon: 'i-lucide-x-circle' }
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

function exportCSV() {
  const params = new URLSearchParams()
  if (activeStatus.value !== 'all') params.set('status', activeStatus.value)
  if (activePipeline.value !== 'all') params.set('pipeline', activePipeline.value)
  const qs = params.toString()
  window.location.href = `/api/leads/export${qs ? `?${qs}` : ''}`
}
</script>

<template>
  <UDashboardPanel id="leads">
    <template #header>
      <UDashboardNavbar
        title="Leads"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            to="/leads/new"
            icon="i-lucide-plus"
            size="md"
          >
            New Lead
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <div class="flex flex-col gap-2 py-2">
            <!-- AI Score filter -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted w-12 shrink-0">Score</span>
              <div class="flex items-center gap-1 overflow-x-auto">
                <UButton
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :variant="activeStatus === opt.value ? 'solid' : 'ghost'"
                  :color="activeStatus === opt.value ? 'primary' : 'neutral'"
                  size="sm"
                  class="shrink-0"
                  @click="activeStatus = opt.value"
                >
                  {{ opt.label }}
                </UButton>
              </div>
            </div>
            <!-- Pipeline Stage filter -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted w-12 shrink-0">Stage</span>
              <USelect
                v-model="activePipeline"
                :items="pipelineOptions.map(o => ({ label: o.label, value: o.value }))"
                size="sm"
                class="w-40"
              />
            </div>
            <!-- Assignee filter (admin only) -->
            <div
              v-if="isAdmin && salesUsers?.length"
              class="flex items-center gap-2"
            >
              <span class="text-xs text-muted w-12 shrink-0">Assignee</span>
              <USelect
                v-model="activeAssignee"
                :items="[{ label: 'All', value: 'all' }, ...(salesUsers ?? []).map(u => ({ label: u.name, value: String(u.id) }))]"
                size="sm"
                class="w-40"
              />
            </div>
          </div>
        </template>
        <template #right>
          <span
            v-if="total > 0"
            class="text-xs text-muted"
          >{{ total }} leads</span>
          <UButton
            icon="i-lucide-upload"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="openImportModal"
          >
            Import
          </UButton>
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="exportCSV"
          >
            Export CSV
          </UButton>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="pending"
            @click="refresh()"
          >
            Refresh
          </UButton>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="p-4 lg:p-6 flex flex-col gap-4">
        <!-- Empty state -->
        <div
          v-if="!pending && leads.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <UIcon
            name="i-lucide-inbox"
            class="size-12 text-muted mb-4"
          />
          <p class="text-highlighted font-medium">
            No leads yet
          </p>
          <p class="text-muted text-sm mt-1">
            {{ activeStatus !== 'all' || activePipeline !== 'all' || activeAssignee !== 'all'
              ? `No leads matching the selected filters`
              : 'Start by adding your first lead' }}
          </p>
          <UButton
            to="/leads/new"
            icon="i-lucide-plus"
            class="mt-4"
          >
            New Lead
          </UButton>
        </div>

        <!-- Lead list -->
        <div
          v-else
          class="space-y-3"
        >
          <NuxtLink
            v-for="lead in leads"
            :key="lead.id"
            :to="`/leads/${lead.id}`"
            class="block"
          >
            <UCard class="hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
              <div class="flex items-center gap-4">
                <!-- Score badge -->
                <div
                  class="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ring-2"
                  :class="lead.status === 'Hot' ? 'bg-red-500/10 ring-red-500/30 text-red-600 dark:text-red-400'
                    : lead.status === 'Warm' ? 'bg-amber-500/10 ring-amber-500/30 text-amber-600 dark:text-amber-400'
                      : lead.status === 'Cold' ? 'bg-sky-500/10 ring-sky-500/30 text-sky-600 dark:text-sky-400'
                        : lead.status === 'Nurture' ? 'bg-violet-500/10 ring-violet-500/30 text-violet-600 dark:text-violet-400'
                          : 'bg-muted ring-default text-muted'"
                >
                  {{ lead.score ?? '?' }}
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-semibold text-highlighted truncate">
                      {{ lead.name }}
                    </p>
                    <UBadge
                      v-if="lead.status"
                      :color="statusConfig[lead.status]?.badge"
                      variant="subtle"
                      size="sm"
                    >
                      <UIcon
                        :name="statusConfig[lead.status]?.icon"
                        class="size-3 mr-1"
                      />
                      {{ lead.status }}
                    </UBadge>
                    <UBadge
                      v-if="lead.source"
                      color="neutral"
                      variant="outline"
                      size="sm"
                    >
                      {{ lead.source }}
                    </UBadge>
                    <UBadge
                      v-if="(lead as any).pipelineStage && (lead as any).pipelineStage !== 'new'"
                      color="neutral"
                      variant="subtle"
                      size="sm"
                    >
                      <UIcon
                        :name="pipelineConfig[(lead as any).pipelineStage]?.icon || 'i-lucide-inbox'"
                        class="size-3 mr-1"
                      />
                      {{ pipelineConfig[(lead as any).pipelineStage]?.label }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-muted truncate mt-0.5">
                    {{ lead.rawMessage }}
                  </p>
                  <div class="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
                    <span v-if="lead.destination">
                      <UIcon
                        name="i-lucide-map-pin"
                        class="size-3 inline mr-0.5"
                      />{{ lead.destination }}
                    </span>
                    <span v-if="lead.budget">
                      <UIcon
                        name="i-lucide-wallet"
                        class="size-3 inline mr-0.5"
                      />{{ lead.budget }}
                    </span>
                    <span v-if="lead.paxCount">
                      <UIcon
                        name="i-lucide-users"
                        class="size-3 inline mr-0.5"
                      />{{ lead.paxCount }} pax
                    </span>
                    <span v-if="lead.travelDate">
                      <UIcon
                        name="i-lucide-calendar"
                        class="size-3 inline mr-0.5"
                      />{{ lead.travelDate }}
                    </span>
                    <span v-if="(lead as Lead).assignedToName">
                      <UIcon
                        name="i-lucide-user-check"
                        class="size-3 inline mr-0.5"
                      />{{ (lead as Lead).assignedToName }}
                    </span>
                    <span class="ml-auto">{{ timeAgo(lead.createdAt) }}</span>
                  </div>
                </div>

                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4 text-muted shrink-0"
                />
              </div>
            </UCard>
          </NuxtLink>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex justify-center pt-2"
        >
          <UPagination
            v-model:page="currentPage"
            :total="total"
            :items-per-page="20"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Import Modal -->
  <UModal
    v-model:open="importModalOpen"
    title="Import Leads"
    description="Upload a CSV or Excel file containing lead data. Each row will be automatically analyzed by AI."
    :ui="{ footer: 'justify-between' }"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Download template -->
        <UAlert
          color="info"
          variant="subtle"
          icon="i-lucide-info"
          title="Document format"
          description="Download the template to see the required column format."
        >
          <template #description>
            Download the template to see the required column format.
            <UButton
              variant="link"
              color="primary"
              size="xs"
              icon="i-lucide-file-down"
              class="ml-1 p-0"
              @click="downloadTemplate"
            >
              Download CSV template
            </UButton>
          </template>
        </UAlert>

        <!-- File upload zone -->
        <div
          class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
          :class="isDragging ? 'border-primary bg-primary/5' : 'border-default hover:border-primary/50'"
          @click="importFileInput?.click()"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="importFileInput"
            type="file"
            accept=".csv,.xlsx,.xls"
            class="hidden"
            @change="handleFileSelect"
          >
          <template v-if="importFile">
            <UIcon
              name="i-lucide-file-spreadsheet"
              class="size-8 text-primary mx-auto mb-2"
            />
            <p class="font-medium text-highlighted">
              {{ importFile.name }}
            </p>
            <p class="text-sm text-muted mt-0.5">
              {{ formatFileSize(importFile.size) }} · Click to change file
            </p>
          </template>
          <template v-else>
            <UIcon
              name="i-lucide-upload-cloud"
              class="size-8 text-muted mx-auto mb-2"
            />
            <p class="font-medium text-highlighted">
              Drag & drop your file here
            </p>
            <p class="text-sm text-muted mt-0.5">
              or click to browse
            </p>
            <p class="text-xs text-muted mt-2">
              Supports CSV (.csv) and Excel (.xlsx, .xls) · Max 50 rows
            </p>
          </template>
        </div>

        <!-- Required columns -->
        <div>
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Required columns
          </p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              color="error"
              variant="subtle"
              size="sm"
            >
              name *
            </UBadge>
            <UBadge
              color="error"
              variant="subtle"
              size="sm"
            >
              message *
            </UBadge>
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              source
            </UBadge>
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              email
            </UBadge>
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              phone
            </UBadge>
          </div>
          <p class="text-xs text-muted mt-1">
            * required · Other columns are optional
          </p>
        </div>

        <!-- Loading state -->
        <div
          v-if="importLoading"
          class="flex items-center gap-3 p-3 rounded-lg bg-primary/5"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-5 text-primary animate-spin shrink-0"
          />
          <div>
            <p class="text-sm font-medium text-highlighted">
              Processing...
            </p>
            <p class="text-xs text-muted">
              AI is analyzing each lead. Please wait.
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        :disabled="importLoading"
        @click="importModalOpen = false"
      >
        Cancel
      </UButton>
      <UButton
        icon="i-lucide-upload"
        :disabled="!importFile || importLoading"
        :loading="importLoading"
        @click="startImport"
      >
        {{ importLoading ? 'Processing...' : 'Start Import' }}
      </UButton>
    </template>
  </UModal>
</template>
