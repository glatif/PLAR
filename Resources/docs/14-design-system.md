# Design System: "Calm Glass"

This is the single design reference for the PLAR platform and **everything we produce alongside it**: the web app, emails, PDFs, assessment reports, proposals, slides and documentation.

> **Status:** v0.1 draft, 2026-10-22. The visual language is inspired by Apple's Human Interface Guidelines (HIG), with **teal** replacing Apple's blue accent. It still needs checking against TRU's brand guidelines for official student-facing documents. **The platform uses the light theme only.** The dark-theme values below are kept for reference in case a dark option is added later.

---

## 1. Where this comes from

We studied Apple's public Human Interface Guidelines and adapted the parts that suit a web platform:

| HIG page | What we took from it |
|---|---|
| [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) | Text styles defined as weight + size + leading; avoid light weights; minimum sizes; tighter tracking at large sizes; few typefaces |
| [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | **Liquid Glass belongs to the controls and navigation layer, never the content layer**; use it sparingly; the "regular" variant for text-heavy components, the "clear" variant over media, with a 35% dimming layer over bright content |
| [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) | Order content by importance; align and indent to show hierarchy; group with space, containers or separators; progressive disclosure; keep controls distinct from content |
| [Color](https://developer.apple.com/design/human-interface-guidelines/color) | Colours must work in light, dark and increased-contrast modes; use accent colour sparingly, mainly for primary actions and status; never rely on colour alone |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | Contrast **4.5:1 for text up to 17 pt, 3:1 for 18 pt+ or bold**; controls **44×44 pt by default** (28×28 minimum on iOS); respect Reduce Motion |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) | Generous space around buttons; capsules for buttons in a horizontal row, rounded rectangles in a vertical stack |

**What we deliberately do not copy:**

- We do not use Apple's logos, product imagery, SF Symbols or the SF and New York fonts as embedded files. Their licences limit them to Apple platforms. See §4.
- We do not use Apple's blue. **Teal is our accent** (§3).
- The platform must read as a **TRU / PLAR product**, never as an Apple product.

## 2. Principles

1. **Content first.** Portfolios, evidence, rubrics and reports are the content. The interface frames them quietly. This follows the HIG "controls float above content" idea.
2. **Clear hierarchy.** Size, weight and placement show what matters most. One primary action per view.
3. **Calm by design.** Students feel vulnerable during PLAR, as both the Assessor and Student Handbooks note, so the student-facing interface avoids alarming colours, countdowns and judgemental language.
   - An **"I" (Inconclusive) rating is shown in neutral grey, never red**, because "I" doesn't mean the student lacks the competency (PLAR Assessor Handbook).
4. **Depth with restraint.** Glass marks the navigation and control layer only (top bars, sidebars, toolbars, sheets, popovers, the interview control bar). Content sits on solid surfaces.
5. **AI is always visible as AI.** Any AI-drafted or AI-suggested content carries a consistent marker and stays visually "draft" until a person accepts it (§9.8). This reflects the principle that people, not AI, make every assessment decision.
6. **Accessible by default.** WCAG 2.2 AA is the floor. Every colour pair in §3 has been checked.
7. **One system everywhere.** The same tokens drive the app, the emails and every PDF (§11).

## 3. Colour

### 3.1 Teal accent scale

Contrast is measured against white `#FFFFFF` and against the dark background `#0B0D0F`.

| Token | Hex | On white | On dark bg | Use |
|---|---|---|---|---|
| `teal-50` | `#EFFAF8` | — | — | Tinted backgrounds, selected rows (light) |
| `teal-100` | `#D5F2EE` | — | — | Subtle fills, AI-suggestion background (light) |
| `teal-200` | `#A9E4DD` | — | — | Borders on tinted surfaces |
| `teal-300` | `#72CFC5` | 1.8 | 10.6 | Charts; dark-mode hover |
| `teal-400` | `#3BB5AA` | 2.5 | **7.8** | **Dark-mode accent** (text, icons, fills) |
| `teal-500` | `#14998F` | 3.5 | 5.6 | Large text or icons only (light) |
| `teal-600` | `#0D7F77` | **4.9** | 4.0 | **Light-mode accent**: links, primary buttons (white text 4.9:1), focus ring |
| `teal-700` | `#0B6660` | 6.8 | — | Hover and pressed (light) |
| `teal-800` | `#0B514D` | 9.1 | — | Accent text on `teal-50/100` |
| `teal-900` | `#0A3F3C` | 11.7 | — | Headings on tinted panels; print cover band |
| `teal-950` | `#062826` | 15.7 | — | Text on `teal-400` fills (dark mode) |

Apple's own system teal is too light to reach 4.5:1 on white, so we use our own deeper teal for text and buttons.

### 3.2 Neutrals and semantic roles

| Role | Light | Dark | Notes |
|---|---|---|---|
| `bg` (app background) | `#F5F5F7` | `#0B0D0F` | A subtle off-white canvas, as on Apple surfaces |
| `surface` (cards, content) | `#FFFFFF` | `#1C1C1E` | Solid. Never glass. |
| `surface-2` (grouped or nested) | `#FAFAFC` | `#2C2C2E` | |
| `label` (primary text) | `#1D1D1F` | `#F5F5F7` | 16.8:1 / 15.6:1 |
| `label-secondary` | `#6E6E73` | `#A1A1A6` | 5.1:1 on white, 6.6:1 on `#1C1C1E` |
| `label-tertiary` | `#8E8E93` | `#8E8E93` | **Placeholders and decoration only.** Fails 4.5:1 on light backgrounds. |
| `separator` | `rgba(0,0,0,0.10)` | `rgba(255,255,255,0.12)` | Hairlines |
| `border-strong` | `#D2D2D7` | `#3A3A3C` | Input borders |
| `accent` | `teal-600` | `teal-400` | |
| `accent-hover` | `teal-700` | `teal-300` | |
| `accent-subtle` | `teal-50` | `rgba(59,181,170,0.14)` | Selected and tinted states |
| `on-accent` | `#FFFFFF` | `teal-950` | Text on accent fills |
| `focus-ring` | `teal-600` at 100%, plus a 4px halo at 35% | `teal-400` | Always visible on keyboard focus |

### 3.3 Status colours

These are used sparingly, and always with an icon and a label (never colour alone).

| Status | Light | Dark | Use |
|---|---|---|---|
| Success | `#1E7B34` | `#4CD58A` | Completed, approved, verified |
| Warning | `#8A5A00` | `#FFA44A` | Due soon, needs attention |
| Danger | `#C4281C` | `#FF6B60` | Errors, destructive actions, failed verification. **Never used for student ratings.** |
| Info | `teal-600` | `teal-400` | Neutral notices |

### 3.4 Competency rating chips (assessor and staff views only)

| Rating | Style |
|---|---|
| **O** Outstanding | `teal-600` fill, white text |
| **S** Satisfactory | `teal-100` fill, `teal-800` text |
| **I** Inconclusive | `#E8E8ED` fill, `#3A3A3C` text (neutral) |
| Not yet rated | Dashed `border-strong` outline |

### 3.5 Data visualisation

- **Sequential:** `teal-100 → teal-300 → teal-500 → teal-700 → teal-900`.
- **Categorical (up to 6 colours):** teal-600, `#5E5CE6` indigo, `#B25000` amber-brown, `#2F7FC1` steel, `#8E8E93` grey, `#A2845E` sand.
- Pair colour with labels or patterns throughout.

## 4. Typography

### 4.1 Typefaces

| Purpose | Stack | Why |
|---|---|---|
| UI and documents (web) | `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Apple devices render the native San Francisco system font. Everyone else gets **Inter** (open source, SIL OFL), which has very similar proportions. |
| Numbers in tables | The same stack with `font-variant-numeric: tabular-nums` | Columns line up |
| Code and IDs | `ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace` | |
| **PDFs and print** | **Inter, embedded** | The SF fonts may not be embedded in documents we distribute (licensing), so Inter keeps PDFs identical everywhere |

Only **one typeface family** is used ("Minimize the number of typefaces", HIG Typography). Weights are 400 (Regular), 500 (Medium), 600 (Semibold) and 700 (Bold). **We never use Ultralight, Thin or Light** (HIG).

### 4.2 Type scale (web, in px)

This is adapted from Apple's text styles, with leading relaxed slightly for long reading on the web.

| Token | Size / line height | Weight | Tracking | Use |
|---|---|---|---|---|
| `display` | 40 / 48 | 700 | −0.025em | Cover pages and proposal titles only |
| `large-title` | 34 / 41 | 700 | −0.022em | Page title |
| `title-1` | 28 / 34 | 600 | −0.02em | Section title |
| `title-2` | 22 / 28 | 600 | −0.015em | Card title, panel title |
| `title-3` | 20 / 25 | 600 | −0.01em | Sub-section |
| `headline` | 17 / 22 | 600 | −0.005em | List headers, emphasis |
| `body` | 17 / 26 | 400 | 0 | **Default reading text** (portfolios, reports) |
| `body-compact` | 15 / 22 | 400 | 0 | Dense staff screens and tables |
| `callout` | 16 / 21 | 400 | 0 | Helper text in forms |
| `subheadline` | 15 / 20 | 500 | 0 | Metadata |
| `footnote` | 13 / 18 | 400 | 0 | Timestamps, citations |
| `caption` | 12 / 16 | 500 | +0.01em | Labels, chips. **Minimum size**; never smaller. |

**Rules**

- Reading line length is **60–80 characters**, or `max-width: 72ch`.
- Body copy is left-aligned. Never justify on screen.
- At most **three sizes per view**, plus weight changes, to show hierarchy.
- Text must respond to browser zoom and user font size (sizes in `rem`), and must hold up at 200% zoom.

## 5. Spacing and layout

| Token | Value | Typical use |
|---|---|---|
| `space-1` | 4px | Icon-to-label gap |
| `space-2` | 8px | Inside chips; tight stacks |
| `space-3` | 12px | Field label → input |
| `space-4` | 16px | **Default padding**; mobile gutter |
| `space-5` | 20px | Card padding (compact) |
| `space-6` | 24px | **Card padding**; tablet gutter |
| `space-8` | 32px | Between sections; desktop gutter |
| `space-10` | 40px | Between major groups |
| `space-12` | 48px | Page top padding |
| `space-16` | 64px | Hero and cover spacing |

The system uses a **4px base grid**. Every dimension is a multiple of 4.

**Page layout**

- Max content width 1200px. Reading column 720px.
- Gutters are 16 / 24 / 32px (mobile / tablet / desktop).
- A 12-column grid with 24px gaps on desktop.

**App shell**

- A glass **top bar** that stays fixed at 56px.
- A glass **sidebar**, 260px wide, collapsible to 72px.
- Content sits on `bg`, with cards on `surface`.

**Grouping**

- Prefer **space and containers over lines**. Use separators only inside lists.
- Indent subordinate items by 16px (HIG Layout).
- Use **progressive disclosure**: details live in disclosure rows, side sheets or "Show more", not on the first screen.

## 6. Shape: radii and borders

| Token | Radius | Use |
|---|---|---|
| `radius-xs` | 6px | Chips inside cards, checkboxes |
| `radius-sm` | 10px | Inputs, small buttons, menu items |
| `radius-md` | 14px | **Cards**, popovers |
| `radius-lg` | 20px | Sheets, modals, the video tile frame |
| `radius-xl` | 28px | Large panels, the cover band in documents |
| `radius-full` | 9999px | Capsule buttons, pills, segmented controls, avatars |

- **Concentric corners.** A nested element's radius = the parent's radius − the padding between them. For example, a card at 14px with 8px padding gives an inner image of 6px. This keeps curves parallel, as on Apple surfaces.
- **Borders are hairlines.** Use 1px `separator` (or `0.5px` on high-DPI screens via `box-shadow: 0 0 0 0.5px`). Cards get a hairline **plus** a very soft shadow, never a heavy outline.
- **Focus** is a 2px solid `focus-ring` with a 2px offset, plus a 4px halo at 35% opacity.

## 7. Elevation and glass

### 7.1 Shadows (the light theme; dark theme uses borders instead of shadows)

| Token | Value | Use |
|---|---|---|
| `shadow-1` | `0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.03)` | Cards at rest |
| `shadow-2` | `0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` | Hovered cards, popovers |
| `shadow-3` | `0 16px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)` | Sheets, modals |

### 7.2 Glass materials (navigation and control layer only)

| Token | Light | Dark | Use |
|---|---|---|---|
| `glass-regular` | `background: rgba(255,255,255,0.72); backdrop-filter: blur(24px) saturate(180%)` | `rgba(28,28,30,0.66)`, same filter | Top bar, sidebar, toolbars, popovers, sheets. This is the "regular" variant: text-heavy, with legibility first. |
| `glass-thick` | `rgba(255,255,255,0.86)`, `blur(30px)` | `rgba(28,28,30,0.82)` | Menus and dialogs that sit over busy content |
| `glass-clear` | `rgba(255,255,255,0.18)`, `blur(16px)`, with a **35% black dimming layer behind it** when the content underneath is bright | Same | **Only over video**: the interview control bar and the ID-capture overlay (HIG "clear" variant) |
| Glass edge | `border: 1px solid rgba(255,255,255,0.55)` inside, plus a 1px `separator` outside | `rgba(255,255,255,0.14)` | A subtle specular edge |

**Glass rules**

- **Never** put glass in the content layer: not on cards, tables, portfolio pages or reports (HIG Materials).
- At most **two glass surfaces visible at once**.
- Use a **scroll-edge effect** (a soft fade or blur where content passes under the top bar) instead of a solid divider.
- **Fallbacks are required.** Under `@media (prefers-reduced-transparency: reduce)`, `@media (prefers-contrast: more)`, or when `backdrop-filter` is unsupported, glass becomes a solid `surface` with a `border-strong` hairline.

## 8. Motion

| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion-fast` | 150ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Hover and press |
| `motion-base` | 250ms | Same | Popovers, toggles |
| `motion-slow` | 350ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets, page transitions |

