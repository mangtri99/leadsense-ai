<script setup lang="ts">
import { VisXYContainer, VisStackedBar, VisAxis } from '@unovis/vue'

const props = defineProps<{
  data: { destination: string, count: number }[]
}>()

const x = (d: { destination: string, count: number }) => d.count
const y = (_: { destination: string, count: number }, i: number) => i

const yTicks = (i: number) => {
  const d = props.data[i]
  return d ? d.destination : ''
}
</script>

<template>
  <VisXYContainer
    :data="data"
    :height="Math.max(160, data.length * 36)"
  >
    <VisStackedBar
      :x="x"
      :y="y"
      :bar-padding="0.3"
      color="var(--color-primary)"
      orientation="horizontal"
    />
    <VisAxis
      type="y"
      :tick-format="yTicks"
      :num-ticks="data.length"
    />
    <VisAxis type="x" />
  </VisXYContainer>
</template>
