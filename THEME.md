# CrickAuction Design System & Theme Guidelines

This document specifies the core design tokens, surfaces, cards, typography, shadows, borders, motion principles, and mobile responsiveness patterns established on the CrickAuction Landing Page. Use this guide across every page to ensure aesthetic consistency and fluid performance.

---

## 1. Color Palette

The theme is built on high-contrast dark glassmorphism: pitch blacks, cool slate undertones, neutral borders, and crisp monochrome accents.

| Role | Color / Value | Usage |
| :--- | :--- | :--- |
| **Page Base Background** | `#000000` / transparent | Global layout backplane |
| **Main Surface Card** | `#0c0d10` | Hero controller container, community wrapper |
| **Elevated Ticket / Item Card** | `#0e1015` (95% opacity) | Feedback cards, franchise cards, item tiles |
| **Modal / Dialog Background** | `#0c0c0c` | Modals, confirmations, floating sheets |
| **Subtle Inset / Well** | `bg-white/[0.02]` or `bg-black/40` | Inset badges, code inputs, secondary strips |
| **Primary Text (Heading)** | `#FFFFFF` | Hero titles, modal headers, primary values |
| **Secondary Text (Body)** | `text-slate-300` / `text-slate-400` | Subtitles, card descriptions, labels |
| **Muted Text / Metadata** | `text-gray-500` / `text-gray-600` | Micro timestamps, count badges, tooltips |
| **Primary CTA (Solid)** | `bg-white text-black hover:bg-slate-200` | Main submit, confirm, and launch actions |
| **Secondary CTA (Ghost/Pill)** | `bg-white/5 hover:bg-white/10 text-white` | Toggle buttons, filters, cancel buttons |

---

## 2. Card Surfaces & Borders

Never use harsh, fully opaque light borders or solid grey cards. Every surface relies on translucent borders and layered opacities:

### Main Container (Level 1)
```css
/* Hero Controller / Community Outer Shell */
background-color: #0c0d10;
border: 1px solid rgba(255, 255, 255, 0.10);
border-radius: 2rem (mobile: 1.75rem);
box-shadow: 0 24px 60px -15px rgba(0, 0, 0, 0.85);
```

### Interactive Tile / Item Card (Level 2)
```css
/* Franchise cards, Mode selection, Feedback tickets */
/* Default */
background-color: rgba(255, 255, 255, 0.02);
border: 1px solid rgba(255, 255, 255, 0.05);
border-radius: 0.75rem to 1rem;
transition: transform 200ms ease, background-color 200ms ease, border-color 200ms ease;

/* Hover */
background-color: rgba(255, 255, 255, 0.05);
border-color: rgba(255, 255, 255, 0.10);

/* Selected / Active State */
background-color: rgba(255, 255, 255, 0.08);
border-color: rgba(255, 255, 255, 0.20);
transform: scale(1.02);
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.50);
```

### Form Input Fields
```css
/* Inputs, search bars, and textareas */
background-color: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.10);
border-radius: 0.75rem;
color: #ffffff;
outline: none;

/* Focus State */
border-color: rgba(255, 255, 255, 0.30);
box-shadow: none; /* avoid glowing halo rings */
```

---

## 3. Shadows & Atmospheric Glows

All colored shadows (e.g. orange glows) have been removed in favor of clean atmospheric depth.

| Element | Tailwind Utility / CSS |
| :--- | :--- |
| **Headline Title Drop Shadow** | `drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]` |
| **Primary Action Button Shadow** | `shadow-[0_10px_30px_rgba(255,255,255,0.08)]` |
| **Modal Container Shadow** | `shadow-[0_25px_60px_rgba(0,0,0,0.85)]` |
| **Ambient Backdrop Blur (Top)** | `w-96 h-96 bg-white/[0.02] blur-[120px] rounded-full` |
| **Ambient Backdrop Blur (Bottom)** | `w-96 h-96 bg-slate-500/[0.02] blur-[120px] rounded-full` |

---

## 4. Typography Rules

1. **Pixel Font (`font-pixel`)**:
   - Used for **main headings**, **section titles**, **step chips**, and **eyebrows**.
   - Always in `uppercase` with tracking: `tracking-tight` on large titles, `tracking-wider` on tags.
   - Example scale: `text-[clamp(1.3rem,4vw,2.4rem)]`.

2. **Body Font (`font-sans` / Inter/Geist)**:
   - Used for all descriptions, form labels, numbers, and data rows.
   - High legibility, standard letter casing, relaxed line-heights (`leading-relaxed`).

3. **Status Badges & Micro Chips**:
   - `font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider`
   - Background: `bg-white/5` with `border border-white/10 text-slate-300`.

---

## 5. Animation & Smoothness (60/120fps Standards)

To guarantee zero stutter or jank across low-power and high-refresh screens:

1. **GPU Composited Properties Only**:
   - Animate only `transform` and `opacity`.
   - Always apply `transform-gpu` to animated cards to force GPU compositing.
   - Never animate `height`, `width`, `margin`, or `padding` during loops or continuous states.

2. **Cubic-Bezier Easing**:
   - Card expansions and transitions use natural decelerations:
     `transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}`.

3. **Hover vs. Touch Safety**:
   - **Desktop**: Subtle hover tilts (`lg:hover:-rotate-1` / `lg:hover:rotate-1`) and lifts (`lg:hover:-translate-y-0.5`).
   - **Mobile**: Never apply rotate tilts on touch devices (causes repaint churn during scrolling). Use tactile tap compression instead: `active:scale-[0.98]`.

4. **Zero Timer Jitter**:
   - Never use JavaScript `setTimeout` state loops to drive visual animation states.
   - Use CSS `@keyframes` on GPU composited layers or Framer Motion transitions with `initial={false}`.

---

## 6. Mobile Responsiveness Standards

| Breakpoint | Behavior & Layout Rules |
| :--- | :--- |
| **Mobile (< 640px)** | • Horizontal padding: `px-2.5` to `px-3.5` (prevents edge crampedness).<br>• Outer corner radius: `rounded-[1.75rem]` (avoids clipped screens).<br>• Multi-column grids collapse to scrollable tab strips with `touch-pan-x scroll-smooth`.<br>• Typography clamps with `clamp()` to eliminate horizontal text overflow. |
| **Tablet (640px - 1024px)** | • 2-column stacked layouts with `gap-4 sm:gap-6`.<br>• Outer corner radius: `rounded-[2.2rem]`. |
| **Desktop (> 1024px)** | • 4-column board grids or 12-column split rows (e.g. `lg:col-span-7` + `lg:col-span-5`).<br>• Outer corner radius: `rounded-[2.5rem]`.<br>• Hover tooltips and slight hover rotations enabled. |

---

## 7. Reusable Component Checklist

When creating or modifying new pages in CrickAuction:
- [ ] Base background uses `#000000` / transparent with `<PageBackground />`.
- [ ] No orange gradients or bright accent halos; use monochrome (`bg-white text-black`) or cool slate.
- [ ] Modals and sheets use `#0c0c0c` with `border-white/10` and `backdrop-blur-md`.
- [ ] Tap targets on mobile are minimum `44px` height with `active:scale-[0.98]` feedback.
- [ ] Modals use `prefers-reduced-motion` compliance where applicable.