- Motion only explains change (where something came from or went). There are **no decorative loops**.
- Under `prefers-reduced-motion: reduce`, movement is replaced with fades (HIG Accessibility).
- The interview room never animates while someone is speaking.

## 9. Components

### 9.1 Buttons

| Variant | Light style | Use |
|---|---|---|
| **Primary** | `accent` fill, `on-accent` text, 600 weight | One per view: "Submit report", "Start interview" |
| **Secondary** | `accent-subtle` fill, `teal-800` text | Supporting actions |
| **Tertiary / plain** | No fill, `accent` text | Inline and low emphasis |
| **Neutral** | `rgba(0,0,0,0.05)` fill, `label` text | Cancel, Back |
| **Destructive** | Danger text, or a danger fill only in confirmation dialogs | Delete, Revoke |

- **Sizes:** large 52px, default **44px** (the HIG default target), compact 32px (dense desktop tables only; the hit area stays ≥ 28px).
- **Shape:** capsule when buttons sit in a horizontal row; `radius-sm` rounded rectangles when stacked vertically (HIG Buttons).
- Padding 0 20px. Icon and label gap is 8px.
- Loading state: an inline spinner, with the label kept.

### 9.2 Form controls

- Inputs are 44px tall, `radius-sm`, with a `border-strong` 1px border and `surface` fill. On focus the border becomes `accent` and the focus ring shows.
- The label sits above the field (subheadline). Helper text is callout `label-secondary`. Errors use danger text with an icon below the field.
- Switches, checkboxes and radios use `accent` when on. The minimum hit area is 44px.
- Use a **segmented control** (capsule) for 2–4 options, such as Lower / Upper level or Light / Dark.

