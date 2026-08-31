---
version: alpha
name: "MINAN"
description: "A fashion-commerce storefront that pairs quiet fabric-like surfaces with an amber dispatch marker for high-confidence shopping and delivery tasks."
colors:
  background: "#fcf9f8"
  foreground: "#262626"
  primary: "#f5b836"
  secondary: "#fed65b"
  destructive: "#de0c09"
  dark-background: "#1b1c1c"
  dark-foreground: "#f3f0f0"
  dark-primary: "#ffb597"
typography:
  display:
    fontFamily: "Manrope, Arial, Helvetica, sans-serif"
  sans:
    fontFamily: "Plus Jakarta Sans, Arial, Helvetica, sans-serif"
rounded:
  DEFAULT: "0.75rem"
  sm: "0.5rem"
  md: "0.625rem"
  lg: "0.75rem"
  xl: "1rem"
spacing:
  page-max: "72rem"
  page-padding-mobile: "1rem"
  page-padding-desktop: "2rem"
components:
  button:
    radius: "9999px"
    focusRing: "3px primary at 50%"
  input:
    radius: "0.625rem"
    focusRing: "3px primary at 50%"
  card:
    radius: "1rem"
    border: "secondary"
  status-timeline:
    marker: "primary current, foreground completed, secondary upcoming"
---

# MINAN Design System

## Overview

### Creative North Star

The storefront should feel like a well-made dark garment label paired with an amber dispatch sticker: calm, tactile, and direct at the moment a shopper needs certainty. The order-tracking rail is the expression point; the rest of the account journey remains quiet and utility-led.

### Product context and register

- **Audience and primary job:** Bangladesh-based fashion shoppers choose garments, complete checkout, and check the state of an individual order on a phone.
- **Target market(s) and evidence:** Bangladesh, with Sylhet-specific delivery zones in the Order contract and Bangla helper copy in customer tracking.
- **Locale(s) and language policy:** English is the interface language; customer tracking pairs fixed English labels with approved Bangla helper text. Numbers use `en-BD`; dates are displayed as English calendar dates without changing date-only server values.
- **Usage scene:** Mobile-first and often time-sensitive after checkout; a narrow viewport must keep the order state, email-code action, ETA, and courier code immediately legible.
- **Register:** Hybrid. Catalog and navigation carry the fashion brand; login, order access, and tracking use product-task clarity.
- **Memorable signature:** A single vertical delivery rail with amber current marker, charcoal completed markers, and soft yellow future markers.
- **Restraint:** Forms, account actions, totals, and courier details use ordinary labels, native semantic controls, and established shared primitives.
- **Anti-references:** Avoid generic blue logistics dashboards, glassmorphism, emoji status indicators, and decorative gradients that compete with order state.
- **Token ownership/runtime mapping:** `apps/web/src/app/globals.css` is the runtime source for color and radius variables; `apps/web/src/app/layout.tsx` owns the loaded Manrope and Plus Jakarta Sans families. This file documents those existing values and does not generate token artifacts.

## Colors

`background` and `foreground` form the neutral fabric-like base. `primary` is reserved for the key customer action, current tracking state, and carefully bounded emphasis; `secondary` provides visible borders and supporting states. `destructive` appears only for form and request failures. Dark surfaces retain the same hierarchy with the declared dark tokens; text and border changes must preserve contrast.

## Typography

Manrope is the display face for page and section headings; Plus Jakarta Sans is the body and control face. Use sentence case and direct action labels. Customer tracking must keep English status labels and their approved Bangla helper directly together; no untranslated arbitrary system copy is added. Identifiers, dates, and courier codes use tabular-friendly body text with wrapping instead of clipping.

## Layout

Public pages use a `72rem` maximum content width, `1rem` mobile padding, and expand to `2rem` on larger screens. Tracking starts as a single column and introduces paired information cards only when space permits. The shared mobile bottom navigation owns the lower safe area; pages retain its established bottom padding. Loading, error, and success surfaces reserve a card-sized region to avoid reflow.

## Elevation & Depth

Borders express normal grouping. A modest shadow is reserved for the primary dark tracking state and existing floating navigation, never used as decoration on every section. Overlays use the shared dialog/sheet primitives. Static surfaces stay opaque so text remains readable in both themes.

## Shapes

Inputs use the `md` rounded language, task panels use `xl`, and main buttons are fully pill-shaped. Status dots are circular because they represent a sequence; they are never the only indicator of state. Dividers use the secondary border tone.

## Components

### Foundational visual states

Shared buttons, inputs, badges, skeletons, and Sonner notifications are canonical. Enabled controls show hover and visible focus. Busy buttons retain their footprint and show a spinner; failures remain inline near the correction path. The shimmer skeleton is disabled under reduced motion.

### Buttons and actions

Use a charcoal primary button for the safe, dominant action and the existing secondary outline treatment for supporting navigation. Button text names the outcome, such as “Email me a code” or “Save this order.” Icons come from Lucide and accompany, never replace, important labels.

### Navigation and data display

The header may add customer task links; the shared bottom navigation remains limited to its established destination set. Order tracking uses a semantic ordered list, badges for current state, and wrapping identifiers. It must not reuse admin tables or serializers.

### Forms and overlays

Forms use `noValidate`, labels, inline errors, correct autocomplete values, and typed inputs. Passwords are masked by default with a keyboard-accessible reveal control. Customer proof and account identity remain separate flows; email and OTP values are never placed in routes or persistent storage.

### Iconography

Lucide is the common icon family. Use 16–20px icons alongside labels and 24px only for standalone section markers. Status meaning always includes visible text.

### Motion

Motion is functional and brief: 150–300ms hover color changes and existing loading spinners/skeletons. No timeline animation is required. The global reduced-motion rule removes nonessential animation.

### Content and data visualization

Copy is calm and specific. An email-code request always explains that it can open only one order; account-saving copy explicitly says it attaches only the verified order. Currency is `Tk` with `en-BD` grouping. The timeline is the data visualization and provides text equivalents for every marker.

## Do's and Don'ts

- **Do:** Use the amber marker once to orient a shopper to the current delivery update.
- **Do:** Preserve existing runtime colors, fonts, radii, and shared control behavior when extending customer pages.
- **Don't:** Present a generic account dashboard or an unbounded order-history table without an API contract.
- **Don't:** Treat an email address, query parameter, or browser UI state as authorization to show an order.
