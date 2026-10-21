import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SummaryEntry {
  key: string;
  label: string;
  value: any;
  isObject: boolean;
  isArray: boolean;
  isPrimitive: boolean;
  itemCount: number;
}

@Component({
  selector: 'lib-batch-summary-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batch-summary-tree.component.html',
  styleUrl: './batch-summary-tree.component.css'
})
export class BatchSummaryTreeComponent implements OnChanges {
  @Input()
  summary: any;

  @Input()
  depth = 0;

  parsedData: any = null;
  scalarEntries: SummaryEntry[] = [];
  complexEntries: SummaryEntry[] = [];
  arrayItems: any[] = [];
  isRawString = false;
  rawStringValue = '';

  expandedPaths = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['summary']) {
      this.parseSummary();
    }
  }

  parseSummary() {
    this.parsedData = null;
    this.scalarEntries = [];
    this.complexEntries = [];
    this.arrayItems = [];
    this.isRawString = false;
    this.rawStringValue = '';
    this.expandedPaths.clear();

    if (this.summary === null || this.summary === undefined || this.summary === '') {
      return;
    }

    let data = this.summary;
    if (typeof data === 'string') {
      const trimmed = data.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          data = JSON.parse(trimmed);
        } catch {
          this.isRawString = true;
          this.rawStringValue = this.summary;
          return;
        }
      } else {
        this.isRawString = true;
        this.rawStringValue = this.summary;
        return;
      }
    }

    this.parsedData = data;

    if (Array.isArray(data)) {
      this.arrayItems = data;
      return;
    }

    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      for (const k of keys) {
        const val = data[k];
        const isArr = Array.isArray(val);
        const isObj = typeof val === 'object' && val !== null && !isArr;
        const isPrim = !isArr && !isObj;

        let count = 0;
        if (isArr) {
          count = val.length;
        } else if (isObj) {
          count = Object.keys(val).length;
        }

        const entry: SummaryEntry = {
          key: k,
          label: this.toSentenceCase(k),
          value: val,
          isObject: isObj,
          isArray: isArr,
          isPrimitive: isPrim,
          itemCount: count
        };

        if (isPrim) {
          this.scalarEntries.push(entry);
        } else {
          this.complexEntries.push(entry);
        }
      }
      return;
    }

    this.isRawString = true;
    this.rawStringValue = String(data);
  }

  toggle(key: string) {
    if (this.expandedPaths.has(key)) {
      this.expandedPaths.delete(key);
    } else {
      this.expandedPaths.add(key);
    }
  }

  isExpanded(key: string): boolean {
    return this.expandedPaths.has(key);
  }

  expandAll() {
    this.complexEntries.forEach(e => {
      if (e.itemCount > 0) this.expandedPaths.add(e.key);
    });
    this.arrayItems.forEach((item, idx) => {
      if (!this.isPrimitive(item)) this.expandedPaths.add('item_' + idx);
    });
  }

  collapseAll() {
    this.expandedPaths.clear();
  }

  toSentenceCase(str: string): string {
    if (!str) return '';
    const acronyms = new Set(['GIS', 'DOC', 'ID', 'URL', 'SRS', 'NZTM', 'API', 'GPS', 'UUID', 'MS']);

    const words = str
      .replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim()
      .split(/\s+/);

    return words
      .map((word, idx) => {
        const upper = word.toUpperCase();
        if (acronyms.has(upper) || (word.length > 1 && word === word.toUpperCase())) {
          return upper;
        }
        if (idx === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        return word.toLowerCase();
      })
      .join(' ');
  }

  formatValue(val: any, key?: string): string {
    if (val === null || val === undefined) return '—';

    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }

    // Check if ISO UTC timestamp
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/i.test(val)) {
        return this.formatLocalDate(val);
      }
      if (key && /(?:at|time|date|timestamp)$/i.test(key) && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/i.test(val)) {
        const utcStr = val.replace(' ', 'T') + (val.endsWith('Z') ? '' : 'Z');
        return this.formatLocalDate(utcStr);
      }
    }

    // Check if epoch ms timestamp in a date/time field
    if (typeof val === 'number' && key && /(?:at|time|date)$/i.test(key) && val > 1000000000000 && val < 4000000000000) {
      return this.formatLocalDate(val);
    }

    // Format numbers
    if (typeof val === 'number') {
      if (key && /(?:durationms|duration_ms)$/i.test(key)) {
        return `${val.toLocaleString()} ms (${this.formatDuration(val)})`;
      }
      return val.toLocaleString();
    }

    return String(val);
  }

  formatLocalDate(dateOrStr: string | number | Date): string {
    const d = new Date(dateOrStr);
    if (isNaN(d.getTime())) return String(dateOrStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  formatDuration(durationInMs: number): string {
    if (durationInMs < 1000) {
      return `${durationInMs}ms`;
    }
    const totalSeconds = Math.round(durationInMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  }

  isObject(val: any): boolean {
    return typeof val === 'object' && val !== null && !Array.isArray(val);
  }

  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  isPrimitive(val: any): boolean {
    return !this.isObject(val) && !this.isArray(val);
  }

  hasContent(): boolean {
    return this.isRawString ||
      this.scalarEntries.length > 0 ||
      this.complexEntries.length > 0 ||
      this.arrayItems.length > 0;
  }
}
