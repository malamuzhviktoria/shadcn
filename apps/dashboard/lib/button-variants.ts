// Shared secondary (outline) button class strings for the dashboard.
// Used as the canonical reference for the border + subtle-background pattern.
// bg-muted/50 gives a subtle neutral surface in light mode while keeping
// hover:bg-accent visibly stronger; dark mode inherits naturally from --muted.

export const outlineBtnCls =
  "inline-flex items-center gap-1.5 rounded-md border border-input bg-muted/50 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"

export const outlineBtnSmCls =
  "inline-flex items-center gap-1.5 rounded-md border border-input bg-muted/50 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"

export const outlineIconBtnCls =
  "flex items-center justify-center rounded-md border border-input bg-muted/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
