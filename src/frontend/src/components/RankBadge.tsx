interface RankBadgeProps {
  rank: string;
  size?: "xs" | "sm";
}

const RANK_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  Admin: {
    label: "ADMIN",
    color: "oklch(0.85 0.19 80)",
    bg: "oklch(0.85 0.19 80 / 0.1)",
    border: "oklch(0.85 0.19 80 / 0.4)",
    glow: "0 0 8px oklch(0.85 0.19 80 / 0.35)",
  },
  Employee: {
    label: "EMPLOYEE",
    color: "oklch(0.82 0.2 196)",
    bg: "oklch(0.82 0.2 196 / 0.1)",
    border: "oklch(0.82 0.2 196 / 0.35)",
    glow: "0 0 6px oklch(0.82 0.2 196 / 0.25)",
  },
  Friend: {
    label: "FRIEND",
    color: "oklch(0.65 0.05 230)",
    bg: "oklch(0.65 0.05 230 / 0.08)",
    border: "oklch(0.65 0.05 230 / 0.25)",
    glow: "none",
  },
};

export function RankBadge({ rank, size = "xs" }: RankBadgeProps) {
  const cfg = RANK_CONFIG[rank] ?? RANK_CONFIG.Friend;
  const isXs = size === "xs";

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold tracking-widest rounded-sm flex-shrink-0 ${
        isXs ? "text-[9px] px-1 py-px" : "text-[10px] px-1.5 py-0.5"
      }`}
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.glow,
        letterSpacing: "0.08em",
      }}
    >
      {cfg.label}
    </span>
  );
}
