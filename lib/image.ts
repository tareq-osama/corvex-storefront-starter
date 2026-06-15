/**
 * Resolves an R2/proxied image key or path to an absolute URL on the
 * Corvex backend's `/v/` image proxy (R2 is not publicly accessible,
 * and this starter has no image proxy route of its own).
 *
 * Accepts:
 * - already-proxied paths (`/v/...`, `/img/...`) -> prefixed with the backend origin
 * - raw R2 URLs (`*.r2.dev`, `*.r2.cloudflarestorage.com`) -> converted to `/v/{key}`
 * - absolute http(s) URLs from other hosts -> returned as-is
 */
export function toProxiedImageSrc(url: string | null | undefined): string | null {
  if (!url) return null

  const apiUrl = (process.env.NEXT_PUBLIC_CORVEX_API_URL ?? "").replace(/\/$/, "")

  if (url.startsWith("/v/") || url.startsWith("/img/")) {
    return apiUrl ? `${apiUrl}${url}` : url
  }

  try {
    const urlObj = new URL(url)
    const host = urlObj.hostname
    const isR2Host = host.endsWith(".r2.dev") || host.endsWith("r2.cloudflarestorage.com")
    if (!isR2Host) return url

    const segments = urlObj.pathname.replace(/^\/+/, "").split("/")
    if (host.endsWith(".r2.dev") && segments.length > 0) {
      segments.shift()
    }
    const fileKey = segments.join("/")
    if (!fileKey) return url

    return apiUrl ? `${apiUrl}/v/${fileKey}` : `/v/${fileKey}`
  } catch {
    return url
  }
}
