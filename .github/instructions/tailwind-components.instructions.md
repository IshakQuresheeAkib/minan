---
description: 'Enforce usage of custom Tailwind theme values and project styling conventions when generating or modifying React components.'
applyTo: "**/*.tsx"
---

# Tailwind CSS & Theming Guidelines

When generating or modifying React components in this project, you MUST adhere to the following Tailwind CSS styling rules.

## 1. Strictly Use Tailwind v4 Theme Values
- Always check what colors, typography, or spacing scales are defined in the project's configuration (Tailwind v4).
- Do NOT use arbitrary default values like `w-[124px]` or `text-[15px]` unless explicitly requested by the user or absolutely necessary. Rely on the defined Tailwind intervals.
- Do NOT use arbitrary CSS-in-JS. Only Tailwind utility classes are allowed.

## 2. Layout & Responsiveness
- Ensure all layouts are responsive by default. Start with a mobile-first approach, and use breakpoints (`sm:`, `md:`, `lg:`, `xl:`) appropriately.
- Prefer CSS grid (`grid`, `grid-cols-N`) and Flexbox (`flex`) for layout structuring instead of custom margins.

## 3. UI Library Integration (shadcn/ui)
- We use `shadcn/ui`. Allow shadcn/ui to manage the micro-level component styling.
- Do NOT manually edit generated files within `components/ui/`.

## 4. Semantic Tags (Images & Links)
- Always use `<Image>` from `next/image` with Cloudinary URLs. NEVER use raw `<img>` tags or local image files.
- Always use `<Link>` from `next/link` for all internal navigation, NEVER `<a>` tags.

## 5. Code Cleanliness
- Avoid long, sprawling `className` strings. If a component has an excessively long class list, consider extracting reusable parts or maintaining readability.
- Prevent duplicated utility classes (e.g., `flex flex-col flex-row`).