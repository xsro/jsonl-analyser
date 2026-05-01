// filepath: src/main.ts
import { JsonViewer } from './jsonViewer';
import { ChartData, createLineChart } from './lineChart';
import { createScatterChart } from './scatterChart';

interface JsonData {
  [key: string]: unknown;
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

interface KeyRow {
  xKey: string;
  yKey: string;
}

class JsonlAnalyser {
  private data: JsonData[] = [];
  private currentRow: number = 0;
  private updateInterval: number | null = null;
  private chartData: { scatter: ChartData, line: ChartData } = { scatter: {}, line: {} };
  private chartDataKeys = {
    scatter: [
      { xKey: 'state.debug.p1[0]', yKey: 'state.debug.p1[1]' }
    ],
    line: [
      { xKey: 't', yKey: 'state.debug.p1[0]' },
      { xKey: 't', yKey: 'state.debug.p1[1]' },
      { xKey: 't', yKey: 'state.debug.p1[2]' },
    ]
  };
  private chartType: string = 'line';

  private openFileBtn: HTMLButtonElement;
  private filePathEl: HTMLElement;
  private toggleRefreshBtn: HTMLButtonElement;
  private chartDiv: HTMLElement;
  private rowInput: HTMLInputElement;
  private totalRowsEl: HTMLElement;
  private firstRowBtn: HTMLButtonElement;
  private lastRowBtn: HTMLButtonElement;
  private prevRowBtn: HTMLButtonElement;
  private nextRowBtn: HTMLButtonElement;
  private autoRefresh: boolean = false;
  private fileHandle: FileSystemFileHandle | null = null;
  private jsonViewer: JsonViewer;
  private chartTypeSelect: HTMLSelectElement;
  private openKeyConfigBtn: HTMLButtonElement;
  private modal: HTMLElement;
  private keysTbody: HTMLTableSectionElement;
  private pendingKeys: KeyRow[] = [];

  constructor() {
    this.openFileBtn = document.getElementById('open-file') as HTMLButtonElement;
    this.filePathEl = document.getElementById('file-path') as HTMLElement;
    this.toggleRefreshBtn = document.getElementById('toggle-refresh') as HTMLButtonElement;
    this.chartDiv = document.getElementById('plotly-chart') as HTMLElement;
    this.rowInput = document.getElementById('row-input') as HTMLInputElement;
    this.totalRowsEl = document.getElementById('total-rows') as HTMLElement;
    this.firstRowBtn = document.getElementById('first-row') as HTMLButtonElement;
    this.lastRowBtn = document.getElementById('last-row') as HTMLButtonElement;
    this.prevRowBtn = document.getElementById('prev-row') as HTMLButtonElement;
    this.nextRowBtn = document.getElementById('next-row') as HTMLButtonElement;
    this.chartTypeSelect = document.getElementById('chart-type') as HTMLSelectElement;
    this.openKeyConfigBtn = document.getElementById('open-key-config') as HTMLButtonElement;
    this.modal = document.getElementById('key-config-modal') as HTMLElement;
    this.keysTbody = document.getElementById('keys-tbody') as HTMLTableSectionElement;

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
    this.toggleRefreshBtn.addEventListener('click', this.handleToggleRefresh.bind(this));
    this.chartTypeSelect.addEventListener('change', () => {
      this.chartType = this.chartTypeSelect.value;
      this.drawChart();
    });
    this.firstRowBtn.addEventListener('click', () => this.goToRow(0));
    this.lastRowBtn.addEventListener('click', () => this.goToRow(this.data.length - 1));
    this.prevRowBtn.addEventListener('click', () => this.goToRow(this.currentRow - 1));
    this.nextRowBtn.addEventListener('click', () => this.goToRow(this.currentRow + 1));
    this.rowInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.goToRow(parseInt(target.value) || 0);
    });
    window.addEventListener('resize', () => this.drawChart());

