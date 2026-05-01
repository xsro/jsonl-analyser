// filepath: src/jsonViewer.ts

export interface JsonViewerOptions {
  container: HTMLElement;
  onRowChange?: (row: number) => void;
}

export class JsonViewer {
  private container: HTMLElement;
  private data: unknown[] = [];
  private currentRow: number = 0;
  private onRowChange?: (row: number) => void;
  private collapsedKeys: Set<string> = new Set();
  private clickCount=0;

  private rowInput: HTMLInputElement;
  private totalRowsEl: HTMLElement;

  constructor(options: JsonViewerOptions) {
    this.container = options.container;
    this.onRowChange = options.onRowChange;

    this.rowInput = document.getElementById('row-input') as HTMLInputElement;
    this.totalRowsEl = document.getElementById('total-rows') as HTMLElement;

    this.init();
  }

  private init(): void {
    this.rowInput.addEventListener('change', this.handleRowChange.bind(this));
    this.container.addEventListener('click', this.handleClick.bind(this));
  }

  public setData(data: unknown[]): void {
    this.data = data;
    this.collapsedKeys.clear();
    this.totalRowsEl.textContent = `/ ${this.data.length - 1}`;
    this.rowInput.max = String(this.data.length - 1);

    if (this.data.length > 0) {
      this.render();
    }
  }

  public setRow(row: number): void {
    if (row >= 0 && row < this.data.length) {
      this.currentRow = row;
      this.rowInput.value = String(row);
      this.render();
    }
  }

  private handleRowChange(): void {
    const row = parseInt(this.rowInput.value, 10);
    if (row >= 0 && row < this.data.length) {
      this.currentRow = row;
      this.render();
      this.onRowChange?.(row);
    }
  }

  private handleClick(e: MouseEvent): void {
    this.clickCount++;
    const target = e.target as HTMLElement;
    const keyEl = target.closest('.json-key');
    const toggleEl = target.closest('.json-toggle, .json-toggle-btn, .json-summary');

    if (keyEl) {
      const keyPath = keyEl.getAttribute('data-path');
      if (keyPath) {
        if (this.collapsedKeys.has(keyPath)) {
          this.collapsedKeys.delete(keyPath);
        } else {
          this.collapsedKeys.add(keyPath);
        }
        this.render();
      }
    } else if (toggleEl) {
      const togglePath = toggleEl.getAttribute('data-path');
      if (togglePath) {
        if (this.collapsedKeys.has(togglePath)) {
          this.collapsedKeys.delete(togglePath);
        } else {
          this.collapsedKeys.add(togglePath);
        }
        this.render();
      }
    }
  }

  private render(): void {
    if (this.data.length === 0) {
      this.container.innerHTML = '<div class="loading">No data to display</div>';
      return;
    }

    const data = this.data[this.currentRow];
    this.container.innerHTML = this.renderValue(data, '', 0);
  }

  private isMatrixArray(arr: unknown): boolean {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    if (!Array.isArray(arr[0])) return false;
    const firstRowLen = (arr[0] as unknown[]).length;
    if (firstRowLen === 0) return false;
    return (arr as unknown[]).every(item =>
      Array.isArray(item) && (item as unknown[]).length === firstRowLen
    );
  }

  private renderValue(value: unknown, path: string, indent: number): string {
    if (value === null) {
      return '<span class="json-null">null</span>';
    }

    if (typeof value === 'boolean') {
      return `<span class="json-boolean">${value}</span>`;
    }

    if (typeof value === 'number') {
      return `<span class="json-number">${this.formatNumber(value)}</span>`;
    }

    if (typeof value === 'string') {
      return `<span class="json-string">"${this.escapeHtml(value)}"</span>`;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '<span class="json-bracket">[]</span>';
      }

      if (!value.some(val=>typeof val!=="number")){
        return '<span>['+value.join(",")+']</span>';
      }

      if (this.isMatrixArray(value)) {
        return this.renderMatrix(value as unknown[][], path, indent);
      }

      return this.renderArray(value, path, indent);
    }

    if (typeof value === 'object') {
      return this.renderObject(value as Record<string, unknown>, path, indent);
    }

