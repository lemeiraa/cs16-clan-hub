import { Shield, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STYLES: Record<string, string> = {
  admin:
    "bg-red-500/15 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse",
  fundador:
    "bg-purple-500/15 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.7)] animate-pulse",
  vip:
    "bg-yellow-400/15 text-yellow-300 border border-yellow-400/40 shadow-[0_0_12px_rgba(250,204,21,0.7)] animate-pulse",
  staff:
    "bg-sky-500/15 text-sky-300 border border-sky-500/40",
  membro:
    "bg-secondary text-secondary-foreground border border-border",
};

const PRIORITY = ["fundador", "admin", "staff", "vip", "membro"];

export function pickPrimaryRole(roles: string[]): string | null {
  for (const r of PRIORITY) if (roles.includes(r)) return r;
  return roles[0] ?? null;
}

export function RoleBadge({
  role,
  size = "sm",
  showLabel = true,
}: {
  role: string;
  size?: "xs" | "sm";
  showLabel?: boolean;
}) {
  const cls = STYLES[role] ?? "bg-accent/15 text-accent border border-accent/30";
  const Icon = role === "admin" || role === "fundador" ? ShieldCheck : Shield;
  const sizeCls =
    size === "xs"
      ? "px-1.5 py-0.5 text-[9px]"
      : "px-2.5 py-1 text-[10px]";
  const iconCls = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={`rounded-full uppercase tracking-wider font-bold inline-flex items-center gap-1 ${sizeCls} ${cls}`}
    >
      <Icon className={iconCls} />
      {showLabel && role}
    </span>
  );
}
