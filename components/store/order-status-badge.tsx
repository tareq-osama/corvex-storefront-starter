import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped:    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled:  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  refunded:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

const PAYMENT_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

export function OrderStatusBadge({ status, type = "order" }: { status: string; type?: "order" | "payment" }) {
  const styles = type === "payment" ? PAYMENT_STYLES : STATUS_STYLES
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide",
      styles[status] ?? "bg-muted text-muted-foreground"
    )}>
      {status}
    </span>
  )
}
