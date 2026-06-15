"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AddressForm, AddressData, emptyAddress } from "@/components/store/checkout/address-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useShippingAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "@/lib/hooks/use-account"
import type { ShippingAddress } from "@/lib/types/account"
import { Plus, Pencil, Trash2, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type Mode = "list" | "add" | "edit"

export default function AddressesPage() {
  const { data: addresses = [], isLoading } = useShippingAddresses()
  const create = useCreateAddress()
  const update = useUpdateAddress()
  const del = useDeleteAddress()

  const [mode, setMode] = useState<Mode>("list")
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<AddressData>(emptyAddress)
  const [label, setLabel] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openAdd() {
    setForm(emptyAddress)
    setLabel("")
    setIsDefault(false)
    setErrors({})
    setEditId(null)
    setMode("add")
  }

  function openEdit(addr: ShippingAddress) {
    setForm({
      first_name: addr.first_name ?? "",
      last_name: addr.last_name ?? "",
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 ?? "",
      city: addr.city,
      state: addr.state ?? "",
      postal_code: addr.postal_code,
      country: addr.country,
      phone: addr.phone ?? "",
    })
    setLabel(addr.label ?? "")
    setIsDefault(addr.is_default ?? false)
    setErrors({})
    setEditId(addr.id)
    setMode("edit")
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.address_line1.trim()) errs.address_line1 = "Required"
    if (!form.city.trim()) errs.city = "Required"
    if (!form.postal_code.trim()) errs.postal_code = "Required"
    if (!form.country.trim()) errs.country = "Required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    const data = { ...form, label: label || null, is_default: isDefault }
    try {
      if (mode === "add") {
        await create.mutateAsync(data)
      } else if (editId) {
        await update.mutateAsync({ id: editId, ...data })
      }
      setMode("list")
    } catch {}
  }

  async function handleSetDefault(id: number) {
    await update.mutateAsync({ id, action: 'set_default' })
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this address?")) return
    await del.mutateAsync(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (mode === "add" || mode === "edit") {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setMode("list")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Addresses
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold">{mode === "add" ? "New address" : "Edit address"}</h1>
        </div>

        <div className="max-w-md space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Label (optional)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Home, Work, …"
              className="h-10"
            />
          </div>

          <AddressForm data={form} onChange={(d) => setForm((prev) => ({ ...prev, ...d }))} errors={errors} />

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded"
            />
            Set as default address
          </label>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={create.isPending || update.isPending}
              className="h-9"
            >
              {create.isPending || update.isPending ? "Saving…" : "Save address"}
            </Button>
            <Button variant="ghost" onClick={() => setMode("list")} className="h-9">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Addresses</h1>
        <Button onClick={openAdd} size="sm" className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
          No saved addresses yet.
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={cn(
                "rounded-xl border p-4 flex items-start justify-between gap-4",
                addr.is_default ? "border-primary/40 bg-primary/5" : "border-border"
              )}
            >
              <div className="space-y-0.5 text-sm">
                {addr.label && (
                  <p className="font-medium flex items-center gap-1.5">
                    {addr.label}
                    {addr.is_default && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary">
                        <BadgeCheck className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </p>
                )}
                {(addr.first_name || addr.last_name) && (
                  <p className="text-muted-foreground">{[addr.first_name, addr.last_name].filter(Boolean).join(" ")}</p>
                )}
                <p className="text-muted-foreground">{addr.address_line1}</p>
                {addr.address_line2 && <p className="text-muted-foreground">{addr.address_line2}</p>}
                <p className="text-muted-foreground">{[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}</p>
                <p className="text-muted-foreground">{addr.country}</p>
                {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!addr.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleSetDefault(addr.id)}
                  >
                    Set default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openEdit(addr)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(addr.id)}
                  disabled={del.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
