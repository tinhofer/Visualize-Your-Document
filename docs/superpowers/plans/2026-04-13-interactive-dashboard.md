# Interactive Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a grid-based interactive dashboard editor to DocuViz AI where users can rearrange visualizations, add text notes, and share via URL.

**Architecture:** New DASHBOARD step (step 4) added after RESULTS. Uses `react-grid-layout` for drag/resize grid, `pako` for zlib compression of shareable URLs. Dashboard state (layout + text blocks + visual data) is serialized into a URL fragment for zero-backend sharing. A read-only shared view renders dashboards from URL fragments.

**Tech Stack:** React 19, TypeScript, react-grid-layout, pako, Vitest (new), Tailwind CSS, html-to-image (existing)

**Spec:** `docs/superpowers/specs/2026-04-13-interactive-dashboard-design.md`

**Worktree:** `.worktrees/feature/redesign` (branch: `feature/redesign`)

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `services/dashboardUtils.ts` | Serialize, compress, encode/decode dashboard state for URL sharing |
| `services/__tests__/dashboardUtils.test.ts` | Unit tests for encode/decode roundtrip |
| `components/TextBlock.tsx` | Editable text block with basic formatting (bold, italic, headings) |
| `components/DashboardGrid.tsx` | Wrapper around react-grid-layout with default layout generation |
| `components/DashboardToolbar.tsx` | Toolbar: Add Note, Reset, Share, Export, Back |
| `components/steps/DashboardStep.tsx` | Orchestrates grid + toolbar + state management |
| `components/SharedDashboardView.tsx` | Read-only presentation mode for shared URLs |
| `vitest.config.ts` | Vitest configuration |

### Modified Files
| File | Change |
|------|--------|
| `types.ts` | Add `DashboardLayoutItem`, `TextBlockData`, `DashboardState` interfaces |
| `constants.ts` | Add `DASHBOARD_DEFAULTS` (column count, default sizes, URL size limit) |
| `App.tsx` | Add `Steps.DASHBOARD = 4`, add dashboard step rendering, add URL fragment detection, add "Create Dashboard" button to results |
| `package.json` | Add `react-grid-layout`, `pako`, `vitest`, `@types/react-grid-layout`, `@types/pako` |

---

## Task 1: Install Dependencies and Test Runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install production dependencies**

```bash
cd .worktrees/feature/redesign
npm install react-grid-layout pako
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D vitest @types/react-grid-layout @types/pako jsdom
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 4: Add test scripts to package.json**

Add to `"scripts"`:

```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Verify setup**

```bash
npx vitest run --passWithNoTests
```

Expected: `No test files found, passing`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add react-grid-layout, pako, and vitest"
```

---

## Task 2: Add Dashboard Types

**Files:**
- Modify: `types.ts`
- Modify: `constants.ts`

- [ ] **Step 1: Add interfaces to types.ts**

Append after the `FileData` interface at the end of `types.ts`:

```typescript
// Dashboard layout item (matches react-grid-layout's Layout type)
export interface DashboardLayoutItem {
  i: string;   // unique ID — matches a visual key or text block ID
  x: number;   // grid column position (0-based)
  y: number;   // grid row position
  w: number;   // width in grid columns (out of 12)
  h: number;   // height in grid rows
  minW?: number;
  minH?: number;
}

// Text block for user annotations
export interface TextBlockData {
  id: string;
  content: string; // HTML string from contentEditable
}

// Complete dashboard state for serialization/sharing
export interface DashboardState {
  layout: DashboardLayoutItem[];
  textBlocks: TextBlockData[];
  visualData: GeneratedContent;
  config: AppConfig;
  metadata: {
    fileName: string;
    createdAt: string;
  };
}
```

- [ ] **Step 2: Add dashboard constants to constants.ts**

Append to `constants.ts`:

```typescript
// Dashboard grid configuration
export const DASHBOARD_COLS = 12;

// Default grid sizes per visual type (w = columns out of 12, h = grid rows)
export const DASHBOARD_DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  summary: { w: 12, h: 3 },
  highlightBoxes: { w: 12, h: 4 },
  chart: { w: 6, h: 5 },
  table: { w: 12, h: 5 },
  diagram: { w: 12, h: 6 },
  timeline: { w: 12, h: 5 },
  keywords: { w: 6, h: 6 },
  illustration: { w: 12, h: 6 },
  iconGrid: { w: 12, h: 4 },
  textBlock: { w: 12, h: 2 },
};

