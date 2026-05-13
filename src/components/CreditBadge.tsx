import { Coins } from "lucide-react";

type CreditBadgeProps = {
  credits: number;
  label?: string;
};

export function CreditBadge({ credits, label = "Credits" }: CreditBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-mint-500 bg-mint-50 px-3 py-2 text-mint-600">
      <Coins className="h-5 w-5" aria-hidden="true" />
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-lg font-bold tabular-nums">{credits.toLocaleString()}</span>
    </div>
  );
}