### 9.3 Cards and lists

- **Card:** `surface`, `radius-md`, hairline plus `shadow-1`, padding `space-6`. The title is title-2, with an optional subtitle in footnote.
- **Inset grouped list** (settings and case details): rows of 52px or more, separators inset by 16px, a disclosure chevron for drill-down.

### 9.4 Navigation

- **Glass top bar:** product name on the leading side, search in the centre, then notifications and the avatar on the trailing side.
- **Glass sidebar:** sections grouped by role. The active item gets an `accent-subtle` pill with `accent` icon and text.
- **Tabs:** an underline-free segmented style on desktop; a bottom tab bar on mobile for students.

### 9.5 Sheets, modals, popovers and toasts

- Sheets slide in from the right (staff detail views) or the bottom (mobile). They use `glass-regular` or `surface` with `radius-lg` and `shadow-3`.
- Modals are only for confirmation of irreversible actions, with a clear verb on the button ("Release result", not "OK").
- Toasts appear bottom-centre as glass capsules, for 4 seconds. Never put critical information in a toast.

### 9.6 Status and progress

- **Status pills:** capsule, caption 500 weight, an icon plus text. For example: "Awaiting feedback", "Ready for assessment", "Verified".
- **Case timeline:** a vertical stepper for the student journey. Completed steps are `accent` checkmarks, the current step is an `accent` ring, future steps are a neutral outline.
- **Due-date chip:** neutral until 7 days before the date, then warning. Never red for students.

