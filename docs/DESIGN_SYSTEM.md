# 🎨 DocSprint — Design System & Interface Specification

## 1. Design Vision

The **DocSprint Design System** combines the utility of high-precision engineering software with the sleek, distraction-free aesthetic of modern cyber-minimalism.

Designed specifically for students and candidates working under tight application deadlines, the interface prioritizes:
- **Instant Visual Legibility**: High-contrast dark surfaces with crystal-clear data typography.
- **Cognitive Calm**: Clean hairline borders and subtle translucency eliminate visual clutter during high-stress registration sprints.
- **Strategic Accent Coding**: Emerald green (`#10B981`) signifies zero-risk privacy compliance, while electric cyan (`#06B6D4`) and indigo (`#6366F1`) highlight active interactive stages.

---

## 2. Color Palette Tokens

### Dark Canvas & Obsidian Surfaces
| Token Name | Hex Value | Semantic Usage |
| :--- | :---: | :--- |
| `surface-bg` | `#09090B` | Deep background canvas (Zinc 950) |
| `surface-card` | `#121215` | Elevated studio containers, bento cards |
| `surface-card-hover`| `#18181B` | Hovered interactive list items, secondary cards |
| `border-subtle` | `#27272A` | Hairline dividers, card outlines (Zinc 800) |
| `border-active` | `#3F3F46` | Active input field borders, selected states |

### Semantic & Accent Tokens
| Token Name | Hex Value | Role & Psychology |
| :--- | :---: | :--- |
| `accent-emerald` | `#10B981` | Zero-retention privacy badge, verified compliance, success toasts |
| `accent-cyan` | `#06B6D4` | Primary actions, photo studio cropping markers, scan bounds |
| `accent-indigo` | `#6366F1` | PDF manipulation dials, playbook timelines, primary buttons |
| `accent-amber` | `#F59E0B` | Pending milestones, near-capacity file warnings |
| `accent-rose` | `#F43F5E` | Non-compliant specs, rejection alerts, destructive deletions |

### High-Contrast Text Tokens
| Token Name | Hex Value | Application |
| :--- | :---: | :--- |
| `text-primary` | `#F4F4F5` | Primary headings, active values, button labels |
| `text-secondary` | `#A1A1AA` | Field descriptions, auxiliary metadata, table headers |
| `text-muted` | `#71717A` | Inactive icons, placeholder hints, technical details |

---

## 3. Core Component Anatomy

### 3.1 Translucent Studio Card
- **Background**: `rgba(18, 18, 21, 0.75)` with `backdrop-filter: blur(12px)`.
- **Border**: `1px solid rgba(39, 39, 42, 0.8)`.
- **Border Radius**: `16px` (`rounded-2xl`).
- **Shadow**: `0 8px 32px -4px rgba(0, 0, 0, 0.3)`.

### 3.2 Confidence Score Ring
- **Geometry**: SVG circular arc with calibrated `stroke-dasharray` and `stroke-dashoffset`.
- **Color Mapping**:
  - `0% – 49%`: `stroke-rose-500` (High rejection risk)
  - `50% – 79%`: `stroke-amber-400` (Acceptable with warnings)
  - `80% – 100%`: `stroke-emerald-400` (Official spec compliant)

### 3.3 Micro-Typography
- **Font Stack**: System UI Sans (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`).
- **Monospace Telemetry**: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas` for file sizes (e.g. `24.8 KB`), pixel dimensions (`350×450 px`), and cryptographic hashes.

---

## 4. Interaction & Motion Rules

- **Spring Transitions**: Smooth transitions (`duration-200`, `ease-out`) on hover and state changes.
- **Drag & Drop Reordering**: High-contrast outline triggers when dragging PDF page thumbnails.
- **Zero Layout Shifts**: Canvas containers maintain fixed aspect ratios to prevent content jumping during image loading.

---

## 5. Accessibility & Inclusivity

- **WCAG 2.1 AA Compliance**: All text-to-background combinations maintain a minimum contrast ratio of 4.5:1.
- **Full Keyboard Navigation**: Every studio is accessible via keyboard shortcuts, tab indexing, and `⌘K` global palette.
- **Non-Color Dependent Indicators**: Every status (success, warning, error) couples color tokens with distinct icons and descriptive labels.
