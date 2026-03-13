# ResearchCanvas

A visual canvas for structuring and tracking multi-project research programs. Map your projects, publications, artefacts, and threads onto a shared canvas, draw connections between them, and get a bird's-eye view of your entire research portfolio.

---

## Requirements

- **Node.js** v18 or later ([nodejs.org](https://nodejs.org))
  Check with: `node --version`
- A modern browser: Chrome 120+, Firefox 120+, Safari 17+, or Edge 120+

---

## Quick Start (Development)

```bash
# 1. Clone or unzip the project
cd research-canvas

# 2. Install dependencies (one-time, takes ~30 seconds)
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build & Serve (Production)

Build a fast, optimised bundle and serve it locally:

```bash
npm run build   # compiles to dist/
npm run serve   # serves at http://localhost:4173
```

The `dist/` folder is self-contained — deploy it to any static host.

### Deploy to Netlify (free, 1 minute)

1. `npm run build`
2. Drag the `dist/` folder to **[app.netlify.com/drop](https://app.netlify.com/drop)**
3. Share the generated URL with your lab

### Deploy to GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

---

## Distributing to Lab Mates

**Option A — Share the source (recommended for development)**

Zip the project without `node_modules/` and `dist/`:

```bash
# macOS / Linux
zip -r research-canvas.zip . \
  --exclude "*/node_modules/*" \
  --exclude "*/.git/*" \
  --exclude "*/dist/*"
```

Recipients unzip and run `npm install && npm run dev`.

**Option B — Host it once, share a URL**

Deploy with Netlify or GitHub Pages (above). Everyone accesses the same URL — no installation needed.

> **Note on data:** Each browser/device has its own private storage. Use **Save / Load** (`.rcvs` files) to share a canvas state with colleagues.

---

## Interface Overview

```
┌──────────────────────────────── Toolbar ─────────────────────────────────┐
│  [+ Block types]  [Colour: Status|Threads|Tags]  [Detail: L0–L3]         │
│  [Auto-layout]    [Preset]   [Load]  [Save]   [≡ Sidebar]                │
└──────────────────────────────────────────────────────────────────────────┘
┌────────────────────── Canvas (infinite, pannable) ────────────┐ ┌─ Sidebar ─┐
│                                                               │ │  Blocks   │
│   [Block] ─────────────→ [Block]                              │ │  Threads  │
│        ↘                                                      │ │  Tags     │
│         [Block]                                               │ │  Views    │
│                                                               │ └───────────┘
│  [Legend ▼ Status]                         [Minimap]          │
└───────────────────────────────────────────────────────────────┘
```

### Sidebar tabs (when nothing is selected)

| Tab | What you can do |
|-----|----------------|
| **Blocks** | See all blocks; rename titles inline; change status |
| **Threads** | Create / rename / recolour / delete research threads |
| **Tags** | Manage the full tag taxonomy (domain → flavour → facet) |
| **Views** | Load view presets; see zoom / pan / colour mode info |

Selecting a block or connection switches the sidebar to that item's editor.

---

## Block Types

| Type | Accent colour | Purpose |
|------|--------------|---------|
| Program | Indigo | Overarching research program |
| Project | Sky | Individual research project |
| Sub-project | Cyan | Component of a project |
| Publication | Amber | Paper, chapter, or report |
| Artefact | Emerald | Tool, dataset, prototype |
| Thread Hub | Purple | Cross-cutting research thread anchor |
| Collaboration | Orange | External collaboration |
| Annotation | Gray | Free-text note |

---

## Visibility Levels

Control how much detail each block shows. Set globally in the toolbar (**L0 – L3**) or per-block in the sidebar Fields tab.

| Level | Content shown |
|-------|--------------|
| **L0** | Minimal pill — title only |
| **L1** | Title + status icon + thread colour pips |
| **L2** | + Description + phase progress bar + tag pips |
| **L3** | + Research question + venue / year |

---

## Colour Modes

Switch between three colour schemes from the toolbar:

| Mode | Block fill |
|------|-----------|
| **Status** | Reflects workflow status (not started → completed) |
| **Threads** | Reflects thread membership (mixed for multi-thread blocks) |
| **Tags** | Reflects primary tag domain colour |

The **Legend** (bottom-left corner of canvas) always reflects the active mode and is collapsible.

---

## Connection Types

| Type | Visual | Meaning |
|------|--------|---------|
| Dependency | Gray dashed → | Block B depends on Block A |
| Contribution Flow | Indigo solid → | Block A's output feeds Block B |
| Parallel Data | Cyan dotted | Both blocks share the same data |
| Conceptual Link | Slate long-dash | Loosely related conceptually |

---

## Working with Blocks

### Creating
Drag a block type from the toolbar palette onto the canvas, or click a type to place it at the centre.

### Editing
Click to select → the sidebar opens with five tabs:

- **Fields** — title, description, status, type, visibility level, RQ, contributions, venue, year, DOI, author role, artefact type, layout level
- **Progress** — phase tracker with milestones; click a phase name to advance; tick milestones to mark progress
- **Tags** — assign taxonomy tags (domain → flavour → facet checkboxes)
- **Threads** — toggle block membership in each research thread
- **Tracing** — explore contribution chains (see below)

### Resizing
Select a block → drag the corner/edge handles to resize freely. Use **Reset size** (sidebar footer) to restore the default dimensions for that block type.

### Moving multiple blocks
**Shift-click** to build a selection, then drag any block in the selection — all selected blocks move together.

---

## Working with Connections

### Creating
1. Select a source block
2. Click **Connect** in the sidebar footer
3. Click the target block — the connection is created with type *Dependency* by default

### Editing
- **Single-click** a connection arrow → selects it and opens the Connection editor in the sidebar (change type, edit label)
- **Double-click** a connection arrow → opens a floating popup to edit:
  - **Label** — text shown along the arrow
  - **Type** — change between the four connection types
  - **From → To** — rewire to different source or target blocks

### Deleting
Select a connection → **Delete Connection** in the sidebar, or press `Delete` / `Backspace`.

---

## Contribution Tracing

Select a block → open the **Tracing** sidebar tab → toggle one or more trace modes (or press keys **1 – 4**):

| Mode | Key | What it traces |
|------|-----|---------------|
| Upstream | `1` | All blocks this block depends on |
| Downstream | `2` | All blocks that depend on this block |
| Contribution | `3` | Blocks this block contributes output to |
| Full chain | `4` | Complete reachability in all directions |

Highlighted items show at full opacity; everything else fades to 30%.
Press `Escape` to clear the trace.

---

## Auto-Layout

1. Assign **Layout Levels** to blocks: sidebar → Fields → **Layout Level** → choose Level 0, 1, 2, …
2. Press **Auto-layout** in the toolbar
3. Blocks at Level 0 are placed in the leftmost column, Level 1 next, and so on
4. Blocks set to *Floating* or *All levels* are not moved

Undo with `Cmd/Ctrl + Z` if you don't like the result.

---

## Tag Taxonomy

Tags form a three-tier hierarchy. The coloured **pips** at the bottom of each block show which domains it belongs to, with symbols indicating the flavour:

```
Domain  (e.g. HCI)             → fills block + drives pip colour
  └─ Flavour  (e.g. Participatory Design)  → symbol inside pip: ● ◆ ▲ ■ ◉ ✦
       └─ Facet  (e.g. Co-design)          → sub-classification, not shown in card
```

Manage the full taxonomy from **Sidebar → Tags** (no block selected), or per-block in the block's **Tags** tab.

---

## Saving & Loading

| Method | How |
|--------|-----|
| **Auto-save** | Automatically every 30 s to browser localStorage — survives page refresh |
| **Save to file** | Toolbar → **Save** → writes a `.rcvs` file to your Downloads |
| **Load from file** | Toolbar → **Load** → pick a `.rcvs` file to restore a canvas |
| **View Presets** | Toolbar → **Preset** → save current zoom/pan/colour mode; load from Sidebar → Views |

`.rcvs` files are plain JSON — you can open them in a text editor or track them with git.

> **Tip:** Save a `.rcvs` file and share it with a colleague — they open it with **Load** to see your exact canvas state.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` | Redo |
| `Delete` / `Backspace` | Delete selected blocks or connections |
| `Escape` | Deselect all / cancel connecting / clear trace |
| `Cmd/Ctrl + A` | Select all blocks |
| `Shift + Click` | Add to / remove from selection |
| `1` `2` `3` `4` | Toggle trace modes (when a block is selected) |
| Scroll wheel | Zoom in / out (cursor-centred) |
| Middle-mouse drag | Pan canvas |
| Left-click drag on empty canvas | Pan canvas |
| `Space` + left-drag | Pan canvas |

---

## Data & Privacy

All data stays in your browser. Nothing is sent to any server. The app works fully offline once the page has loaded.

---

## Troubleshooting

**`npm install` fails or shows peer dependency errors**
Try: `npm install --legacy-peer-deps`

**File Save / Load doesn't work**
The browser File System Access API requires a *secure context*. Access the app via `http://localhost` or `https://` — not by opening `index.html` directly as a file (`file://`).

**Canvas is blank after a refresh**
The canvas auto-saves to localStorage. If it's blank, either no data was saved or localStorage was cleared. Load a `.rcvs` backup with **Load** in the toolbar.

**Text is cut off inside a block**
Either increase the block's Visibility Level (sidebar → Fields → Visibility Level) or resize the block to be taller/wider.

**Blocks jump to a tiny size when I try to resize**
Make sure you're on the latest version — this bug was fixed. If it persists, try refreshing the page.

---

## Tech Stack

Built with React 19, TypeScript, Vite 5, Zustand (state), react-konva (canvas rendering), Tailwind CSS v4, and chroma-js (colour mixing).

---

## License

MIT License — free to use, modify, and distribute.

---

## Authorship

ResearchCanvas was designed and built by **R. Guerra** in collaboration with **Claude (Anthropic)**, March 2026.

The concept, research domain requirements, and product decisions are the author's own. The implementation was developed through an iterative pair-programming process with Claude Sonnet as AI coding assistant.
