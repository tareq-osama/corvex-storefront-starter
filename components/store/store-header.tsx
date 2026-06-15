"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCartContext } from "./cart-context"
import { useSession, useLogout } from "@/lib/hooks/use-auth"
import { Search, ShoppingBag, Menu, X, User } from "lucide-react"

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store"

const NAV_ITEMS = [
  { title: "Home", href: "/" },
  { title: "Products", href: "/products" },
]

export function StoreHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { itemCount, openDrawer } = useCartContext()
  const { data: session } = useSession()
  const logout = useLogout()

  const member = session?.member ?? null

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setSearchOpen(false)
      setMobileMenuOpen(false)
    }
  }

  const handleSignOut = async () => {
    await logout.mutateAsync()
    setMobileMenuOpen(false)
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold">{SITE_NAME}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  isActive(item.href)
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(v => !v)}>
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={openDrawer}>
              <ShoppingBag className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-full h-4 min-w-[1rem] flex items-center justify-center px-1">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>

            {member ? (
              <>
                <Button variant="ghost" size="sm" className="h-8 text-sm hidden sm:inline-flex" asChild>
                  <Link href="/account" className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Account
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-sm hidden sm:inline-flex" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" className="h-8 text-sm hidden sm:inline-flex" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            )}

            <Button
              variant="ghost" size="icon" className="h-8 w-8 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="border-t border-border/40 py-3">
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
        )}

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border/40 py-3 space-y-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 text-sm rounded-md transition-colors",
                  isActive(item.href)
                    ? "text-foreground font-medium bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {item.title}
              </Link>
            ))}
            {member ? (
              <>
                <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">My Account</Link>
                <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 text-sm rounded-md text-destructive hover:bg-muted/30 transition-colors">Sign out</button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">Sign in</Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