// URL sharing limits
export const MAX_SHARED_URL_BYTES = 20_000; // warn above this compressed size
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add types.ts constants.ts
git commit -m "feat: add dashboard types and grid constants"
```

---

## Task 3: Dashboard Serialization Utils (TDD)

**Files:**
- Create: `services/__tests__/dashboardUtils.test.ts`
- Create: `services/dashboardUtils.ts`

- [ ] **Step 1: Create test directory**

```bash
mkdir -p services/__tests__
```

- [ ] **Step 2: Write failing tests**

Create `services/__tests__/dashboardUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  encodeDashboardState,
  decodeDashboardState,
  generateDefaultLayout,
} from '../dashboardUtils';
import { DashboardState, VisualType, OutputFormat, Orientation } from '../../types';

const makeMockState = (): DashboardState => ({
  layout: [
    { i: 'summary', x: 0, y: 0, w: 12, h: 3 },
    { i: 'chart-0', x: 0, y: 3, w: 6, h: 5 },
  ],
  textBlocks: [
    { id: 'note-1', content: '<p>Test note</p>' },
  ],
  visualData: {
    summary: 'Test summary text',
    charts: [{
      type: 'bar',
      title: 'Test Chart',
      data: [{ name: 'A', value: 10 }],
      xAxisLabel: 'X',
      yAxisLabel: 'Y',
      description: 'A test chart',
    }],
    diagrams: [],
    keywords: [],
  },
  config: {
    outputFormat: OutputFormat.PNG,
    selectedVisuals: [VisualType.SUMMARY, VisualType.BAR_CHART],
    orientation: Orientation.PORTRAIT,
  },
  metadata: {
    fileName: 'test.pdf',
    createdAt: '2026-04-13T12:00:00Z',
  },
});

