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
  }

  public setData(data: unknown[]): void {
    this.data = data;
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

  private render(): void {
    if (this.data.length === 0) {
      this.container.innerHTML = '<div class="loading">No data to display</div>';
      return;
    }

    const data = this.data[this.currentRow];
    this.container.innerHTML = this.createJsonHtml(data, 0);
    this.attachToggleListeners();
  }

  private createJsonHtml(data: unknown, indent: number): string {
    const spaces = '&nbsp;'.repeat(indent * 2);

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
      const isLong = data.length > 100;
      const displayValue = isLong ? data.substring(0, 100) + '...' : data;
      return `<span class="json-string">"${this.escapeHtml(displayValue)}"</span>${isLong ? ' <span class="json-expand">(click to expand)</span>' : ''}`;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '<span class="json-bracket">[]</span>';
      }

      const isMatrix = this.isMatrixArray(data);
      const isVector = this.isVectorArray(data);
      
      if (isMatrix) {
        return this.renderMatrix(data as unknown[][]);
      }

      if (isVector) {
        return this.renderVector(data as number[]);
      }

      return this.renderArray(data, indent);
    }

    if (typeof data === 'object') {
      return this.renderObject(data as Record<string, unknown>, indent);
    }

    return String(data);
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

  private isVectorArray(arr: unknown): boolean {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    // Check if all elements are numbers (1D array)
    return arr.every(item => typeof item === 'number');
  }

  private renderVector(data: number[]): string {
    const displayCount = 5;
    const isCollapsed = data.length > displayCount;
    
    let html = `<div class="json-vector-container">`;
    html += `<span class="json-bracket">[</span>`;
    html += `<span class="json-vector-content" style="display: ${isCollapsed ? 'none' : 'inline'}">`;
    
    const itemsToShow = data.slice(0, displayCount);
    html += itemsToShow.map((val, i) => 
      `<span class="json-number">${this.formatNumber(val)}</span>${i < itemsToShow.length - 1 ? ', ' : ''}`
    ).join('');
    
    html += `</span>`;
    
    if (isCollapsed) {
      html += `<span class="json-vector-summary">${data.length} elements</span>`;
    }
    
    html += `<span class="json-bracket">]</span>`;
    html += `<span class="json-toggle-btn" data-expanded="${!isCollapsed}">${isCollapsed ? '▼ expand' : '▲ collapse'}</span>`;
    html += `</div>`;
    
    return html;
  }

  private renderMatrix(data: unknown[][]): string {
    const rows = data.length;
    const cols = data[0].length;
    
    let html = `<div class="json-matrix-container">`;
    html += `<div class="json-matrix-header">Matrix [${rows}×${cols}] <span class="json-toggle-btn" data-expanded="false">▼ expand</span></div>`;
    html += `<div class="json-matrix-content" style="display: none">`;
    
    // Render as table
    html += '<table class="json-matrix-table">';
    
    // Header row
    html += '<thead><tr><th></th>';
    for (let j = 0; j < cols; j++) {
      html += `<th>${j}</th>`;
    }
    html += '</tr></thead>';
    
    // Data rows
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
    html += '</tbody></table>';
    
    html += '</div></div>';
    return html;
  }

  private formatNumber(n: number): string {
    if (Number.isInteger(n)) {
      return n.toString();
    }
    return n.toFixed(4);
  }

  private renderArray(data: unknown[], indent: number): string {
    const displayCount = Math.min(data.length, 5);
    let html = `<span class="json-bracket">[</span>`;
    html += `<span class="json-array-content">`;
    
    for (let i = 0; i < displayCount; i++) {
      html += `<div class="json-item">${this.createJsonHtml(data[i], indent + 1)}</div>`;
    }
    
    if (data.length > displayCount) {
      html += `<div class="json-item json-more">... +${data.length - displayCount} more items</div>`;
    }
    
    html += `</span><span class="json-bracket">]</span>`;
    return html;
  }

  private renderObject(obj: Record<string, unknown>, indent: number): string {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '<span class="json-bracket">{}</span>';
    }

    let html = `<span class="json-bracket">{</span>`;
    html += `<span class="json-object-content">`;
    
    const displayCount = Math.min(keys.length, 10);
    for (let i = 0; i < displayCount; i++) {
      const key = keys[i];
      const value = obj[key];
      const valueHtml = this.createJsonHtml(value, indent + 1);
      html += `<div class="json-item"><span class="json-key">"${this.escapeHtml(key)}"</span>: ${valueHtml}</div>`;
    }
    
    if (keys.length > displayCount) {
      html += `<div class="json-item json-more">... +${keys.length - displayCount} more keys</div>`;
    }
    
    html += `</span><span class="json-bracket">}</span>`;
    return html;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private attachToggleListeners(): void {
    // Matrix toggle
    const matrixToggles = this.container.querySelectorAll('.json-matrix-header .json-toggle-btn');
    matrixToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const isExpanded = target.getAttribute('data-expanded') === 'true';
        target.setAttribute('data-expanded', String(!isExpanded));
        target.textContent = isExpanded ? '▼ expand' : '▲ collapse';
        
        const content = target.parentElement?.nextElementSibling as HTMLElement;
        if (content) {
          content.style.display = isExpanded ? 'none' : 'block';
        }
      });
    });

    // Vector toggle
    const vectorToggles = this.container.querySelectorAll('.json-vector-container .json-toggle-btn');
    vectorToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const isExpanded = target.getAttribute('data-expanded') === 'true';
        target.setAttribute('data-expanded', String(!isExpanded));
        target.textContent = isExpanded ? '▼ expand' : '▲ collapse';
        
        const container = target.parentElement as HTMLElement;
        const content = container.querySelector('.json-vector-content') as HTMLElement;
        const summary = container.querySelector('.json-vector-summary') as HTMLElement;
        
        if (content && summary) {
          content.style.display = isExpanded ? 'none' : 'inline';
          summary.style.display = isExpanded ? 'inline' : 'none';
        }
      });
    });

    // Expandable strings
    const expandBtns = this.container.querySelectorAll('.json-expand');
    expandBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const stringSpan = target.previousElementSibling as HTMLElement;
        if (stringSpan) {
          const fullText = stringSpan.getAttribute('data-full') || stringSpan.textContent || '';
          stringSpan.textContent = fullText;
          target.style.display = 'none';
        }
      });
    });
  }
}