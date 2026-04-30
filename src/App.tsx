import { useState, useCallback } from 'react'
import { Layout, Space, Typography, Card, InputNumber, MessagePlugin, Tabs } from 'tdesign-react'
import { UploadIcon, FileIcon } from 'tdesign-icons-react'
import JsonViewer from './components/JsonViewer'
import ChartPanel from './components/ChartPanel'
import FileList from './components/FileList'

const { Header, Content, Aside } = Layout
const { Title, Text } = Typography

export interface JsonLine {
  lineNumber: number
  data: Record<string, unknown>
  raw: string
}

export interface ChartConfig {
  xKey: string
  yKey: string
  chartType: 'line' | 'bar' | 'scatter' | 'area'
}

function App() {
  const [jsonData, setJsonData] = useState<JsonLine[]>([])
  const [selectedLine, setSelectedLine] = useState<number>(0)
  const [fileName, setFileName] = useState<string>('')
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    xKey: '',
    yKey: '',
    chartType: 'line'
  })

  const parseJsonl = useCallback((content: string): JsonLine[] => {
    const lines = content.trim().split('\n')
    const result: JsonLine[] = []
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        try {
          const data = JSON.parse(line)
          result.push({
            lineNumber: index + 1,
            data,
            raw: line
          })
        } catch {
          console.error(`Line ${index + 1}: Invalid JSON`)
        }
      }
    })
    
    return result
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result as string
      const parsed = parseJsonl(content)
      setJsonData(parsed)
      setFileName(file.name)
      setSelectedLine(0)
      MessagePlugin.success(`成功加载 ${parsed.length} 条数据`)
    }
    reader.onerror = () => {
      MessagePlugin.error('文件读取失败')
    }
    reader.readAsText(file)
  }, [parseJsonl])

  const allKeys = jsonData.length > 0 
    ? [...new Set(jsonData.flatMap(item => Object.keys(item.data)))]
    : []

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
        <Space align="center" size="large">
          <FileIcon className="text-blue-500 text-2xl" />
          <Title level="h4" className="!mb-0">JSONL 数据分析器</Title>
        </Space>
        <div className="ml-auto">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
            <UploadIcon />
            <span>选择文件</span>
            <input 
              type="file" 
              accept=".jsonl,.json,.txt" 
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </Header>

      <Layout>
        <Aside width="280px" className="bg-white border-r border-gray-200 overflow-auto">
          <FileList
            data={jsonData}
            selectedLine={selectedLine}
            onSelectLine={setSelectedLine}
            fileName={fileName}
          />
        </Aside>

        <Content className="p-6 overflow-auto">
          {jsonData.length === 0 ? (
            <Card className="flex items-center justify-center h-full">
              <Space direction="vertical" align="center" size="large">
                <UploadIcon className="text-6xl text-gray-300" />
                <span className="text-gray-500">请上传 JSONL 文件开始分析</span>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                  <UploadIcon />
                  <span>选择文件</span>
                  <input 
                    type="file" 
                    accept=".jsonl,.json,.txt" 
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </Space>
            </Card>
          ) : (
            <Tabs>
              <Tabs.TabPanel value="viewer" label="数据查看器">
                <Card className="mt-4">
                  <Space direction="vertical" size="medium" className="w-full">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">选择行号:</span>
                      <InputNumber
                        size="large"
                        min={1}
                        max={jsonData.length}
                        value={selectedLine + 1}
                        onChange={(value) => setSelectedLine(((value as number) || 1) - 1)}
                        style={{ width: 120 }}
                      />
                      <Text theme="secondary">共 {jsonData.length} 行</Text>
                    </div>
                    {jsonData[selectedLine] && (
                      <JsonViewer data={jsonData[selectedLine].data} />
                    )}
                  </Space>
                </Card>
              </Tabs.TabPanel>

              <Tabs.TabPanel value="chart" label="数据图表">
                <Card className="mt-4">
                  <Space direction="vertical" size="medium" className="w-full">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-gray-600">X轴字段:</span>
                      <div style={{ width: 180 }}>
                        <select
                          className="w-full h-10 px-3 border border-gray-300 rounded"
                          value={chartConfig.xKey}
                          onChange={(e) => setChartConfig(prev => ({ ...prev, xKey: e.target.value }))}
                        >
                          <option value="">选择 X 轴字段</option>
                          {allKeys.map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-gray-600">Y轴字段:</span>
                      <div style={{ width: 180 }}>
                        <select
                          className="w-full h-10 px-3 border border-gray-300 rounded"
                          value={chartConfig.yKey}
                          onChange={(e) => setChartConfig(prev => ({ ...prev, yKey: e.target.value }))}
                        >
                          <option value="">选择 Y 轴字段</option>
                          {allKeys.map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-gray-600">图表类型:</span>
                      <div style={{ width: 140 }}>
                        <select
                          className="w-full h-10 px-3 border border-gray-300 rounded"
                          value={chartConfig.chartType}
                          onChange={(e) => setChartConfig(prev => ({ ...prev, chartType: e.target.value as ChartConfig['chartType'] }))}
                        >
                          <option value="line">折线图</option>
                          <option value="bar">柱状图</option>
                          <option value="scatter">散点图</option>
                          <option value="area">面积图</option>
                        </select>
                      </div>
                    </div>
                    <ChartPanel
                      data={jsonData}
                      config={chartConfig}
                    />
                  </Space>
                </Card>
              </Tabs.TabPanel>
            </Tabs>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