### 9.7 Tables

- Header row in subheadline `label-secondary`. Rows are 48px, with hairline separators and no vertical lines.
- Hover shows `surface-2`; selection shows `accent-subtle`. Numeric columns are right-aligned and tabular.

### 9.8 AI-assisted content

- **Marker:** a small "✦ AI draft" or "✦ Suggested" capsule (`teal-100` fill, `teal-800` text) on every AI-generated block.
- **Draft styling:** an `accent-subtle` background with a dashed `teal-200` border, until a person chooses **Accept**, **Edit** or **Dismiss**. After acceptance it becomes normal content, and the audit log records who accepted it.
- **Citations:** each AI claim links to its source passage in the portfolio. A footnote-size chip such as "DoL p.4" opens the viewer at that spot.
- **Confidence:** never shown as a numeric score to students. Staff may see "Needs review" flags.

### 9.9 Domain components

- **Document viewer:** a centred page on `bg`, a glass toolbar (zoom, page, search, comment), a right-hand comments panel, and an evidence list.
- **Rubric matrix:** criteria rows × (Chair | Writer) columns with tri-state checks (not shown / partly shown / fully shown), shown with neutral → `teal-100` → `teal-600` fills and icons. This replaces the Word form's yellow/green highlighting.
- **Comment suggestion panel:** the top ~10 standard comments as cards (source section shown), with Insert and Edit buttons and an "Insert as written" option.
- **Interview room:** see §10.

