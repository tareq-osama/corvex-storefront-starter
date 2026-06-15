"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useSession, useLogout } from "@/lib/hooks/use-auth"
import { User, MapPin, ShoppingBag, Download, LogOut } from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: "Profile", href: "/account", icon: User },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Orders", href: "/account/orders", icon: ShoppingBag },
  { label: "Purchases", href: "/account/purchases", icon: Download },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data, isLoading } = useSession()
  const logout = useLogout()

  const member = data?.member ?? null

  useEffect(() => {
    if (!isLoading && !member) {
      router.replace("/login?next=/account")
    }
  }, [isLoading, member, router])

  const handleSignOut = async () => {
    await logout.mutateAsync()
    router.push("/")
    router.refresh()
  }

  if (isLoading || !member) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const name = member.full_name || member.name || member.email.split("@")[0]
  const initials = (() => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  })()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-foreground">Account</span>
      </nav>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden sm:block">
          {/* User info */}
          <div className="flex items-center gap-2.5 px-3 py-3 mb-3 rounded-xl bg-muted/40">
            <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
            </div>
          </div>

          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/account" && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left text-muted-foreground hover:text-destructive hover:bg-muted mt-2"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </nav>
        </aside>

        {/* Mobile tab nav */}
        <div className="sm:hidden w-full">
          <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-border">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/account" && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