    return String(value);
  }

  private renderMatrix(data: unknown[][], path: string, indent: number): string {
    const rows = data.length;
    const cols = data[0].length;
    const togglePath = path || 'matrix';
    const isCollapsed = this.collapsedKeys.has(togglePath);

    let html = `<span class="json-matrix-container" data-path="${togglePath}">`;

    if (isCollapsed) {
      html += `<span class="json-toggle-btn" data-path="${togglePath}">[${rows}×${cols}] ▶</span>`;
    } else {
      html += `<span class="json-toggle-btn" data-path="${togglePath}">[${rows}×${cols}] ▼</span>`;
      html += `<span class="json-matrix-content">\n`;
      html += `<div class="json-matrix-table-wrapper"><table class="json-matrix-table">`;
      html += '<thead><tr><th></th>';
      for (let j = 0; j < cols; j++) {
        html += `<th>${j}</th>`;
      }
      html += '</tr></thead>';
      html += '<tbody>';
      for (let i = 0; i < rows; i++) {
        html += `<tr><td class="row-index">${i}</td>`;
        for (let j = 0; j < cols; j++) {
          const val = data[i][j];
          const valStr = typeof val === 'number' ? this.formatNumber(val) : this.escapeHtml(String(val));
          html += `<td>${valStr}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody></table></div>\n';
      html += `</span>`;
    }

    html += '</span>';
    return html;
  }

  private renderArray(data: unknown[], path: string, indent: number): string {
    const indentStr = '  '.repeat(indent);
    const childIndent = '  '.repeat(indent + 1);
    const togglePath = path || 'arr';
    const defaultCollapsed = data.length > 10;
    if ((path !== '' && defaultCollapsed) && this.clickCount===0){
      this.collapsedKeys.add(path);
    }
    const isCollapsed = this.collapsedKeys.has(togglePath);

    let html = `<span class="json-array-container" data-path="${togglePath}">`;

    if (isCollapsed) {
      html += `<span class="json-bracket">[</span>`;
      html += `<span class="json-summary">${data.length} items</span>`;
      html += `<span class="json-bracket">]</span>`;
      html += ` <span class="json-toggle" data-path="${togglePath}">▶</span>`;
    } else {
      html += `<span class="json-bracket">[</span>`;
      html += `<span class="json-array-content">\n`;

      for (let i = 0; i < data.length; i++) {
        html += `${childIndent}${this.renderValue(data[i], `${togglePath}[${i}]`, indent + 1)}`;
        if (i < data.length - 1) html += ',';
        html += '\n';
      }

      html += `${indentStr}</span><span class="json-bracket">]</span>`;
      html += ` <span class="json-toggle" data-path="${togglePath}">▼</span>`;
    }

    html += '</span>';
    return html;
  }

  private renderObject(obj: Record<string, unknown>, path: string, indent: number): string {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '<span class="json-bracket">{}</span>';
    }

    const indentStr = '  '.repeat(indent);
    const childIndent = '  '.repeat(indent + 1);
    const togglePath = path || 'obj';
    const defaultCollapsed = keys.length > 10;
    if (path !== '' && defaultCollapsed && this.clickCount===0){
      this.collapsedKeys.add(togglePath);
    }
    const isCollapsed = this.collapsedKeys.has(togglePath);

    let html = `<span class="json-object-container" data-path="${togglePath}">`;

    if (isCollapsed) {
      html += `<span class="json-bracket">{</span>`;
      html += `<span class="json-summary">${keys.length} keys</span>`;
      html += `<span class="json-bracket">}</span>`;
      html += ` <span class="json-toggle" data-path="${togglePath}">▶</span>`;
    } else {
      html += `<span class="json-bracket">{</span>`;
      html += `<span class="json-object-content">\n`;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const fullPath = `${togglePath}.${key}`;
        const value = obj[key];
        const isChildComplex = typeof value === 'object' && value !== null;

        html += `${childIndent}<span class="json-key" data-path="${fullPath}">"${this.escapeHtml(key)}"</span>: ${isChildComplex ? '' : ''}${this.renderValue(value, fullPath, indent + 1)}`;
        if (i < keys.length - 1) html += ',';
        html += '\n';
      }

      html += `${indentStr}</span><span class="json-bracket">}</span>`;
      html += ` <span class="json-toggle" data-path="${togglePath}">▼</span>`;
    }

    html += '</span>';
    return html;
  }

  private formatNumber(n: number): string {
    if (Number.isInteger(n)) {
      return n.toString();
    }
    return n.toFixed(4);
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
