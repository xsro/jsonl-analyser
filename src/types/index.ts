export interface JsonlData {
  index: number
  data: any
}

export interface ChartConfig {
  xKey: string
  yKeys: string[]
}

export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonValue[] 
  | { [key: string]: JsonValue }