## 10. The interview room (video)

- **A dark, calm, immersive theme**, regardless of the system appearance. Video tiles use `radius-lg`, 8px gaps, and a name label in a clear-glass capsule.
- **Control bar:** a floating `glass-clear` capsule at the bottom centre, with the dimming layer behind it. It holds mute, camera, captions, a competency tracker (staff only), and end call.
- **Recording indicator:** always visible at the top leading corner. It is a red dot plus the word "Recording", the **one** place red appears for students, because it is a status that is legally significant.
- **ID verification step (before joining):**
  - A full-bleed camera preview with a rounded-rectangle guide frame sized to an ID card.
  - Plain-language instructions ("Hold your ID inside the frame. Avoid glare.").
  - Live quality hints (glare, blur, too far).
  - A privacy note with a "Learn how we protect your ID" link.
  - A neutral "Checking…" state; never "Failed". The fallback message is "We'll confirm your identity with your advisor."
- **Captions:** live captions are available on request, and use a high-contrast caption style (white on 70% black).

## 11. Documents: PDFs, reports, proposals, slides and email

The same tokens apply in print. Glass does not exist in print; it becomes subtle tinted surfaces.

| Element | Specification |
|---|---|
| Page | **US Letter** (the Canadian default), 0.75in margins (1in at the binding edge for printed reports) |
| Font | Inter, embedded. Weights 400 / 600 / 700. |
| Print type scale (pt) | Cover title 30/36 700 · H1 20/26 600 · H2 15/20 600 · H3 12.5/17 600 · Body **10.5/15.5** 400 · Small 9/13 · Caption 8.5/12 |
| Colour | Text `#1D1D1F`; secondary `#6E6E73`; accent `teal-600`; headings may use `teal-900`; tinted panels `teal-50` |
| Cover page | White page, with a full-width `teal-900` band holding the title in white, or a 28px-radius teal-50 panel. Document type, version, date and audience (e.g. "Prepared for TRU PLAR") sit below. |
| Header and footer | A footnote-size running header with the document title; a footer with the page number "Page x of y" and the classification ("Confidential – contains student information" where applicable) |
| Tables | Hairline rules, header in 600 weight on `#F5F5F7`, no vertical rules, zebra rows optional (`#FAFAFC`) |
| Callouts | `teal-50` panel, `radius-md` corners, padding 12pt, a title in 600 weight. Warnings use a warm neutral `#FFF6E5` with warning text. |
| Figures | Rounded 10pt corners, footnote-size captions, sequential teal charts |
| Assessment reports to students | Calm, neutral styling. Rating table chips follow §3.4 (I in neutral grey). The official wording follows the department's report template, but **TRU branding may override our styling**. |
| Slides | 16:9. Large-title or display headings, one idea per slide, generous white space, teal used only for emphasis. |
| Email | A 600px single column on a `#F5F5F7` canvas, a white card with `radius-md`, a 16px base font with system stack fallbacks, one teal capsule button, and a plain-text alternative always included |

