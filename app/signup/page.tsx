"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowRight, Mail, User, Lock, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRegister } from "@/lib/hooks/use-auth"
import { cn } from "@/lib/utils"

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store"

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ]
  const passed = checks.filter(Boolean).length
  const colors = ["bg-destructive", "bg-orange-400", "bg-yellow-400", "bg-green-500"]
  const labels = ["", "Weak", "Fair", "Strong"]

  if (!password) return null

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < passed ? colors[passed] : "bg-border"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[10px]", passed < 2 ? "text-muted-foreground" : passed === 2 ? "text-yellow-500" : "text-green-600 dark:text-green-400")}>
        {labels[passed] && `Password strength: ${labels[passed]}`}
      </p>
    </div>
  )
}

function SignupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const nextParam = searchParams.get("next")
  const next = nextParam ?? "/"

  const [name, setName] = useState("")
  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: boolean; password?: boolean }>({})

  const register = useRegister()

  const clearErrors = () => {
    setError("")
    setFieldErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      setFieldErrors({ password: true })
      return
    }

    try {
      await register.mutateAsync({ email: email.trim().toLowerCase(), name: name.trim(), password })
      router.push(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again."
      if (message.toLowerCase().includes("already exists")) {
        setError("An account with this email already exists. Please sign in instead.")
        setFieldErrors({ email: true })
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
            <h1 className="text-xl font-semibold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Join {SITE_NAME}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Name <span className="text-muted-foreground">(optional)</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="pl-9 h-11"
                  disabled={register.isPending}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
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
                  disabled={register.isPending}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">
                Password <span className="text-destructive">*</span>
              </Label>
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
                  placeholder="Min. 8 characters"
                  className={cn(
                    "pl-9 pr-10 h-11",
                    fieldErrors.password && "border-destructive focus-visible:ring-destructive/30"
                  )}
                  required
                  disabled={register.isPending}
                  autoComplete="new-password"
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
              <PasswordStrength password={password} />
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

            <Button type="submit" className="w-full h-11" disabled={register.isPending || !email || !password}>
              {register.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create account
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
                Already have an account?
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-10" asChild>
            <Link href={`/login${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}>
              Sign in instead
            </Link>
          </Button>
        </div>
      </div>

      <p className="mt-10 text-[10px] text-muted-foreground/40">Powered by Corvex CMS</p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  )
}
