"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface AddressData {
  first_name: string
  last_name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
}

export const emptyAddress: AddressData = {
  first_name: "",
  last_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
  phone: "",
}

interface AddressFormProps {
  data: AddressData
  onChange: (data: Partial<AddressData>) => void
  errors?: Record<string, string>
}

export function AddressForm({ data, onChange, errors = {} }: AddressFormProps) {
  const field = (key: keyof AddressData, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        value={data[key]}
        onChange={(e) => onChange({ [key]: e.target.value })}
        className={errors[key] ? "border-destructive h-10" : "h-10"}
        {...props}
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {field("first_name", "First name", { placeholder: "Jane", autoComplete: "given-name" })}
        {field("last_name", "Last name", { placeholder: "Smith", autoComplete: "family-name" })}
      </div>
      {field("address_line1", "Address *", { placeholder: "123 Main St", required: true, autoComplete: "address-line1" })}
      {field("address_line2", "Apartment, suite, etc.", { placeholder: "Apt 4B", autoComplete: "address-line2" })}
      <div className="grid grid-cols-2 gap-3">
        {field("city", "City *", { placeholder: "New York", required: true, autoComplete: "address-level2" })}
        {field("state", "State / Province", { placeholder: "NY", autoComplete: "address-level1" })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {field("postal_code", "Postal code *", { placeholder: "10001", required: true, autoComplete: "postal-code" })}
        {field("country", "Country *", { placeholder: "US", required: true, autoComplete: "country" })}
      </div>
      {field("phone", "Phone (optional)", { placeholder: "+1 555 000 0000", type: "tel", autoComplete: "tel" })}
    </div>
  )
}
