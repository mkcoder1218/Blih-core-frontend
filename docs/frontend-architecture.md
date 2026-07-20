# Frontend architecture rules

## Module boundaries

- Keep new source files at or below 500 lines. Split by responsibility before adding more behavior.
- Put domain code under `src/features/<domain>`. Keep pages thin: route input, feature composition, loading, and error boundaries.
- Keep API access in domain API/hooks modules. UI components do not call Axios directly.
- Keep business calculations in pure functions. Reuse one implementation across every screen.
- Use barrel files only as public feature entry points. Internal modules import direct siblings.

## UI hierarchy

1. Use `components/ui` for shadcn primitives such as `Button`, `Card`, `Dialog`, and `Input`.
2. Use `components/ui/blih` for product patterns such as `PageHeader`, `StatCard`, `DataTable`, `FilterBar`, `StatusBadge`, and `EmptyState`.
3. Put domain-specific composition beside its feature. Extract it to `components/ui/blih` only after a second real use appears.

Do not create one-off button, card, modal, table, badge, loading, or empty-state styling when an existing primitive covers it. Extend the primitive with a named variant when the same visual meaning recurs.

## Visual language

- Use theme tokens from `src/styles/theme.css`; avoid new hard-coded brand colors.
- Use sentence case for labels and action text. Keep one action name through button, dialog, and toast.
- Use the existing spacing/radius scale. Default surfaces use `Card`; default actions use `Button`.
- Every interactive element needs visible keyboard focus. Respect reduced motion.
- Empty and error states tell users what happened and what action is available.

## Required checks

- `npm run format:check` for enforcement files; use `npm run format -- <paths>` on touched source
- `npm run lint`
- `npm run typecheck`
- `npm run check:modules`
- `npm run build`

Run `npm run check` before review. Legacy oversized files have explicit ceilings; those ceilings may only move downward. Whole-repository formatting remains migration work and must not be mixed into unrelated feature changes.
