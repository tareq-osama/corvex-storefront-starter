"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-account"
import { Check } from "lucide-react"

export default function AccountProfilePage() {
  const { data: member, isLoading } = useProfile()
  const update = useUpdateProfile()
  const [saved, setSaved] = useState(false)

  const initials = (() => {
    const name = member?.full_name ?? member?.email ?? ""
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  })()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const val = (e.currentTarget as HTMLFormElement).elements.namedItem("full_name") as HTMLInputElement
    try {
      await update.mutateAsync(val.value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="h-20 w-20 bg-muted animate-pulse rounded-full" />
        <div className="space-y-3 max-w-md">
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-muted/30 border border-border max-w-md">
        <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground font-semibold text-lg flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium">{member?.full_name || member?.email?.split("@")[0] || "Member"}</p>
          <p className="text-xs text-muted-foreground">{member?.email}</p>
          {member?.created_at && (
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              Member since {new Date(member.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium">
            Email address
          </Label>
          <Input
            id="email"
            value={member?.email ?? ""}
            disabled
            className="h-10 bg-muted/50"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-xs font-medium">
            Full name
          </Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={member?.full_name ?? ""}
            placeholder="Jane Smith"
            className="h-10"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={update.isPending} className="h-9">
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" />
              Saved!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
