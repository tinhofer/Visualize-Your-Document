# Interactive Dashboard — Design Spec

## Problem

DocuViz AI generates up to 11 visual types from a document, but the results page is a static grid with no customization. Users can only export individual visuals as images. There's no way to arrange, annotate, or share a curated set of visualizations as a cohesive dashboard.

## Goal

Add an interactive dashboard editor that lets users rearrange their generated visualizations into a custom grid layout, add text annotations, and share the result via a URL.

## User Flow

```
UPLOAD → CONFIG → GENERATING → RESULTS → DASHBOARD (new)
```

- The RESULTS step gains a "Create Dashboard" button
- Users can still export individual visuals from RESULTS (existing behavior preserved)
- The DASHBOARD step is optional — users who just want quick exports skip it

## Dashboard Editor

### Grid Layout

- 12-column CSS Grid (matches common dashboard conventions)
- Each visualization is a grid item with drag-to-reorder and resize handles
- Snap-to-grid: items align to column/row boundaries (no free-form positioning)
- Default sizes by visual type:
  - **Full-width (12 cols):** Summary, Tables, Timelines, Flowcharts, Mind Maps, Illustrations
  - **Half-width (6 cols):** Bar Charts, Line Graphs, Keyword Cloud, Icon Grid, Highlight Boxes
- Users can resize any item from half to full width (6 or 12 cols)
- Minimum height enforced per visual type to prevent content clipping

### Implementation: react-grid-layout

- Use `react-grid-layout` (MIT, well-maintained, purpose-built for draggable grid dashboards)
- Responsive breakpoints for mobile/tablet/desktop viewing
- Layout state stored as array of `{ i, x, y, w, h }` objects
- Each grid item wraps an existing visualization component (Charts, Mermaid, D3BubbleChart, etc.)

### Text Blocks

- "Add Note" button in the toolbar inserts a text block grid item
- Text blocks are contentEditable divs with basic formatting:
  - Bold, italic, headings (H3/H4) via toolbar buttons or keyboard shortcuts
  - No rich editor dependency — keep it lightweight
- Text blocks are grid items like any visualization (draggable, resizable)
- Stored as HTML strings in the layout state

### Dashboard Toolbar

| Button | Action |
|--------|--------|
| Add Note | Insert a text block at the bottom of the grid |
| Reset Layout | Restore default arrangement (by visual type defaults) |
| Share | Serialize → compress → generate shareable URL → copy to clipboard |
| Export | Render full dashboard to PNG or PDF via html-to-image |
| Back | Return to RESULTS step |

## Shareable URL

### Serialization

Dashboard state is a JSON object:

```typescript
interface DashboardState {
  layout: GridLayout[];        // react-grid-layout positions
  textBlocks: TextBlock[];     // { id, content (HTML string) }
  visualData: GeneratedContent; // existing Gemini output
  config: InfographicConfig;   // selected visuals, orientation, format
  metadata: {
    fileName: string;
    createdAt: string;
  };
}
```

### URL Encoding

1. Serialize to JSON
2. Compress with `pako` (zlib for the browser, ~3KB gzipped)
3. Base64-encode
4. Append as URL fragment: `<current-origin>/dashboard#data=<encoded>` (uses whatever domain the app is deployed on — works on localhost during dev)

### Limits

- URL fragments have no formal spec limit, but browsers handle ~32KB safely
- For dashboards exceeding ~20KB compressed, show a warning suggesting export instead
- Fragment-based approach means zero backend for v1

### Shared View (Read-Only)

- When URL contains `#data=...`, the app enters read-only presentation mode
- No grid handles, no toolbar (except Export and a "Create Your Own" CTA)
- Clean, centered layout with the dashboard content
- Responsive — works on mobile

## New Step: DASHBOARD

### State Machine Addition

Add `DASHBOARD` to the existing `Steps` discriminated union in `App.tsx`:

```typescript
| { step: 'DASHBOARD'; data: GeneratedContent; config: InfographicConfig; fileName: string }
```

### Component: DashboardStep.tsx

Located at `components/steps/DashboardStep.tsx`. Props:

```typescript
interface DashboardStepProps {
  readonly data: GeneratedContent;
  readonly config: InfographicConfig;
  readonly fileName: string;
  readonly onBack: () => void;
}
```

Internally manages:
- `layout` state (react-grid-layout positions)
- `textBlocks` state (array of text block content)
- Toolbar actions (share, export, reset, add note)

## New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| react-grid-layout | Drag/resize grid | ~40KB |
| pako | zlib compression for URL sharing | ~3KB |

## Files to Create

- `components/steps/DashboardStep.tsx` — main dashboard editor component
- `components/DashboardGrid.tsx` — grid layout wrapper around react-grid-layout
- `components/TextBlock.tsx` — editable text block component
- `components/DashboardToolbar.tsx` — toolbar with share/export/reset actions
- `components/SharedDashboardView.tsx` — read-only presentation mode
- `services/dashboardUtils.ts` — serialize, compress, encode/decode dashboard state
- `types.ts` — extend with DashboardState, TextBlock, GridLayout interfaces

## Files to Modify

- `App.tsx` — add DASHBOARD step to state machine, add URL fragment detection for shared view
- `types.ts` — add new interfaces and extend Steps union
- `components/steps/ResultsStep.tsx` — add "Create Dashboard" button
- `package.json` — add react-grid-layout and pako dependencies

## Error Handling

- URL decode failure → show friendly error with "Create Your Own" CTA
- Corrupted/truncated data → same graceful fallback
- Oversized dashboard → warn before sharing, suggest export

## Testing Strategy

- Unit tests for `dashboardUtils.ts` (serialize → compress → encode → decode → decompress → deserialize roundtrip)
- Unit tests for layout defaults (correct default sizes per visual type)
- Manual testing: generate a document, create dashboard, rearrange items, add text, share URL, open in new tab
- Edge cases: empty dashboard, single visual, all 11 visuals, very long text blocks
