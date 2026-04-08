<script setup lang="ts">
import { VisXYContainer, VisLine, VisArea, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'
import { CurveType } from '@unovis/ts'

const props = defineProps<{
  data: { date: string, count: number }[]
}>()

const x = (_: { date: string, count: number }, i: number) => i
const y = (d: { date: string, count: number }) => d.count

const xTicks = (i: number) => {
  const d = props.data[i]
  if (!d) return ''
  const date = new Date(d.date)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const tooltipTemplate = (d: { date: string, count: number }) =>
  `<div class="text-xs px-2 py-1"><p class="font-medium">${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p><p>${d.count} lead${d.count !== 1 ? 's' : ''}</p></div>`
</script>

<template>
  <VisXYContainer
    :data="data"
    :height="160"
  >
    <VisArea
      :x="x"
      :y="y"
      :curve-type="CurveType.MonotoneX"
      color="var(--color-primary)"
      :opacity="0.15"
    />
    <VisLine
      :x="x"
      :y="y"
      :curve-type="CurveType.MonotoneX"
      color="var(--color-primary)"
    />
    <VisAxis
      type="x"
      :tick-format="xTicks"
      :num-ticks="5"
    />
    <VisAxis type="y" />
    <VisCrosshair
      :template="tooltipTemplate"
      color="var(--color-primary)"
    />
    <VisTooltip />
  </VisXYContainer>
</template>
