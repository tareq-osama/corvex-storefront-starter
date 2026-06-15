"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, useLogout } from "@/lib/hooks/use-auth"

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store"

export function StoreFooter() {
  const router = useRouter()
  const { data: session } = useSession()
  const logout = useLogout()
  const member = session?.member ?? null

  const handleSignOut = async () => {
    await logout.mutateAsync()
    router.push("/")
    router.refresh()
  }

  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-sm font-semibold">{SITE_NAME}</p>
          </div>

          {/* Shop */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Shop</p>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Account
            </p>
            <ul className="space-y-2">
              {member ? (
                <>
                  <li>
                    <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      My Account
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleSignOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Sign out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Create Account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 text-center">
          <p className="text-[11px] text-muted-foreground/50">
            &copy; {new Date().getFullYear()} {SITE_NAME}. Powered by Corvex CMS
          </p>
        </div>
      </div>
    </footer>
  )
}