    this.initKeyConfigModal();
  }

  private initKeyConfigModal(): void {
    const closeBtn = document.getElementById('close-modal') as HTMLButtonElement;
    const cancelBtn = document.getElementById('cancel-keys') as HTMLButtonElement;
    const applyBtn = document.getElementById('apply-keys') as HTMLButtonElement;
    const addRowBtn = document.getElementById('add-key-row') as HTMLButtonElement;

    this.openKeyConfigBtn.addEventListener('click', () => {
      if (this.chartType === 'scatter') {
        this.pendingKeys = this.chartDataKeys.scatter;
      } else {
        this.pendingKeys = this.chartDataKeys.line;
      }
      this.renderKeyTable();
      this.modal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => this.closeModal());
    cancelBtn.addEventListener('click', () => this.closeModal());
    applyBtn.addEventListener('click', () => this.applyKeys());
    addRowBtn.addEventListener('click', () => {
      this.pendingKeys.push({ xKey: '', yKey: '' });
      this.renderKeyTable();
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  private closeModal(): void {
    this.modal.classList.remove('active');
  }

  private renderKeyTable(): void {
    this.keysTbody.innerHTML = '';
    this.pendingKeys.forEach((row, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" value="${row.xKey}" data-index="${index}" data-field="xKey" placeholder="X Key"></td>
        <td><input type="text" value="${row.yKey}" data-index="${index}" data-field="yKey" placeholder="Y Key"></td>
        <td><button class="delete-btn" data-index="${index}">&times;</button></td>
      `;
      this.keysTbody.appendChild(tr);
    });

    this.keysTbody.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const index = parseInt(target.dataset.index!);
        const field = target.dataset.field as 'xKey' | 'yKey';
        this.pendingKeys[index][field] = target.value;
      });
    });

    this.keysTbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const index = parseInt(target.dataset.index!);
        if (this.pendingKeys.length > 1) {
          this.pendingKeys.splice(index, 1);
          this.renderKeyTable();
        }
      });
    });
  }

  private applyKeys(): void {
    const firstRow = this.pendingKeys[0];
    console.log(this.pendingKeys);
    if (this.chartType === 'scatter') {
      this.chartDataKeys.scatter = this.pendingKeys;
    } else {
      this.chartDataKeys.line = this.pendingKeys;
    }


    this.closeModal();
    this.updateChartData();
    this.drawChart();
  }

  private goToRow(row: number): void {
    if (this.data.length === 0) return;
    const validRow = Math.max(0, Math.min(row, this.data.length - 1));
    this.currentRow = validRow;
    this.rowInput.value = validRow.toString();
    this.jsonViewer.setRow(validRow);
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
        if (this.currentRow >= this.data.length) {
          this.currentRow = 0;
        }
        this.rowInput.value = this.currentRow.toString();
        this.totalRowsEl.textContent = `/ ${this.data.length - 1}`;
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
    for (const plotType of ["scatter", "line"]) {
      let chartData: ChartData = this.chartData[plotType as "scatter" | "line"] ;
      const keys = this.chartDataKeys[plotType as "scatter" | "line"];

      for (const rowIdx of this.data.keys()) {
        const row=this.data[rowIdx];
        for (const key of keys) {
          const xVal = this.getNestedValue(row, key.xKey);
          const yVal = this.getNestedValue(row, key.yKey);
          const traceKey = key.xKey +"|"+ key.yKey;
          if (!(traceKey in chartData)||rowIdx===0) {
            chartData[traceKey] = { x: [], y: [] };
          }
          chartData[traceKey].x.push(typeof xVal === 'number' ? xVal : NaN);
          chartData[traceKey].y.push(typeof yVal === 'number' ? yVal : NaN);
        }
      }
    }
  }

  private drawChart(): void {
    if (Object.keys(this.chartData).length === 0) {
      this.chartDiv.innerHTML = '<div class="loading">No data to display</div>';
      return;
    }

    if (this.chartType === 'scatter') {
      const yKey = 'y'; const xKey = 'x';
      const renderScatter = createScatterChart();
      renderScatter(this.chartDiv, this.chartData.scatter, xKey, yKey);
    } else {
      const yKey = 'y'; const xKey = 't';
      const lineChartRenderer = createLineChart(xKey);
      lineChartRenderer.render(this.chartDiv, this.chartData.line);
    }
  }
}

new JsonlAnalyser();
