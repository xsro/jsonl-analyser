import { Card } from 'tdesign-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { JsonLine, ChartConfig } from '../App'

interface ChartPanelProps {
  data: JsonLine[]
  config: ChartConfig
}

// jq 风格路径解析，如 a.b.c 或 a[0].b
const getValueByPath = (obj: unknown, path: string): unknown => {
  const parts = path.split('.').filter(Boolean)
  let current: unknown = obj
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)
    if (arrayMatch) {
      const key = arrayMatch[1]
      const index = parseInt(arrayMatch[2], 10)
      current = (current as Record<string, unknown>)?.[key]
      if (Array.isArray(current)) {
        current = current[index]
      } else {
        return undefined
      }
    } else if (Array.isArray(current)) {
      const idx = parseInt(part, 10)
      if (!isNaN(idx)) {
        current = current[idx]
      } else {
        return undefined
      }
    } else {
      current = (current as Record<string, unknown>)?.[part]
    }
  }
  
  return current
}

const ChartPanel: React.FC<ChartPanelProps> = ({ data, config }) => {
  if (!config.xKey || !config.yKey) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <span className="text-gray-500">请选择 X 轴和 Y 轴字段</span>
      </Card>
    )
  }

  const chartData = data
    .map((item) => {
      const xVal = getValueByPath(item.data, config.xKey)
      const yVal = getValueByPath(item.data, config.yKey)
      
      const x = typeof xVal === 'number' ? xVal : 
                typeof xVal === 'string' ? xVal : 
                String(xVal)
      const y = typeof yVal === 'number' ? yVal : 
                 typeof yVal === 'string' ? parseFloat(yVal as string) : 
                 null

      if (y === null || isNaN(y as number)) {
        return null
      }

      return { x, y }
    })
    .filter((item): item is { x: string | number; y: number } => item !== null)

  // 无数据时使用默认占位数据
  const displayData = chartData.length > 0 ? chartData : [
    { x: 1, y: 20 },
    { x: 2, y: 45 },
    { x: 3, y: 30 },
    { x: 4, y: 60 },
    { x: 5, y: 50 }
  ]

  return (
    <Card className="h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="x" 
            label={{ value: config.xKey, position: 'insideBottom', offset: -20 }} 
            tick={{ angle: -45, textAnchor: 'end' } as any}
            height={80}
          />
          <YAxis 
            label={{ value: config.yKey, angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="y" 
            stroke="#165DFF" 
            strokeWidth={2}
            dot={{ fill: '#165DFF', r: 4 }}
            activeDot={{ r: 6 }}
            name={config.yKey}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export default ChartPanel
