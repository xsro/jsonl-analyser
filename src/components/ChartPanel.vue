<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import type { JsonlData } from '../types'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const props = defineProps<{
  data: JsonlData[]
}>()

const xKey = ref('t')
const yKeysInput = ref('state.debug.p1[1]')
const yKeys = computed(() => {
  return yKeysInput.value.split(',').map(k => k.trim()).filter(k => k.length > 0)
})

const chartOption = computed(() => {
  const xData: number[] = []
  const seriesData: { name: string; data: (number | null)[] }[] = yKeys.value.map(key => ({
    name: key,
    data: []
  }))

  props.data.forEach((row) => {
    const xVal = getNestedValue(row.data, xKey.value)
    xData.push(typeof xVal === 'number' ? xVal : xData.length)

    yKeys.value.forEach((key, idx) => {
      const val = getNestedValue(row.data, key)
      seriesData[idx].data.push(typeof val === 'number' ? val : null)
    })
  })

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params.length) return ''
        let result = `t: ${params[0].axisValue}<br/>`
        params.forEach((p: any) => {
          if (p.value !== null) {
            result += `${p.seriesName}: ${p.value}<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: yKeys.value,
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      name: xKey.value,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: 'values'
    },
    series: seriesData.map(s => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      showSymbol: false
    }))
  }
})

function getNestedValue(obj: any, path: string): any {
  if (!path) return undefined
  
  const bracketMatch = path.match(/^([^\[]+)\[(\d+)\](.*)$/)
  if (bracketMatch) {
    const [, key, index, rest] = bracketMatch
    const arr = obj?.[key]
    if (Array.isArray(arr)) {
      return getNestedValue(arr[parseInt(index)], rest || '')
    }
    return undefined
  }
  
  const dotMatch = path.match(/^([^.]+)\.(.+)$/)
  if (dotMatch) {
    const [, key, rest] = dotMatch
    return getNestedValue(obj?.[key], rest)
  }
  
  return obj?.[path]
}
</script>

<template>
  <div class="h-full flex flex-col bg-white rounded-lg shadow">
    <div class="p-3 border-b">
      <div class="flex flex-wrap gap-4 items-end">
        <div>
          <label class="block text-sm font-medium mb-1">横坐标 (x):</label>
          <input
            v-model="xKey"
            type="text"
            placeholder="例如: t"
            class="w-40 px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium mb-1">纵坐标 (y) - 多个用逗号分隔:</label>
          <input
            v-model="yKeysInput"
            type="text"
            placeholder="例如: state.debug.p1[1], state.debug.p2"
            class="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div class="mt-2 text-xs text-gray-500">
        <p>支持嵌套路径访问，例如: <code class="bg-gray-100 px-1 rounded">state.debug.p1[1]</code></p>
      </div>
    </div>
    
    <div class="flex-1 p-2 min-h-0">
      <v-chart 
        v-if="data.length > 0 && yKeys.length > 0" 
        :option="chartOption" 
        autoresize 
        class="w-full h-full"
      />
      <div v-else class="h-full flex items-center justify-center text-gray-400">
        数据不足或未配置纵坐标
      </div>
    </div>
  </div>
</template>
