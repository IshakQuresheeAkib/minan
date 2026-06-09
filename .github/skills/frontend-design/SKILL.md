---
name: frontend-design
description: 'Create distinctive, production-grade frontend interfaces with high design quality. Use when building React components, pages, or layouts that need to avoid generic AI aesthetics.'
argument-hint: 'Describe the component to build and any specific aesthetic direction'
---

# Frontend Design & Aesthetic Generator

This skill guides the creation of distinctive, production-grade frontend React interfaces for the Concord Client project that avoid generic "AI slop" aesthetics. It ensures we implement real working code with exceptional attention to aesthetic details and creative choices using Tailwind CSS and React.

## When to Use
- Building new landing pages, dashboards, or complex React components.
- Styling or beautifying any web UI that needs to stand out.
- When you want a bold, non-generic, and highly polished UI design.

## Workflow Procedure

Follow these steps sequentially to generate the design:

### Phase 1: Design Thinking & Context
Before writing any code, analyze the user's request and write out a brief plan covering:
1. **Purpose**: What problem does this interface solve? Who uses it?
2. **Tone**: Pick an extreme aesthetic direction (e.g., brutally minimal, maximalist chaos, retro-futuristic, editorial/magazine, brutalist/raw, soft/pastel, industrial/utilitarian). Do not just default to standard corporate SaaS.
3. **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality.

### Phase 2: Frontend Aesthetics Planning
Define how you will achieve the tone using our tech stack (React + Tailwind CSS):
- **Typography**: Choose distinctive font pairings (e.g., a characterful display font with a refined body font). Avoid generic fonts like Arial and Inter. *Note: If new fonts are required, specify the Google Fonts import.*
- **Color & Theme**: Commit to a cohesive aesthetic. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. **Crucially:** Strictly use the colors and values defined in your existing `tailwind.config.js`. Do not use arbitrary hex values unless explicitly updating the tailwind config file to house those bold new colors.
- **Spatial Composition**: Plan unexpected layouts. Use asymmetry, overlaps, diagonal flows, or grid-breaking elements. Use Tailwind Grid/Flex to achieve generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere. Apply creative forms like CSS gradient meshes, noise textures, geometric patterns, layered transparencies (`bg-opacity-*`), dramatic shadows (`drop-shadow-2xl`), and decorative borders.

### Phase 3: Implementation
Implement the working React code (`.jsx`).
- **Motion**: Use Tailwind CSS built-in animations (`animate-pulse`, `animate-bounce`, custom keyframes) for normal, simple animations. If complex or orchestrated animations are required to achieve the design's high-impact moments (like staggered reveals), use Framer Motion (`<motion.div>`).
- **Production-Grade**: Ensure the code is functional, accessible, and responsive across breakpoints (`sm:`, `md:`, `lg:`).
- **Anti-Patterns to Avoid**: NEVER use generic AI-generated aesthetics (cliched purple gradients on white backgrounds, predictable component patterns, cookie-cutter cards). Vary between light and dark themes.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist designs need restraint, precision, and careful attention to spacing and typography. Elegance comes from executing the vision well.
