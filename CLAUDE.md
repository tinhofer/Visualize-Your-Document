# CLAUDE.md - Project Instructions for AI Assistants

## ⚠️ Workflow Rules

1. **ALWAYS present a plan first** before making changes
2. **WAIT for user confirmation** before executing any plan
3. **Never auto-proceed** with implementation after presenting a plan
4. **Ask clarifying questions** if requirements are ambiguous

---

## Project Overview

**Name:** DocuViz AI (Visualize-Your-Document)  
**Purpose:** Upload documents (PDF, DOCX, PPTX, TXT) and generate visual representations using Google Gemini AI  
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, D3.js, Recharts, Mermaid.js

---

## Architecture

```
├── App.tsx                 # Main app component (state machine)
├── types.ts                # All TypeScript interfaces and enums
├── constants.ts            # Configuration values (no magic numbers!)
├── components/
│   ├── steps/              # Wizard step components
│   │   ├── UploadStep.tsx
│   │   ├── ConfigStep.tsx
│   │   ├── GeneratingStep.tsx
│   │   └── ResultsStep.tsx
│   ├── Charts.tsx          # Recharts wrapper (bar/line)
│   ├── D3BubbleChart.tsx   # D3 keyword visualization
│   ├── Mermaid.tsx         # Mermaid diagram renderer
│   ├── ExportWrapper.tsx   # Export to PNG/JPG/SVG
│   └── ErrorBoundary.tsx   # Global error handling
├── services/
│   ├── gemini.ts           # Gemini API integration
│   ├── apiUtils.ts         # Retry logic, custom errors
│   └── fileUtils.ts        # File type detection, base64
└── tests/                  # Vitest unit tests
```

---

## Coding Standards

### TypeScript
- **No `any` types** - use proper interfaces or `unknown` with type guards
- **Readonly props** - all component props should be `readonly`
- **Explicit return types** - for all functions except simple components
- **Discriminated unions** - for state machines (see `Steps` in App.tsx)

### Components
- **Functional components only** with `React.FC<Props>`
- **Use `React.memo`** for components that receive stable props
- **Extract constants** to `constants.ts` - no magic numbers in components
- **Props interfaces** above component, named `ComponentNameProps`

### Styling
- **Tailwind CSS only** - no inline styles except for dynamic values
- **Consistent color palette** - use slate/indigo from design system
- **Responsive** - mobile-first with `sm:`, `lg:` breakpoints

### File Organization
- **Barrel exports** via `index.ts` for component folders
- **One component per file** - except small helper components
- **Tests next to code** or in `/tests` folder with `.test.ts` suffix

---

## Visual Types (Current)

| VisualType | Component | Status |
|------------|-----------|--------|
| SUMMARY | Text block | ✅ |
| HIGHLIGHT_BOX | HighlightBox.tsx | ✅ |
| BAR_CHART | Charts.tsx | ✅ |
| LINE_GRAPH | Charts.tsx | ✅ |
| TABLE | TableVisualization.tsx | ✅ |
| FLOWCHART | Mermaid.tsx | ✅ |
| MIND_MAP | Mermaid.tsx | ✅ |
| TIMELINE | Timeline.tsx | ✅ |
| DATA_VIS | D3BubbleChart.tsx | ✅ |
| ILLUSTRATION | AI-generated image | ✅ |
| ICON_GRID | IconGrid.tsx | ✅ |

---

## Gemini API Integration

### Models Used
- **Analysis:** `gemini-2.5-flash` - document parsing, data extraction
- **Images:** `gemini-2.5-flash-image` - illustration generation

### Response Schema
The Gemini response must match `GeminiAnalysisResponse` in `types.ts`. When adding new visual types:
1. Add interface to `types.ts`
2. Add to `GeminiAnalysisResponse` and `GeneratedContent`
3. Extend schema in `gemini.ts` → `responseSchema`
4. Update prompt in `generateInfographics()`

### Error Handling
Custom error classes in `apiUtils.ts`:
- `APIKeyError` - missing/invalid API key
- `NetworkError` - connection issues
- `GenerationError` - AI generation failed
- `FileSizeError` / `FileTypeError` - validation errors

---

## Testing

```bash
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:coverage
```

Tests cover:
- `apiUtils.ts` - retry logic, error classes
- `fileUtils.ts` - file type detection
- `constants.ts` - value validation

---

## Common Mistakes to Avoid

1. ❌ Don't use `as any` - fix the types instead
2. ❌ Don't hardcode values - add to `constants.ts`
3. ❌ Don't initialize libraries in render/useEffect body - use refs or module scope
4. ❌ Don't forget `readonly` on props
5. ❌ Don't skip error handling for API calls
6. ❌ Don't proceed with implementation without user confirmation

---

## Adding New Visual Types

### Checklist:
1. [ ] Add to `VisualType` enum in `types.ts`
2. [ ] Create data interface (e.g., `TableData`)
3. [ ] Add to `GeneratedContent` and `GeminiAnalysisResponse`
4. [ ] Create component in `components/`
5. [ ] Add to `VISUAL_OPTIONS` in `ConfigStep.tsx`
6. [ ] Add rendering logic in `ResultsStep.tsx`
7. [ ] Extend Gemini schema and prompt in `gemini.ts`
8. [ ] Add unit tests

---

## Environment Setup

```bash
cp .env.local.example .env.local
# Add your Gemini API key to .env.local
npm install
npm run dev
```

Required environment variable:
- `API_KEY` - Google Gemini API key from https://ai.google.dev/
