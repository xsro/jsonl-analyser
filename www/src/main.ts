// filepath: src/main.ts

interface JsonData {
  [key: string]: unknown;
}

interface ChartData {
  x: number[];
  y: { [key: string]: number[] };
}

class JsonlAnalyser {
  private filePath: string = '';
  private data: JsonData[] = [];
  private currentRow: number = 0;
  private updateInterval: number | null = null;
  private chartData: ChartData = { x: [], y: {} };
  private xKey: string = 't';
  private yKeys: string[] = ['state.debug.p1[1]'];

  private fileInput: HTMLInputElement;
  private rowInput: HTMLInputElement;
  private filePathEl: HTMLElement;
  private totalRowsEl: HTMLElement;
  private jsonViewerEl: HTMLElement;
  private xKeyInput: HTMLInputElement;
  private yKeysInput: HTMLInputElement;
  private updateChartBtn: HTMLButtonElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.rowInput = document.getElementById('row-input') as HTMLInputElement;
    this.filePathEl = document.getElementById('file-path') as HTMLElement;
    this.totalRowsEl = document.getElementById('total-rows') as HTMLElement;
    this.jsonViewerEl = document.getElementById('json-viewer') as HTMLElement;
    this.xKeyInput = document.getElementById('x-key') as HTMLInputElement;
    this.yKeysInput = document.getElementById('y-keys') as HTMLInputElement;
    this.updateChartBtn = document.getElementById('update-chart') as HTMLButtonElement;
    this.canvas = document.getElementById('chart-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    this.init();
  }

  private init(): void {
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    this.rowInput.addEventListener('change', this.handleRowChange.bind(this));
    this.updateChartBtn.addEventListener('click', this.handleUpdateChart.bind(this));
    window.addEventListener('resize', this.drawChart.bind(this));

    this.xKeyInput.value = this.xKey;
    this.yKeysInput.value = this.yKeys.join(', ');

    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    const container = this.canvas.parentElement as HTMLElement;
    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  private handleFileSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.filePath = file.name;
    this.filePathEl.textContent = file.name;
    this.readFile(file);
  }

  private async readFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      this.data = text
        .trim()
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      this.totalRowsEl.textContent = `/ ${this.data.length - 1}`;
      this.rowInput.max = String(this.data.length - 1);

      if (this.data.length > 0) {
        this.renderJson(this.data[this.currentRow]);
        this.updateChartData();
        this.drawChart();
      }

      this.startAutoRefresh(file);
    } catch (error) {
      this.jsonViewerEl.innerHTML = `<div class="error">Error parsing file: ${error}</div>`;
    }
  }

  private startAutoRefresh(file: File): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = window.setInterval(() => {
      this.readFile(file);
    }, 10000);
  }

  private handleRowChange(): void {
    const row = parseInt(this.rowInput.value, 10);
    if (row >= 0 && row < this.data.length) {
      this.currentRow = row;
      this.renderJson(this.data[this.currentRow]);
    }
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

  private isMatrixArray(arr: unknown): boolean {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    if (!Array.isArray(arr[0])) return false;
    const firstRowLen = (arr[0] as unknown[]).length;
    return (arr as unknown[]).every(item => 
      Array.isArray(item) && (item as unknown[]).length === firstRowLen
    );
  }

  private renderJson(data: unknown, indent: number = 0): void {
    this.jsonViewerEl.innerHTML = this.createJsonHtml(data, 0, true);
    this.attachToggleListeners();
  }

  private createJsonHtml(data: unknown, indent: number, isRoot: boolean = false): string {
    const spaces = '  '.repeat(indent);

    if (data === null) {
      return `<span class="json-null">null</span>`;
    }

    if (typeof data === 'boolean') {
      return `<span class="json-boolean">${data}</span>`;
    }

    if (typeof data === 'number') {
      return `<span class="json-number">${data}</span>`;
    }

    if (typeof data === 'string') {
      return `<span class="json-string">"${this.escapeHtml(data)}"</span>`;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '[]';
      }

      const isMatrix = this.isMatrixArray(data);
      const displayCount = isMatrix ? 2 : 3;
      const isCollapsed = isMatrix;

      let html = `<span class="json-toggle ${isCollapsed ? 'collapsed' : 'expanded'}" data-collapsed="${isCollapsed}">[</span>`;
      html += `<span class="json-array">`;

      if (isMatrix) {
        html += `<div class="json-content" style="display: ${isCollapsed ? 'none' : 'block'}">`;
      }

      const itemsToShow = data.slice(0, displayCount);
      itemsToShow.forEach((item, index) => {
        html += `<div class="json-item">${spaces}  ${this.createJsonHtml(item, indent + 1)}</div>`;
      });

      if (data.length > displayCount) {
        const moreCount = data.length - displayCount;
        html += `<div class="json-item">${spaces}  ... ${moreCount} more items</div>`;
      }

      if (isMatrix) {
        html += `</div>`;
      }

      html += `${spaces}]</span>`;
      return html;
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data as JsonData);
      if (keys.length === 0) {
        return '{}';
      }

      let html = `<span class="json-toggle expanded" data-collapsed="false">{</span>`;
      html += `<span class="json-object">`;

      keys.forEach((key, index) => {
        const value = (data as JsonData)[key];
        const isMatrixArray = Array.isArray(value) && this.isMatrixArray(value);
        const displayValue = isMatrixArray ? this.createJsonHtml(value, indent + 1) : this.createJsonHtml(value, indent + 1);
        
        html += `<div class="json-item">${spaces}  <span class="json-key">"${this.escapeHtml(key)}"</span>: ${displayValue}</div>`;
      });

      html += `${spaces}}</span><span class="json-object">}</span>`;
      return html;
    }

    return String(data);
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private attachToggleListeners(): void {
    const toggles = this.jsonViewerEl.querySelectorAll('.json-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const isCollapsed = target.getAttribute('data-collapsed') === 'true';
        target.setAttribute('data-collapsed', String(!isCollapsed));
        target.classList.toggle('collapsed');
        target.classList.toggle('expanded');

        const content = target.nextElementSibling?.querySelector('.json-content') as HTMLElement;
        if (content) {
          content.style.display = isCollapsed ? 'block' : 'none';
        }
      });
    });
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
    this.resizeCanvas();
    const ctx = this.ctx;
    const canvas = this.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };

    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);

    if (this.chartData.x.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No data to display', width / 2, height / 2);
      return;
    }

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

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

    const xScale = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
    const yScale = (y: number) => padding.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const x = padding.left + (chartWidth / 4) * i;
      const val = xMin + ((xMax - xMin) / 4) * i;
      ctx.fillText(val.toFixed(2), x, height - 10);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      const val = yMax - ((yMax - yMin) / 4) * i;
      ctx.fillText(val.toFixed(2), padding.left - 5, y + 4);
    }

    const colors = ['#4ec9b0', '#ce9178', '#569cd6', '#dcdcaa', '#c586c0'];
    this.yKeys.forEach((yKey, keyIndex) => {
      const color = colors[keyIndex % colors.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const values = this.chartData.y[yKey];
      let started = false;

      for (let i = 0; i < this.chartData.x.length; i++) {
        const yVal = values[i];
        if (!isNaN(yVal)) {
          const x = xScale(this.chartData.x[i]);
          const y = yScale(yVal);

          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }

      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(yKey, width - padding.right - 100, padding.top + 20 + keyIndex * 20);
    });

    ctx.fillStyle = '#ccc';
    ctx.textAlign = 'center';
    ctx.fillText(this.xKey, width / 2, height - 5);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Value', 0, 0);
    ctx.restore();
  }
}

new JsonlAnalyser();