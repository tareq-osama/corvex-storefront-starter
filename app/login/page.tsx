"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useLogin } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store"

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const nextParam = searchParams.get("next")
  const next = nextParam ?? "/"

  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: boolean; password?: boolean }>({})

  const login = useLogin()

  const clearErrors = () => {
    setError("")
    setFieldErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    try {
      await login.mutateAsync({ email: email.trim().toLowerCase(), password })
      router.push(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again."
      if (message.toLowerCase().includes("invalid email or password")) {
        setError("Incorrect email or password.")
        setFieldErrors({ email: true, password: true })
      } else {
        setError(message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm">
            {SITE_NAME[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to {SITE_NAME}
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <div className="relative">
                <Mail className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                  fieldErrors.email ? "text-destructive" : "text-muted-foreground"
                )} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearErrors() }}
                  placeholder="you@example.com"
                  className={cn(
                    "pl-9 h-11",
                    fieldErrors.email && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  required
                  disabled={login.isPending}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <div className="relative">
                <Lock className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                  fieldErrors.password ? "text-destructive" : "text-muted-foreground"
                )} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearErrors() }}
                  placeholder="Your password"
                  className={cn(
                    "pl-9 pr-10 h-11",
                    fieldErrors.password && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  required
                  disabled={login.isPending}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                <svg className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={login.isPending || !email || !password}>
              {login.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-[11px] text-muted-foreground">
                New here?
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-10" asChild>
            <Link href={`/signup${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}>
              Create an account
            </Link>
          </Button>
        </div>
      </div>

      <p className="mt-10 text-[10px] text-muted-foreground/40">Powered by Corvex CMS</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