describe('encodeDashboardState / decodeDashboardState', () => {
  it('roundtrips a dashboard state through encode and decode', () => {
    const original = makeMockState();
    const encoded = encodeDashboardState(original);
    const decoded = decodeDashboardState(encoded);
    expect(decoded).toEqual(original);
  });

  it('returns a non-empty string from encode', () => {
    const encoded = encodeDashboardState(makeMockState());
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('throws on corrupted data', () => {
    expect(() => decodeDashboardState('not-valid-data!!!')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => decodeDashboardState('')).toThrow();
  });
});

describe('generateDefaultLayout', () => {
  it('places summary at full width when selected', () => {
    const config = {
      outputFormat: OutputFormat.PNG,
      selectedVisuals: [VisualType.SUMMARY],
      orientation: Orientation.PORTRAIT,
    };
    const data = {
      summary: 'hello',
      charts: [],
      diagrams: [],
      keywords: [],
    };
    const layout = generateDefaultLayout(data, config);
    const summaryItem = layout.find(item => item.i === 'summary');
    expect(summaryItem).toBeDefined();
    expect(summaryItem!.w).toBe(12);
  });

  it('places bar charts at half width', () => {
    const config = {
      outputFormat: OutputFormat.PNG,
      selectedVisuals: [VisualType.BAR_CHART],
      orientation: Orientation.PORTRAIT,
    };
    const data = {
      summary: undefined,
      charts: [{ type: 'bar' as const, title: 'T', data: [{ name: 'A', value: 1 }], xAxisLabel: 'X', yAxisLabel: 'Y', description: 'd' }],
      diagrams: [],
      keywords: [],
    };
    const layout = generateDefaultLayout(data, config);
    const chartItem = layout.find(item => item.i === 'chart-0');
    expect(chartItem).toBeDefined();
    expect(chartItem!.w).toBe(6);
  });

  it('returns empty array when nothing is selected', () => {
    const config = {
      outputFormat: OutputFormat.PNG,
      selectedVisuals: [],
      orientation: Orientation.PORTRAIT,
    };
    const data = { charts: [], diagrams: [], keywords: [] };
    const layout = generateDefaultLayout(data, config);
    expect(layout).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run services/__tests__/dashboardUtils.test.ts
```

Expected: FAIL — `Cannot find module '../dashboardUtils'`

- [ ] **Step 4: Implement dashboardUtils.ts**

Create `services/dashboardUtils.ts`:

```typescript
import pako from 'pako';
import {
  DashboardState,
  DashboardLayoutItem,
  GeneratedContent,
  AppConfig,
  VisualType,
} from '../types';
import { DASHBOARD_DEFAULT_SIZES, DASHBOARD_COLS } from '../constants';

/**
 * Encode a DashboardState into a URL-safe compressed string.
 * JSON → gzip → base64url
 */
export function encodeDashboardState(state: DashboardState): string {
  const json = JSON.stringify(state);
  const compressed = pako.deflate(json);
  // Convert Uint8Array to base64url string
  const binary = String.fromCharCode(...compressed);
  const base64 = btoa(binary);
  // Make URL-safe: replace +/ with -_, strip padding =
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a URL-safe compressed string back into a DashboardState.
 * base64url → gunzip → JSON
 */
export function decodeDashboardState(encoded: string): DashboardState {
  if (!encoded) {
    throw new Error('Empty dashboard data');
  }
  try {
    // Restore standard base64 from URL-safe encoding
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Re-add padding
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = pako.inflate(bytes, { to: 'string' });
    return JSON.parse(json) as DashboardState;
  } catch {
    throw new Error('Failed to decode dashboard data. The link may be corrupted or incomplete.');
  }
}

/**
 * Generate a default grid layout based on the generated content and user config.
 * Items are stacked vertically in a sensible order, using default widths per type.
 */
export function generateDefaultLayout(
  data: GeneratedContent,
  config: AppConfig,
): DashboardLayoutItem[] {
  const items: DashboardLayoutItem[] = [];
  let currentY = 0;

  const add = (id: string, sizeKey: string) => {
    const size = DASHBOARD_DEFAULT_SIZES[sizeKey];
    const x = size.w < DASHBOARD_COLS && items.length > 0
      ? (items[items.length - 1].x + items[items.length - 1].w) % DASHBOARD_COLS
      : 0;
    // If this item would overflow the row, move to next row
    const actualX = (x + size.w > DASHBOARD_COLS) ? 0 : x;
    if (actualX === 0 && items.length > 0) {
      // Find the max bottom edge of all items so far
      currentY = Math.max(...items.map(item => item.y + item.h));
    }
    items.push({
      i: id,
      x: actualX,
      y: currentY,
      w: size.w,
      h: size.h,
      minW: 6,
      minH: 2,
    });
  };

  const isSelected = (type: VisualType) => config.selectedVisuals.includes(type);

  // Summary
  if (data.summary && isSelected(VisualType.SUMMARY)) {
    add('summary', 'summary');
  }

  // Highlight boxes
  if (data.highlightBoxes && data.highlightBoxes.length > 0 && isSelected(VisualType.HIGHLIGHT_BOX)) {
    add('highlightBoxes', 'highlightBoxes');
  }

  // Charts
  data.charts.forEach((chart, idx) => {
    const type = chart.type === 'bar' ? VisualType.BAR_CHART : VisualType.LINE_GRAPH;
    if (isSelected(type)) {
      add(`chart-${idx}`, 'chart');
    }
  });

  // Tables
  if (data.tables) {
    data.tables.forEach((_, idx) => {
      if (isSelected(VisualType.TABLE)) {
        add(`table-${idx}`, 'table');
      }
    });
  }

  // Diagrams
  data.diagrams.forEach((_, idx) => {
    const wantsFlow = isSelected(VisualType.FLOWCHART);
    const wantsMind = isSelected(VisualType.MIND_MAP);
    if (wantsFlow || wantsMind) {
      add(`diagram-${idx}`, 'diagram');
    }
  });

  // Timelines
  if (data.timelines) {
    data.timelines.forEach((_, idx) => {
      if (isSelected(VisualType.TIMELINE)) {
        add(`timeline-${idx}`, 'timeline');
      }
    });
  }

  // Keywords
  if (data.keywords.length > 0 && isSelected(VisualType.DATA_VIS)) {
    add('keywords', 'keywords');
  }

  // Illustration
  if (data.illustration && isSelected(VisualType.ILLUSTRATION)) {
    add('illustration', 'illustration');
  }

  // Icon grids
  if (data.iconGrids) {
    data.iconGrids.forEach((_, idx) => {
      if (isSelected(VisualType.ICON_GRID)) {
        add(`iconGrid-${idx}`, 'iconGrid');
      }
    });
  }

  return items;
}

/**
 * Build a full shareable URL from the current origin and encoded state.
 */
export function buildShareUrl(encoded: string): string {
  return `${window.location.origin}${window.location.pathname}#dashboard=${encoded}`;
}

/**
 * Extract encoded dashboard data from the current URL hash, if present.
 * Returns null if no dashboard data in URL.
 */
export function getDashboardDataFromUrl(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#dashboard=')) return null;
  return hash.slice('#dashboard='.length);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run services/__tests__/dashboardUtils.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add services/dashboardUtils.ts services/__tests__/dashboardUtils.test.ts
git commit -m "feat: add dashboard serialization utils with tests"
```

---

## Task 4: TextBlock Component

**Files:**
- Create: `components/TextBlock.tsx`

- [ ] **Step 1: Create TextBlock.tsx**

```typescript
import React, { useRef, useCallback } from 'react';
import { GripVertical, Trash2, Bold, Italic, Heading3 } from 'lucide-react';

interface TextBlockProps {
  readonly id: string;
  readonly content: string;
  readonly readOnly?: boolean;
  readonly onChange: (id: string, content: string) => void;
  readonly onDelete: (id: string) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({ id, content, readOnly = false, onChange, onDelete }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(id, editorRef.current.innerHTML);
    }
  }, [id, onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  if (readOnly) {
    return (
      <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
        <div
          className="prose prose-sm prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    );
  }

  return (
    <div className="group relative border border-amber-200 rounded-xl bg-amber-50/30 hover:bg-amber-50/50 transition-colors">
      {/* Drag handle area */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-amber-200/50 bg-amber-50/50 rounded-t-xl">
        <div className="flex items-center gap-1 text-amber-600">
          <GripVertical size={14} className="cursor-grab" />
          <span className="text-xs font-medium">Note</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-1 rounded hover:bg-amber-200/50 text-amber-700"
            aria-label="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-1 rounded hover:bg-amber-200/50 text-amber-700"
            aria-label="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', 'h3')}
            className="p-1 rounded hover:bg-amber-200/50 text-amber-700"
            aria-label="Heading"
          >
            <Heading3 size={14} />
          </button>
          <div className="w-px h-4 bg-amber-300 mx-1" />
          <button
            type="button"
            onClick={() => onDelete(id)}
            className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600"
            aria-label="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Editable content */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="p-4 min-h-[60px] prose prose-sm prose-slate max-w-none focus:outline-none"
        dangerouslySetInnerHTML={{ __html: content }}
        role="textbox"
        aria-label="Note content"
        aria-multiline="true"
      />
    </div>
  );
};

export default TextBlock;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/TextBlock.tsx
git commit -m "feat: add TextBlock component with inline formatting"
```

---

## Task 5: DashboardGrid Component

**Files:**
- Create: `components/DashboardGrid.tsx`

This component wraps `react-grid-layout` and renders each visualization or text block as a grid item. It reuses the existing visualization components (SimpleChart, Mermaid, D3BubbleChart, etc.) from ResultsStep.

- [ ] **Step 1: Create DashboardGrid.tsx**

```typescript
import React from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

import {
  AppConfig,
  DashboardLayoutItem,
  GeneratedContent,
  TextBlockData,
  VisualType,
} from '../types';
import { DASHBOARD_COLS } from '../constants';

import { SimpleChart } from './Charts';
import Mermaid from './Mermaid';
import D3BubbleChart from './D3BubbleChart';
import TableVisualization from './TableVisualization';
import Timeline from './Timeline';
import { HighlightBoxList } from './HighlightBox';
import IconGrid from './IconGrid';
import TextBlock from './TextBlock';

interface DashboardGridProps {
  readonly layout: DashboardLayoutItem[];
  readonly data: GeneratedContent;
  readonly config: AppConfig;
  readonly textBlocks: TextBlockData[];
  readonly readOnly?: boolean;
  readonly width: number;
  readonly onLayoutChange: (layout: DashboardLayoutItem[]) => void;
  readonly onTextBlockChange: (id: string, content: string) => void;
  readonly onTextBlockDelete: (id: string) => void;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({
  layout,
  data,
  config,
  textBlocks,
  readOnly = false,
  width,
  onLayoutChange,
  onTextBlockChange,
  onTextBlockDelete,
}) => {
  const renderGridItem = (itemId: string): React.ReactNode => {
    // Text blocks
    const textBlock = textBlocks.find(tb => tb.id === itemId);
    if (textBlock) {
      return (
        <TextBlock
          id={textBlock.id}
          content={textBlock.content}
          readOnly={readOnly}
          onChange={onTextBlockChange}
          onDelete={onTextBlockDelete}
        />
      );
    }

    // Summary
    if (itemId === 'summary' && data.summary) {
      return (
        <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 h-full overflow-auto">
          <h3 className="font-semibold text-slate-800 mb-2">Zusammenfassung</h3>
          <p className="text-slate-700 leading-relaxed">{data.summary}</p>
        </div>
      );
    }

    // Highlight boxes
    if (itemId === 'highlightBoxes' && data.highlightBoxes) {
      return (
        <div className="h-full overflow-auto">
          <HighlightBoxList boxes={data.highlightBoxes} />
        </div>
      );
    }

    // Charts
    const chartMatch = itemId.match(/^chart-(\d+)$/);
    if (chartMatch) {
      const chart = data.charts[parseInt(chartMatch[1])];
      if (chart) {
        return (
          <div className="h-full w-full p-2">
            <h3 className="font-semibold text-slate-800 text-sm mb-1 truncate">{chart.title}</h3>
            <div className="h-[calc(100%-2rem)] w-full">
              <SimpleChart
                data={chart.data}
                type={chart.type}
                xAxisLabel={chart.xAxisLabel}
                yAxisLabel={chart.yAxisLabel}
              />
            </div>
          </div>
        );
      }
    }

    // Tables
    const tableMatch = itemId.match(/^table-(\d+)$/);
    if (tableMatch && data.tables) {
      const table = data.tables[parseInt(tableMatch[1])];
      if (table) {
        return (
          <div className="h-full overflow-auto p-2">
            <TableVisualization data={table} />
          </div>
        );
      }
    }

    // Diagrams
    const diagramMatch = itemId.match(/^diagram-(\d+)$/);
    if (diagramMatch) {
      const diagram = data.diagrams[parseInt(diagramMatch[1])];
      if (diagram) {
        return (
          <div className="h-full w-full flex justify-center overflow-auto">
            <Mermaid id={`dash-mermaid-${diagramMatch[1]}`} chart={diagram.code} />
          </div>
        );
      }
    }

    // Timelines
    const timelineMatch = itemId.match(/^timeline-(\d+)$/);
    if (timelineMatch && data.timelines) {
      const timeline = data.timelines[parseInt(timelineMatch[1])];
      if (timeline) {
        return (
          <div className="h-full overflow-auto">
            <Timeline data={timeline} />
          </div>
        );
      }
    }

    // Keywords
    if (itemId === 'keywords' && data.keywords.length > 0) {
      return (
        <div className="h-full w-full flex items-center justify-center">
          <D3BubbleChart data={data.keywords} />
        </div>
      );
    }

    // Illustration
    if (itemId === 'illustration' && data.illustration) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
          <img
            src={data.illustration}
            alt="KI-generierte Illustration"
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    // Icon grids
    const iconGridMatch = itemId.match(/^iconGrid-(\d+)$/);
    if (iconGridMatch && data.iconGrids) {
      const iconGrid = data.iconGrids[parseInt(iconGridMatch[1])];
      if (iconGrid) {
        return (
          <div className="h-full overflow-auto">
            <IconGrid data={iconGrid} />
          </div>
        );
      }
    }

    return <div className="p-4 text-slate-400 text-sm">Unknown item</div>;
  };

  const gridLayout = layout.map(item => ({
    ...item,
    static: readOnly,
  }));

  return (
    <GridLayout
      className="layout"
      layout={gridLayout}
      cols={DASHBOARD_COLS}
      rowHeight={60}
      width={width}
      isDraggable={!readOnly}
      isResizable={!readOnly}
      draggableHandle=".react-grid-draghandle"
      onLayoutChange={(newLayout) => {
        onLayoutChange(newLayout.map(item => ({
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          minW: item.minW,
          minH: item.minH,
        })));
      }}
    >
      {layout.map(item => (
        <div
          key={item.i}
          className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
        >
          {/* Drag handle */}
          {!readOnly && (
            <div className="react-grid-draghandle h-2 bg-slate-100 cursor-grab hover:bg-slate-200 transition-colors rounded-t-xl" />
          )}
          <div className="h-[calc(100%-0.5rem)] overflow-hidden">
            {renderGridItem(item.i)}
          </div>
        </div>
      ))}
    </GridLayout>
  );
};

export default DashboardGrid;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds. There may be a CSS import warning for `react-grid-layout/css/styles.css` — if so, copy the CSS content into a local file or add it to `index.css`.

- [ ] **Step 3: Commit**

```bash
git add components/DashboardGrid.tsx
git commit -m "feat: add DashboardGrid component with react-grid-layout"
```

---

## Task 6: DashboardToolbar Component

**Files:**
- Create: `components/DashboardToolbar.tsx`

- [ ] **Step 1: Create DashboardToolbar.tsx**

```typescript
import React, { useState } from 'react';
import { Plus, RotateCcw, Share2, Download, ArrowLeft, Check, AlertTriangle } from 'lucide-react';

interface DashboardToolbarProps {
  readonly onAddNote: () => void;
  readonly onResetLayout: () => void;
  readonly onShare: () => Promise<{ success: boolean; warning?: string }>;
  readonly onExport: () => void;
  readonly onBack: () => void;
}

const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
  onAddNote,
  onResetLayout,
  onShare,
  onExport,
  onBack,
}) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'warning'>('idle');
  const [shareWarning, setShareWarning] = useState<string>('');

  const handleShare = async () => {
    const result = await onShare();
    if (result.warning) {
      setShareStatus('warning');
      setShareWarning(result.warning);
      setTimeout(() => setShareStatus('idle'), 4000);
    } else if (result.success) {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  const btnBase = 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors';
  const btnSecondary = `${btnBase} bg-slate-100 text-slate-700 hover:bg-slate-200`;
  const btnPrimary = `${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm`;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm mb-6">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className={btnSecondary} aria-label="Zurück zu Ergebnissen">
          <ArrowLeft size={16} /> Zurück
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={onAddNote} className={btnSecondary}>
          <Plus size={16} /> Notiz
        </button>
        <button type="button" onClick={onResetLayout} className={btnSecondary}>
          <RotateCcw size={16} /> Zurücksetzen
        </button>
        <button type="button" onClick={onExport} className={btnSecondary}>
          <Download size={16} /> Export
        </button>
        <button type="button" onClick={handleShare} className={btnPrimary}>
          {shareStatus === 'copied' && <><Check size={16} /> Kopiert!</>}
          {shareStatus === 'warning' && <><AlertTriangle size={16} /> Zu groß</>}
          {shareStatus === 'idle' && <><Share2 size={16} /> Teilen</>}
        </button>
      </div>

      {shareStatus === 'warning' && shareWarning && (
        <div className="w-full text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
          {shareWarning}
        </div>
      )}
    </div>
  );
};

export default DashboardToolbar;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/DashboardToolbar.tsx
git commit -m "feat: add DashboardToolbar with share, export, and note actions"
```

---

## Task 7: DashboardStep Component

**Files:**
- Create: `components/steps/DashboardStep.tsx`

This is the main orchestrator — manages layout state, text blocks, and wires up toolbar actions.

- [ ] **Step 1: Create DashboardStep.tsx**

```typescript
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import {
  AppConfig,
  DashboardLayoutItem,
  DashboardState,
  GeneratedContent,
  TextBlockData,
} from '../../types';
import { MAX_SHARED_URL_BYTES } from '../../constants';
import {
  encodeDashboardState,
  generateDefaultLayout,
  buildShareUrl,
} from '../../services/dashboardUtils';
import DashboardGrid from '../DashboardGrid';
import DashboardToolbar from '../DashboardToolbar';

interface DashboardStepProps {
  readonly data: GeneratedContent;
  readonly config: AppConfig;
  readonly fileName: string;
  readonly onBack: () => void;
}

const DashboardStep: React.FC<DashboardStepProps> = ({
  data,
  config,
  fileName,
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [layout, setLayout] = useState<DashboardLayoutItem[]>(() =>
    generateDefaultLayout(data, config)
  );
  const [textBlocks, setTextBlocks] = useState<TextBlockData[]>([]);

  // Measure container width for react-grid-layout
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleLayoutChange = useCallback((newLayout: DashboardLayoutItem[]) => {
    setLayout(newLayout);
  }, []);

  const handleTextBlockChange = useCallback((id: string, content: string) => {
    setTextBlocks(prev => prev.map(tb =>
      tb.id === id ? { ...tb, content } : tb
    ));
  }, []);

  const handleTextBlockDelete = useCallback((id: string) => {
    setTextBlocks(prev => prev.filter(tb => tb.id !== id));
    setLayout(prev => prev.filter(item => item.i !== id));
  }, []);

  const handleAddNote = useCallback(() => {
    const id = `note-${Date.now()}`;
    setTextBlocks(prev => [...prev, { id, content: '<p>Neue Notiz...</p>' }]);
    // Add to layout at the bottom
    const maxY = layout.length > 0
      ? Math.max(...layout.map(item => item.y + item.h))
      : 0;
    setLayout(prev => [...prev, {
      i: id,
      x: 0,
      y: maxY,
      w: 12,
      h: 2,
      minW: 6,
      minH: 2,
    }]);
  }, [layout]);

  const handleResetLayout = useCallback(() => {
    setLayout(generateDefaultLayout(data, config));
    setTextBlocks([]);
  }, [data, config]);

  const handleShare = useCallback(async (): Promise<{ success: boolean; warning?: string }> => {
    const state: DashboardState = {
      layout,
      textBlocks,
      visualData: data,
      config,
      metadata: {
        fileName,
        createdAt: new Date().toISOString(),
      },
    };

    const encoded = encodeDashboardState(state);
    const byteLength = new TextEncoder().encode(encoded).length;

    if (byteLength > MAX_SHARED_URL_BYTES) {
      return {
        success: false,
        warning: `Dashboard ist zu groß zum Teilen per URL (${Math.round(byteLength / 1024)}KB). Bitte als Bild exportieren.`,
      };
    }

    const url = buildShareUrl(encoded);
    await navigator.clipboard.writeText(url);
    return { success: true };
  }, [layout, textBlocks, data, config, fileName]);

  const handleExport = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, { backgroundColor: '#f8fafc' });
      const link = document.createElement('a');
      link.download = `dashboard_${fileName.replace(/\.\w+$/, '')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Dashboard export failed:', err);
    }
  }, [fileName]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500">
          Ziehe Elemente per Drag & Drop, um dein Dashboard zu gestalten.
        </p>
      </div>

      <DashboardToolbar
        onAddNote={handleAddNote}
        onResetLayout={handleResetLayout}
        onShare={handleShare}
        onExport={handleExport}
        onBack={onBack}
      />

      <div ref={containerRef} className="min-h-[600px]">
        <DashboardGrid
          layout={layout}
          data={data}
          config={config}
          textBlocks={textBlocks}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
          onTextBlockChange={handleTextBlockChange}
          onTextBlockDelete={handleTextBlockDelete}
        />
      </div>
    </div>
  );
};

export default DashboardStep;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/steps/DashboardStep.tsx
git commit -m "feat: add DashboardStep orchestrator component"
```

---

## Task 8: SharedDashboardView (Read-Only)

**Files:**
- Create: `components/SharedDashboardView.tsx`

Renders a dashboard from decoded URL state in read-only presentation mode.

- [ ] **Step 1: Create SharedDashboardView.tsx**

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';
import { DashboardState } from '../types';
import DashboardGrid from './DashboardGrid';

interface SharedDashboardViewProps {
  readonly state: DashboardState;
  readonly onCreateOwn: () => void;
}

const SharedDashboardView: React.FC<SharedDashboardViewProps> = ({ state, onCreateOwn }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleExport = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, { backgroundColor: '#f8fafc' });
      const link = document.createElement('a');
      link.download = `dashboard_${state.metadata.fileName.replace(/\.\w+$/, '')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const noop = () => {};

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white" aria-hidden="true">
              <Sparkles size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">DocuViz AI</h1>
            <span className="text-sm text-slate-400 ml-2">— Geteiltes Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Download size={16} /> Export
            </button>
            <button
              type="button"
              onClick={onCreateOwn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <Sparkles size={16} /> Eigenes erstellen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-700">
            Dashboard: {state.metadata.fileName}
          </h2>
        </div>

        <div ref={containerRef}>
          <DashboardGrid
            layout={state.layout}
            data={state.visualData}
            config={state.config}
            textBlocks={state.textBlocks}
            readOnly
            width={containerWidth}
            onLayoutChange={noop}
            onTextBlockChange={noop}
            onTextBlockDelete={noop}
          />
        </div>
      </main>
    </div>
  );
};

export default SharedDashboardView;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/SharedDashboardView.tsx
git commit -m "feat: add SharedDashboardView for read-only dashboard URLs"
```

---

## Task 9: Wire Dashboard Into App.tsx

**Files:**
- Modify: `App.tsx`

This task adds the DASHBOARD step to the state machine, adds the "Create Dashboard" button to the results view, and adds URL fragment detection for shared dashboards.

- [ ] **Step 1: Add DASHBOARD to Steps and imports**

In `App.tsx`, change the Steps object from:

```typescript
const Steps = {
  UPLOAD: 0,
  CONFIG: 1,
  GENERATING: 2,
  RESULTS: 3
};
```

to:

```typescript
const Steps = {
  UPLOAD: 0,
  CONFIG: 1,
  GENERATING: 2,
  RESULTS: 3,
  DASHBOARD: 4,
  SHARED: 5,
};
```

Add to the imports at the top:

```typescript
import DashboardStep from './components/steps/DashboardStep';
import SharedDashboardView from './components/SharedDashboardView';
import { getDashboardDataFromUrl, decodeDashboardState } from './services/dashboardUtils';
import { DashboardState } from './types';
```

- [ ] **Step 2: Add shared dashboard state and URL detection**

After the existing `useState` declarations (around line 43), add:

```typescript
const [sharedDashboard, setSharedDashboard] = useState<DashboardState | null>(null);
```

Add a `useEffect` for URL detection. Add `useEffect` to the React import on line 1 if not already there. Place this after the state declarations:

```typescript
// Check for shared dashboard URL on mount
useEffect(() => {
  const encoded = getDashboardDataFromUrl();
  if (encoded) {
    try {
      const state = decodeDashboardState(encoded);
      setSharedDashboard(state);
      setStep(Steps.SHARED);
    } catch (err) {
      console.error('Failed to load shared dashboard:', err);
    }
  }
}, []);
```

- [ ] **Step 3: Add "Create Dashboard" button to renderResults()**

In `App.tsx`, find the "Start Over" button inside `renderResults()` (around line 344-349). Replace the button container `<div>` with:

```typescript
<div className="flex items-center gap-3">
  <button
    onClick={() => setStep(Steps.DASHBOARD)}
    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
    aria-label="Dashboard erstellen"
  >
    Dashboard erstellen
  </button>
  <button
    onClick={reset}
    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
    aria-label="Start over and upload a new document"
  >
    Start Over
  </button>
</div>
```

- [ ] **Step 4: Add DASHBOARD step nav indicator**

In the `<nav>` element (around line 449-456), add the Dashboard step to the breadcrumb:

```typescript
<nav aria-label="Progress">
  <ol className="flex gap-4 text-sm font-medium text-slate-500">
    <li className={step === Steps.UPLOAD ? "text-indigo-600" : ""} aria-current={step === Steps.UPLOAD ? "step" : undefined}>Upload</li>
    <li aria-hidden="true">&rarr;</li>
    <li className={step === Steps.CONFIG ? "text-indigo-600" : ""} aria-current={step === Steps.CONFIG ? "step" : undefined}>Configure</li>
    <li aria-hidden="true">&rarr;</li>
    <li className={step === Steps.RESULTS ? "text-indigo-600" : ""} aria-current={step === Steps.RESULTS ? "step" : undefined}>Visuals</li>
    <li aria-hidden="true">&rarr;</li>
    <li className={step === Steps.DASHBOARD ? "text-indigo-600" : ""} aria-current={step === Steps.DASHBOARD ? "step" : undefined}>Dashboard</li>
  </ol>
</nav>
```

- [ ] **Step 5: Add DASHBOARD and SHARED rendering in main**

After the `{step === Steps.RESULTS && renderResults()}` line (around line 465), add:

```typescript
{step === Steps.DASHBOARD && results && file && (
  <DashboardStep
    data={results}
    config={config}
    fileName={file.name}
    onBack={() => setStep(Steps.RESULTS)}
  />
)}
```

For the shared view, it replaces the entire page. Wrap the existing return JSX: at the top of the `return` in the `App` component, add an early return:

```typescript
if (step === Steps.SHARED && sharedDashboard) {
  return (
    <SharedDashboardView
      state={sharedDashboard}
      onCreateOwn={() => {
        setSharedDashboard(null);
        // Clear hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        reset();
      }}
    />
  );
}
```

Place this **before** the main `return (...)` in the component.

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 7: Run tests**

```bash
npx vitest run
```

Expected: All dashboard utils tests pass.

- [ ] **Step 8: Commit**

```bash
git add App.tsx
git commit -m "feat: wire dashboard step into App state machine with URL sharing"
```

---

## Task 10: react-grid-layout CSS and Manual Verification

**Files:**
- May need to modify: `index.css` (if CSS import fails in build)

- [ ] **Step 1: Check if react-grid-layout CSS is bundled**

If the build from Task 9 warned about CSS, copy the essential styles. Check:

```bash
npm run build 2>&1 | grep -i css
```

If there's a CSS warning, add to `index.css`:

```css
/* react-grid-layout */
.react-grid-layout { position: relative; }
.react-grid-item { transition: all 200ms ease; transition-property: left, top; }
.react-grid-item.cssTransforms { transition-property: transform; }
.react-grid-item.react-draggable-dragging { transition: none; z-index: 3; will-change: transform; }
.react-grid-item.dropping { visibility: hidden; }
.react-grid-item > .react-resizable-handle { position: absolute; width: 20px; height: 20px; }
.react-grid-item > .react-resizable-handle::after { content: ""; position: absolute; right: 3px; bottom: 3px; width: 5px; height: 5px; border-right: 2px solid rgba(0,0,0,0.4); border-bottom: 2px solid rgba(0,0,0,0.4); }
.react-grid-item > .react-resizable-handle.react-resizable-handle-se { bottom: 0; right: 0; cursor: se-resize; }
```

- [ ] **Step 2: Start dev server and test manually**

```bash
npm run dev
```

Then test the full flow in a browser:

1. Upload a document (PDF/TXT)
2. Select visual types, click Generate
3. On Results page, verify "Dashboard erstellen" button appears
4. Click it — verify the grid layout loads with all generated visuals
5. Drag a visualization to rearrange — verify snap-to-grid
6. Resize a chart — verify it snaps to 6 or 12 columns
7. Click "Notiz" — verify text block appears
8. Type in the text block, use Bold/Italic buttons
9. Delete a text block with the trash icon
10. Click "Zurücksetzen" — verify layout resets
11. Click "Teilen" — verify URL copied to clipboard
12. Open the copied URL in a new tab — verify read-only view renders
13. Click "Export" — verify PNG downloads
14. Click "Zurück" — verify return to Results page

- [ ] **Step 3: Commit any CSS fixes**

```bash
git add -A
git commit -m "fix: add react-grid-layout CSS for drag/resize styling"
```

(Only if CSS fixes were needed in Step 1.)

- [ ] **Step 4: Final commit and verify all tests pass**

```bash
npx vitest run
npm run build
```

Expected: All tests pass, build succeeds.

---

## Verification Checklist

- [ ] `npx vitest run` — all tests pass (encode/decode roundtrip, default layout generation)
- [ ] `npm run build` — production build succeeds with no errors
- [ ] Manual: upload doc → generate → create dashboard → rearrange → share URL → open in new tab
- [ ] Manual: add text note → format with bold/italic → delete note
- [ ] Manual: export dashboard as PNG
- [ ] Manual: shared URL in a new browser tab renders read-only view
- [ ] Manual: corrupted URL hash shows no crash (graceful fallback)
