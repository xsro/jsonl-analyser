// filepath: src/main.ts
import Plotly from 'plotly.js-dist-min';
import { JsonViewer } from './jsonViewer';

interface JsonData {
  [key: string]: unknown;
}

interface ChartData {
  x: number[];
  y: { [key: string]: number[] };
}

// File System Access API 类型声明
interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>;
  name: string;
}

interface FileSystemSyncAccessHandle {
  read(buffer: ArrayBuffer, options?: { at?: number }): Promise<number>;
  write(buffer: ArrayBuffer, options?: { at?: number }): Promise<number>;
  close(): void;
  getSize(): Promise<number>;
  flush(): Promise<void>;
}

declare global {
  interface Window {
    showOpenFilePicker(options?: {
      multiple?: boolean;
      excludeAcceptAllOption?: boolean;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }): Promise<FileSystemFileHandle[]>;
  }
}

class JsonlAnalyser {
  private data: JsonData[] = [];
  private currentRow: number = 0;
  private updateInterval: number | null = null;
  private chartData: ChartData = { x: [], y: {} };
  private xKey: string = 't';
  private yKeys: string[] = ['state.debug.p1[1]'];

  private openFileBtn: HTMLButtonElement;
  private filePathEl: HTMLElement;
  private xKeyInput: HTMLInputElement;
  private yKeysInput: HTMLInputElement;
  private updateChartBtn: HTMLButtonElement;
  private toggleRefreshBtn: HTMLButtonElement;
  private chartDiv: HTMLElement;
  private autoRefresh: boolean = false;
  private fileHandle: FileSystemFileHandle | null = null;
  private jsonViewer: JsonViewer;

  constructor() {
    this.openFileBtn = document.getElementById('open-file') as HTMLButtonElement;
    this.filePathEl = document.getElementById('file-path') as HTMLElement;
    this.xKeyInput = document.getElementById('x-key') as HTMLInputElement;
    this.yKeysInput = document.getElementById('y-keys') as HTMLInputElement;
    this.updateChartBtn = document.getElementById('update-chart') as HTMLButtonElement;
    this.toggleRefreshBtn = document.getElementById('toggle-refresh') as HTMLButtonElement;
    this.chartDiv = document.getElementById('plotly-chart') as HTMLElement;

    const jsonViewerEl = document.getElementById('json-viewer') as HTMLElement;
    this.jsonViewer = new JsonViewer({
      container: jsonViewerEl,
      onRowChange: (row: number) => {
        this.currentRow = row;
      }
    });

    this.init();
  }

  private init(): void {
    this.openFileBtn.addEventListener('click', this.handleOpenFile.bind(this));
    this.updateChartBtn.addEventListener('click', this.handleUpdateChart.bind(this));
    this.toggleRefreshBtn.addEventListener('click', this.handleToggleRefresh.bind(this));
    window.addEventListener('resize', this.drawChart.bind(this));

    this.xKeyInput.value = this.xKey;
    this.yKeysInput.value = this.yKeys.join(', ');
  }

  private async handleOpenFile(): Promise<void> {
    try {
      const handles = await window.showOpenFilePicker({
        types: [
          {
            description: 'JSON Lines',
            accept: { 'application/json': ['.jsonl', '.jsonlines', '.json'] }
          }
        ],
        multiple: false
      });

      if (handles.length > 0) {
        this.fileHandle = handles[0];
        this.filePathEl.textContent = handles[0].name;
        await this.readFileFromHandle();
      }
    } catch (err) {
      // 用户取消选择时不报错
      if ((err as Error).name !== 'AbortError') {
        console.error('Error opening file:', err);
      }
    }
  }

  private async readFileFromHandle(): Promise<void> {
    if (!this.fileHandle) return;

    try {
      const file = await this.fileHandle.getFile();
      const text = await file.text();
      this.data = text
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      if (this.data.length > 0) {
        this.jsonViewer.setData(this.data);
        this.jsonViewer.setRow(this.currentRow);
        this.updateChartData();
        this.drawChart();
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }

  private handleToggleRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    this.toggleRefreshBtn.textContent = `Auto Refresh: ${this.autoRefresh ? 'ON' : 'OFF'}`;
    this.toggleRefreshBtn.style.background = this.autoRefresh ? '#2d8f3c' : '#0e639c';

    if (this.autoRefresh && this.fileHandle) {
      this.startAutoRefresh();
    } else if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private startAutoRefresh(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = window.setInterval(() => {
      if (this.fileHandle) {
        this.readFileFromHandle();
      }
    }, 10000);
  }

  private handleUpdateChart(): void {
    this.xKey = this.xKeyInput.value.trim() || 't';
    this.yKeys = this.yKeysInput.value
      .split(',')
      .map(k => k.trim())
      .filter(k => k);

    this.updateChartData();
    this.drawChart();
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let result: unknown = obj;

    for (const key of keys) {
      if (result && typeof result === 'object') {
        result = (result as JsonData)[key];
      } else {
        return undefined;
      }
    }

    return result;
  }

  private updateChartData(): void {
    this.chartData = { x: [], y: {} };

    for (const yKey of this.yKeys) {
      this.chartData.y[yKey] = [];
    }

    for (const row of this.data) {
      const xVal = this.getNestedValue(row, this.xKey);
      if (typeof xVal === 'number') {
        this.chartData.x.push(xVal);

        for (const yKey of this.yKeys) {
          const yVal = this.getNestedValue(row, yKey);
          this.chartData.y[yKey].push(typeof yVal === 'number' ? yVal : NaN);
        }
      }
    }
  }

  private drawChart(): void {
    console.log(this)
    if (this.chartData.x.length === 0) {
      this.chartDiv.innerHTML = '<div class="loading">No data to display</div>';
      return;
    }

    const xMin = Math.min(...this.chartData.x);
    const xMax = Math.max(...this.chartData.x);
    let yMin = Infinity;
    let yMax = -Infinity;

    for (const yKey of this.yKeys) {
      const values = this.chartData.y[yKey].filter(v => !isNaN(v));
      if (values.length > 0) {
        yMin = Math.min(yMin, ...values);
        yMax = Math.max(yMax, ...values);
      }
    }

    if (yMin === Infinity) yMin = 0;
    if (yMax === -Infinity) yMax = 1;
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }

    const colors = ['#4ec9b0', '#ce9178', '#569cd6', '#dcdcaa', '#c586c0'];
    const traces = this.yKeys.map((yKey, keyIndex) => ({
      x: this.chartData.x,
      y: this.chartData.y[yKey],
      type: 'scatter',
      mode: 'lines+markers',
      name: yKey,
      line: { color: colors[keyIndex % colors.length], width: 2 },
      marker: { size: 4 }
    }));

    const layout = {
      paper_bgcolor: '#1e1e1e',
      plot_bgcolor: '#1e1e1e',
      font: { color: '#d4d4d4' },
      xaxis: {
        title: this.xKey,
        gridcolor: '#333',
        zerolinecolor: '#555'
      },
      yaxis: {
        title: 'Value',
        gridcolor: '#333',
        zerolinecolor: '#555',
        range: [yMin, yMax]
      },
      margin: { t: 20, r: 20, b: 40, l: 60 },
      showlegend: true,
      legend: { x: 1, y: 1, bgcolor: 'rgba(0,0,0,0.5)' }
    };

    const config = { responsive: true, displayModeBar: false };
    Plotly.newPlot(this.chartDiv, traces, layout, config);
  }
}

new JsonlAnalyser();