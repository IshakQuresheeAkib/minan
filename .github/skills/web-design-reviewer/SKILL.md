---
name: web-design-reviewer
description: 'Review frontend UI/UX design, layout, accessibility, and Tailwind CSS implementation. Use when auditing components, pages, or entire views for design consistency and responsiveness.'
argument-hint: 'Provide the file path or component name to review'
---

# Web Design Reviewer

This skill guides the agent through a multi-step workflow to audit and review web design files (React components, pages, CSS) for consistency, usability, responsiveness, and clean code using Tailwind CSS and Ant Design conventions in the project.

## When to Use
- You want to review a new or edited React component for UI/UX best practices.
- You need a design and accessibility audit of a specific page layout.
- You are trying to standardize Tailwind classes or ensure responsiveness across all screens.

## Workflow Procedure

Follow these steps sequentially when invoked to review a design:

### Phase 1: Context Gathering
1. **Analyze the Target Component**: Read the provided file or context. Understand its role (is it a high-level Page, a reusable Component, or a Layout?).
2. **Review Configuration & Dependencies**: explicitly use the `read_file` tool to load the `tailwind.config.js` file to understand the project's custom color palette, spacing, and font configurations. Note any UI libraries in use (e.g., `antd`).

### Phase 2: Design & Code Audit
Evaluate the target file against the following design pillars:

1. **Layout & Spacing Structure**
   - Check alignment and consistency of margins/padding. Prefer consistent spacing scales (`m-2`, `p-4`, `gap-6`).
   - Verify proper use of Flexbox/CSS Grid for layout containers.
   - Look for proper semantic HTML structure (`<header>`, `<section>`, `<article>`, `<main>`).

2. **Responsiveness**
   - Check if the layout adapts to mobile, tablet, and desktop using Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
   - Flag any hardcoded sizes (e.g., `w-[500px]`) that might break on smaller mobile screens.

3. **Typography & Color Consistency**
   - Check text contrast.
   - Verify usage of theme colors and standard text sizes (`text-sm`, `text-lg`, `text-gray-700`).
   - Ensure interactive states (`hover:`, `active:`) are present for user feedback.

4. **Accessibility (a11y)**
   - Check that interactive elements (buttons, links) have detectable focus states (`focus:ring`, `focus:outline`).
   - Look for missing `aria-labels`, missing `alt` tags on images, or `role` attributes on interactive non-standard elements.

5. **Code Quality**
   - Eliminate duplicated CSS or redundant Tailwind classes.
   - Identify overly nested UI markup and suggest splitting into smaller sub-components if it exceeds reasonable UI complexity.

### Phase 3: Reporting & Suggestions
Present the outcome clearly to the user:
1. **Summary**: Brief overview of the current design state.
2. **Critical Issues**: Things that break the UI or fail accessibility constraints.
3. **Enhancement Recommendations**: Concrete, actionable improvements.
4. **Targeted Refactors**: Provide the refactored code block(s) showing the improvements. Provide them as markdown code blocks so the user can review them manually. Do not apply the changes automatically.

## Instructions for the Agent
- Do NOT rewrite logic strictly unrelated to design/styling unless absolutely necessary.
- Empathize with the user: be constructive, highlight what looks good, and then provide clear critiques.
- If no component or file is specified by the user upon invocation, ask them to identify what needs reviewing before starting the audit.