**Production pipeline (proposed):** Markdown or HTML → the shared print stylesheet (built from the same tokens) → PDF, rendered with headless Chromium. One source of truth, so the app and the documents never drift apart.

## 12. Voice and content

- Plain language. Use Canadian spelling (e.g. "colour", "centre", "program").
- Student-facing text is **encouraging, neutral and non-judgemental**. It never hints at an award outcome. This mirrors the tone rules advisors and assessors already follow.
- Reports avoid "you" statements where possible, as the Assessor Handbook recommends.
- Use action verbs on buttons ("Submit section", "Book interview"). Avoid "OK" and "Yes".
- Avoid jargon and acronyms in student views. Spell out "Demonstration of Learning" (the written section) and "Discussion of Learning" (the interview) rather than "DoL".

## 13. Accessibility checklist

- WCAG 2.2 AA. Text contrast ≥ 4.5:1 (≥ 3:1 for 18px+ or bold). UI component and focus contrast ≥ 3:1.
- Hit targets ≥ 44×44px by default (≥ 24×24px absolute minimum under WCAG 2.2).
- Full keyboard support, visible focus, logical heading order, ARIA only where native HTML falls short.
- Captions for every video; transcripts on request; an audio-only interview option.
- Respect `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` and `prefers-color-scheme`.
- PDFs are tagged (headings, reading order, alt text) and pass PDF/UA checks.

## 14. Tokens (implementation reference)

```css
:root {
  --bg: #F5F5F7; --surface: #FFFFFF; --surface-2: #FAFAFC;
  --label: #1D1D1F; --label-2: #6E6E73; --label-3: #8E8E93;
  --separator: rgba(0,0,0,.10); --border-strong: #D2D2D7;
  --accent: #0D7F77; --accent-hover: #0B6660; --accent-subtle: #EFFAF8; --on-accent: #FFFFFF;
  --success: #1E7B34; --warning: #8A5A00; --danger: #C4281C;
  --radius-xs: 6px; --radius-sm: 10px; --radius-md: 14px; --radius-lg: 20px; --radius-xl: 28px;
  --shadow-1: 0 1px 2px rgba(0,0,0,.04), 0 1px 1px rgba(0,0,0,.03);
  --glass: rgba(255,255,255,.72); --glass-filter: blur(24px) saturate(180%);
  --font-sans: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0B0D0F; --surface: #1C1C1E; --surface-2: #2C2C2E;
    --label: #F5F5F7; --label-2: #A1A1A6; --separator: rgba(255,255,255,.12); --border-strong: #3A3A3C;
    --accent: #3BB5AA; --accent-hover: #72CFC5; --accent-subtle: rgba(59,181,170,.14); --on-accent: #062826;
    --success: #4CD58A; --warning: #FFA44A; --danger: #FF6B60;
    --glass: rgba(28,28,30,.66);
  }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  :root { --glass: var(--surface); --glass-filter: none; }
}
```

The tokens will live in one package (`design/tokens.json`). The web CSS, the component library theme, email templates and the print stylesheet are all generated from it.

## 15. Governance

- Each change bumps the version (v0.x until stakeholder sign-off). Changes are recorded in the project's change log.
- Every new component is checked against §2 and §13 before merging.
- Open question: do TRU's brand guidelines (logo, colours, typography) apply to the platform, or only to official correspondence?
