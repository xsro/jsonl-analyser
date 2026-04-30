import { Card, Empty } from 'tdesign-react'
import { LineChart, BarChart, ScatterChart, AreaChart, Line, Bar, Scatter, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { JsonLine, ChartConfig } from '../App'

interface ChartPanelProps {
  data: JsonLine[]
  config: ChartConfig
}

const ChartPanel: React.FC<ChartPanelProps> = ({ data, config }) => {
  if (!config.xKey || !config.yKey) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <Empty description="请选择 X 轴和 Y 轴字段" />
      </Card>
    )
  }

  const chartData = data
    .map((item) => {
      const xVal = item.data[config.xKey]
      const yVal = item.data[config.yKey]
      
      const x = typeof xVal === 'number' ? xVal : 
                typeof xVal === 'string' ? xVal : 
                String(xVal)
      const y = typeof yVal === 'number' ? yVal : 
                 typeof yVal === 'string' ? parseFloat(yVal as string) : 
                 null

      if (y === null || isNaN(y as number)) {
        return null
      }

      return {
        line: item.lineNumber,
        x,
        y
      }
    })
    .filter((item): item is { line: number; x: string | number; y: number } => item !== null)

  if (chartData.length === 0) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <Empty description="所选字段没有可用的数值数据" />
      </Card>
    )
  }

  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 60 }
  }

  const axisProps = {
    xAxis: <XAxis 
      dataKey="x" 
      label={{ value: config.xKey, position: 'insideBottom', offset: -20 }} 
      tick={{ angle: -45, textAnchor: 'end' } as any}
      height={80}
    />,
    yAxis: <YAxis 
      label={{ value: config.yKey, angle: -90, position: 'insideLeft' }} 
    />,
    cartesianGrid: <CartesianGrid strokeDasharray="3 3" />,
    tooltip: <Tooltip />,
    legend: <Legend />
  }

  let chartElement: React.ReactElement | null = null

  switch (config.chartType) {
    case 'line':
      chartElement = (
        <LineChart {...commonProps}>
          {axisProps.cartesianGrid}
          {axisProps.xAxis}
          {axisProps.yAxis}
          {axisProps.tooltip}
          {axisProps.legend}
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
      )
      break

    case 'bar':
      chartElement = (
        <BarChart {...commonProps}>
          {axisProps.cartesianGrid}
          {axisProps.xAxis}
          {axisProps.yAxis}
          {axisProps.tooltip}
          {axisProps.legend}
          <Bar 
            dataKey="y" 
            fill="#165DFF"
            name={config.yKey}
          />
        </BarChart>
      )
      break

    case 'scatter':
      chartElement = (
        <ScatterChart {...commonProps}>
          {axisProps.cartesianGrid}
          {axisProps.xAxis}
          {axisProps.yAxis}
          {axisProps.tooltip}
          <Scatter 
            name={config.yKey} 
            dataKey="y" 
            fill="#165DFF"
          />
        </ScatterChart>
      )
      break

    case 'area':
      chartElement = (
        <AreaChart {...commonProps}>
          {axisProps.cartesianGrid}
          {axisProps.xAxis}
          {axisProps.yAxis}
          {axisProps.tooltip}
          {axisProps.legend}
          <Area 
            type="monotone" 
            dataKey="y" 
            stroke="#165DFF" 
            fill="#165DFF"
            fillOpacity={0.3}
            name={config.yKey}
          />
        </AreaChart>
      )
      break
  }

  if (!chartElement) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <Empty description="无法渲染图表" />
      </Card>
    )
  }

  return (
    <Card className="h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        {chartElement}
      </ResponsiveContainer>
    </Card>
  )
}

export default ChartPanel
