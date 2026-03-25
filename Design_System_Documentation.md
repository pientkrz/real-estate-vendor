# Design System: Aurelian Elite

## Overview & Creative North Star
**The Creative North Star: "The Architectural Ledger"**

This design system moves away from the generic "corporate template" by embracing the aesthetics of high-end editorial journals and architectural briefs. The visual language is defined by **intentional asymmetry, tonal depth, and atmospheric breathing room.** 

We do not use lines to define space; we use light and mass. By leveraging a sophisticated palette of ochre, charcoal, and bone, the system establishes a "Trustworthy" profile not through heavy borders, but through the quiet confidence of a well-organized, premium layout. The goal is to make the user feel they are interacting with a physical, high-quality document where every element has been placed with surgical precision.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a professional "Gold & Obsidian" foundation, elevated by a nuanced scale of neutral surfaces.

### The "No-Line" Rule
**Standard 1px solid borders are strictly prohibited for sectioning.** 
Structural separation must be achieved through background shifts. For example, a content block using `surface-container-low` should sit atop a `surface` background. This creates a soft, sophisticated transition that feels more "designed" and less "templated."

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. 
- **Base Layer:** `surface` (#fcf9f8).
- **Secondary Depth:** `surface-container-low` (#f6f3f2) for large content areas.
- **Interactive Depth:** `surface-container-highest` (#e5e2e1) for cards or elevated modules.
- **Nesting:** When placing a card inside a section, the card must always be at least one tier higher or lower in the surface scale than its parent to ensure legibility without outlines.

### The "Glass & Gradient" Rule
To inject "visual soul" into the professional aesthetic:
- **Main CTAs:** Use a subtle linear gradient (135°) transitioning from `primary` (#7a590c) to `primary-container` (#c2994a). This prevents the "flat" look of standard buttons.
- **Floating Elements:** Navigation bars or sticky headers should utilize a "frosted glass" effect using `surface` at 80% opacity with a `backdrop-blur` of 12px.

---

## 3. Typography: Editorial Rhythm
The system utilizes **Work Sans** for structural authority and **Inter** for functional clarity.

*   **Display & Headlines (Work Sans):** Used to anchor the page. Use `display-lg` (3.5rem) with tighter letter-spacing (-0.02em) to create a bold, editorial impact. These should often be positioned asymmetrically to break the grid.
*   **Body & Titles (Inter):** Optimized for high-speed scanning. `body-lg` (1rem) provides a comfortable reading experience, while `title-lg` (1.375rem) serves as a bridge between the bold headlines and the functional text.
*   **The Signature Label:** Use `label-md` in all-caps with 0.1em letter-spacing using the `primary` color (#7a590c) to categorize content. This acts as a "stamp of quality\" across the interface.

---

## 4. Elevation & Depth
Depth in this system is organic, mimicking natural ambient light rather than artificial drop shadows.

*   **Tonal Layering:** 90% of your hierarchy should be solved by shifting from `surface-container-lowest` to `surface-container-high`.
*   **Ambient Shadows:** If an element must float (e.g., a modal), use a shadow with a blur radius of 32px or greater, at 6% opacity. The shadow color should be a tint of `on-surface` (#1c1b1b), never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a stroke, use the `outline-variant` token at 15% opacity. This provides a "suggestion" of a boundary without interrupting the visual flow.
*   **Glassmorphism:** Use semi-transparent layers for overlays. This allows the sophisticated background colors to bleed through, ensuring the UI feels like a single, integrated piece of art.

---

## 5. Components

### Buttons (The Signature CTA)
*   **Primary:** Gradient of `primary` to `primary-container`. `md` (0.375rem) corner radius. No border.
*   **Secondary:** `surface-container-highest` background with `on-surface` text.
*   **Tertiary:** Text-only in `primary` color, with a 1px `primary` underline that appears only on hover.

### Cards & Lists
*   **Rule:** Forbid the use of divider lines.
*   **Implementation:** Separate list items using a `12` (3rem) spacing gap or by alternating background colors between `surface` and `surface-container-low`.
*   **Interactive Cards:** On hover, a card should shift from `surface-container-low` to `surface-container-highest` rather than growing in size.

### Input Fields
*   **Style:** Minimalist. No background color (transparent). Use a bottom-only `outline-variant` (20% opacity) stroke. 
*   **Focus State:** The bottom stroke transitions to `primary` (#7a590c) with a thickness shift from 1px to 2px.

### Chips
*   **Filter Chips:** Use `surface-container-high` with `label-md` typography. When selected, shift to `primary-container` with `on-primary-container` text.

### Hero Modules
*   **The "Architectural" Hero:** Overlap a `display-lg` headline across a high-quality image container. Use `24` (6rem) padding to create an "open-air" feeling that signals luxury and space.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins (e.g., 8rem on the left, 4rem on the right) for headline sections to create a custom editorial feel.
*   **Do** use `primary-fixed-dim` (#edc06d) for subtle highlights in dark-mode environments.
*   **Do** prioritize vertical white space (`16` or `20` tokens) to allow content to breathe.

### Don't:
*   **Don't** use 100% opaque black (#000000). Use `on-surface` (#1c1b1b) for text to maintain a premium, \"ink-on-paper\" feel.
*   **Don't** use standard "Box Shadows." If a shadow is visible at first glance, it is too heavy.
*   **Don't** use default 1px dividers. If you feel the need to separate, use a background color shift or a `1px` height `surface-variant` block that spans only 50% of the container width.
*   **Don't** use fully rounded (pill) buttons for primary actions; stay within the `md` (0.375rem) to `lg` (0.5rem) range to maintain a structured, professional tone.
