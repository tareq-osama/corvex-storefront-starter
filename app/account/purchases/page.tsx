"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePurchases } from "@/lib/hooks/use-account"
import { toProxiedImageSrc } from "@/lib/image"
import type { Purchase } from "@/lib/types/account"
import { Download, FileText, ChevronDown, ChevronUp, Lock } from "lucide-react"

function formatBytes(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  const [expanded, setExpanded] = useState(false)
  const hasFiles = purchase.files.length > 0
  const thumbnailUrl = toProxiedImageSrc(purchase.product?.thumbnail_url)

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-4 px-4 py-4">
        {/* Thumbnail */}
        <div className="h-14 w-14 shrink-0 rounded-lg bg-muted overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={purchase.product?.name ?? ""}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
              <Lock className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {purchase.product?.name ?? `Product #${purchase.product_id}`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Purchased{" "}
            {new Date(purchase.purchased_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            {purchase.files.length > 0 && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                · {purchase.files.length} file{purchase.files.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-2">
          {purchase.product?.handle && (
            <Button variant="ghost" size="sm" className="h-8 hidden sm:flex" asChild>
              <Link href={`/products/${purchase.product.handle}`}>View</Link>
            </Button>
          )}

          {hasFiles && purchase.files.length === 1 ? (
            <Button size="sm" className="h-8 gap-1.5" asChild>
              <a href={purchase.files[0].download_url} download={purchase.files[0].name}>
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </Button>
          ) : hasFiles ? (
            <Button
              size="sm"
              variant="default"
              className="h-8 gap-1.5"
              onClick={() => setExpanded((v) => !v)}
            >
              <Download className="h-3.5 w-3.5" />
              {purchase.files.length} files
              {expanded ? (
                <ChevronUp className="h-3 w-3 ml-0.5" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-0.5" />
              )}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">No files</span>
          )}
        </div>
      </div>

      {/* Expanded file list */}
      {expanded && hasFiles && (
        <div className="px-4 pb-4 space-y-1.5">
          {purchase.files.map((file, i) => (
            <a
              key={i}
              href={file.download_url}
              download={file.name}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 hover:bg-muted/60 transition-colors group"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{file.name}</p>
                {file.file_size && (
                  <p className="text-[10px] text-muted-foreground">{formatBytes(file.file_size)}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Download className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-primary font-medium group-hover:underline">Download</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PurchasesPage() {
  const { data: purchases = [], isLoading } = usePurchases()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 border border-border rounded-xl p-4">
            <div className="h-14 w-14 bg-muted animate-pulse rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Purchases & Downloads</h1>

      {purchases.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-xl space-y-3">
          <Download className="h-10 w-10 mx-auto text-muted-foreground/20" />
          <p>No digital purchases yet.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          {purchases.map((purchase) => (
            <PurchaseRow key={purchase.id} purchase={purchase} />
          ))}
        </div>
      )}
    </div>
  )
}
