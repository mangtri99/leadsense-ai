<script setup lang="ts">
import { VisSingleContainer, VisDonut } from '@unovis/vue'

const props = defineProps<{
  closedWon: number
  closedLost: number
}>()

const data = computed(() => [
  { label: 'Won', value: props.closedWon },
  { label: 'Lost', value: props.closedLost }
])

const total = computed(() => props.closedWon + props.closedLost)
const winRate = computed(() =>
  total.value > 0 ? Math.round((props.closedWon / total.value) * 100) : 0
)

const value = (d: { label: string, value: number }) => d.value
const colorMap: Record<string, string> = { Won: '#22c55e', Lost: '#f87171' }
const color = (d: { label: string, value: number }) => colorMap[d.label] ?? '#94a3b8'
</script>

<template>
  <div class="flex items-center gap-6">
    <div class="relative shrink-0">
      <VisSingleContainer
        :data="data"
        :width="120"
        :height="120"
      >
        <VisDonut
          :value="value"
          :color="color"
          :arc-width="28"
        />
      </VisSingleContainer>
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span class="text-2xl font-bold text-highlighted">{{ winRate }}%</span>
        <span class="text-xs text-muted">Win Rate</span>
      </div>
    </div>
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-green-500 shrink-0" />
        <span class="text-sm text-default">Won</span>
        <span class="ml-auto text-sm font-semibold text-highlighted">{{ closedWon }}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-red-400 shrink-0" />
        <span class="text-sm text-default">Lost</span>
        <span class="ml-auto text-sm font-semibold text-highlighted">{{ closedLost }}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-muted shrink-0" />
        <span class="text-sm text-muted">Total closed</span>
        <span class="ml-auto text-sm font-semibold text-muted">{{ total }}</span>
      </div>
    </div>
  </div>
</template>
