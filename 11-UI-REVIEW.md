# 11 UI Review

Date: 2026-04-18
Scope: `/sales/new`, workspace navigation, shared CTA/chip styling, login surface
Inputs: Playwright snapshots, `ui-ux-pro-max` design-system output, code grep for hardcoded blue accent classes

## Direction

Requested change: remove the blue background + white text CTA language that makes the product feel lightweight.

Applied direction for this pass:
- Primary actions shift from `blue/white` to `stone + amber`
- Navigation focus shifts from `blue` to `amber` for active states
- Selection controls use a shared premium control module with neutral action buttons and emerald selected states
- Blue should remain only as a controlled data accent until charts and overview surfaces are redesigned

`ui-ux-pro-max` suggested a conservative enterprise palette with blue + amber. Because the product owner explicitly rejected blue CTA blocks, this review adapts that recommendation to a `stone / amber / ivory` interaction palette and reserves blue for future data visualization only.

## Scorecard

| Pillar | Score | Notes |
| --- | --- | --- |
| Copywriting | 3/4 | Sales flow copy is now more specific, but global UI still mixes Korean task labels with English tokens like `Sales`, `Workspace`, `Customer`. |
| Visuals | 3/4 | The sales registration selection step is structurally stronger: 4:6 default, per-card `+/-` expansion, denser summaries, and cleaner row actions. Some secondary panels still compete visually with the main task. |
| Color | 2/4 | Core CTA and chip styles moved away from blue-on-white, but many overview and dashboard files still hardcode `bg-blue-*`, `text-blue-*`, and `border-blue-*`. |
| Typography | 3/4 | Hierarchy is clear and readable, but the product still lacks a deliberate premium type system beyond weight/size contrast. |
| Spacing | 3/4 | The rebuilt customer/inventory selection step is stable and proportionate. Older overview screens still use mixed spacing scales and arbitrary emphasis. |
| Experience Design | 3/4 | Filtering, empty states, collapse/expand states, and selection affordances are present. Legacy controls in other modules still need interaction polish and palette alignment. |

## Implemented In This Pass

- Rebuilt the existing-customer sales selection screen so the customer pane and inventory pane expand from their own `+/-` controls instead of using a global ratio switch.
- Added customer filters for name, carrier, and remaining retention days.
- Added a shared selection-control module so row actions and selected-state chips use one design language.
- Replaced the global blue CTA styling in shared button/chip primitives with a warmer premium palette.
- Updated the workspace navigation and login surface to remove blue-filled CTA blocks.

## Highest Priority Follow-Ups

1. Replace remaining hardcoded blue interaction classes in list and overview screens.
   Files with obvious residual blue CTA/selection patterns include:
   - `src/components/workspace/customers-overview.tsx`
   - `src/components/workspace/inventory-overview.tsx`
   - `src/components/workspace/receivables-overview.tsx`
   - `src/components/workspace/form-client-controls.tsx`
   - `src/components/workspace/sales-history-table.tsx`
   - `src/components/workspace/sales-launcher.tsx`
2. Move palette decisions into shared tokens/CSS variables so future pages do not reintroduce blue utility classes ad hoc.
3. Define a typography system for premium screens.
   - Headings: editorial/high-authority
   - Body: operational clarity
   - Data labels: restrained uppercase utility style

## Hardcoded Blue Audit

The following areas still contain visible blue accent logic and should be considered phase-2 cleanup:

- `src/components/workspace/form-client-controls.tsx`
- `src/components/workspace/customers-overview.tsx`
- `src/components/workspace/inventory-overview.tsx`
- `src/components/workspace/receivables-overview.tsx`
- `src/components/workspace/sales-history-table.tsx`
- `src/components/workspace/sales-launcher.tsx`
- `src/components/workspace/sales-support-panel.tsx`
- `src/components/dashboard/dashboard-detail-dialog.tsx`
- `src/components/dashboard/dashboard-filter-bar.tsx`
- `src/components/dashboard/dashboard-overview.tsx`
- `src/components/dashboard/dashboard-visuals.tsx`
- `src/app/reports/summary/page.tsx`

## Files Audited

- `src/components/workspace/sales-entry-basics-step.tsx`
- `src/components/workspace/selection-state-controls.tsx`
- `src/components/workspace/ui-classnames.ts`
- `src/components/workspace/workspace-primitives.tsx`
- `src/components/workspace/workspace-nav.tsx`
- `src/components/workspace/sales-entry-form.tsx`
- `src/components/login/login-panel.tsx`
- `src/app/(workspace)/sales/sales-page-data.ts`
- `src/components/workspace/sales-types.ts`

## Recommendation

Do not continue page-by-page blue replacement with isolated utility edits. The next design pass should:

1. Create shared semantic tokens for `primary`, `secondary`, `selected`, `data-accent`, `focus`, and `warning`.
2. Migrate list selections and dashboard cards onto those tokens.
3. Redesign charts and analytical surfaces last, after operational menus and forms are visually stable.
