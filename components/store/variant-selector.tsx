"use client"

import { useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { ProductVariant, ProductOptionDefinition } from "@/lib/types/store"

interface VariantSelectorProps {
  optionDefinitions: ProductOptionDefinition[]
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onSelectVariant: (variant: ProductVariant | null) => void
}

export function VariantSelector({
  optionDefinitions,
  variants,
  selectedVariant,
  onSelectVariant,
}: VariantSelectorProps) {
  // Track selected value for each option axis
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (selectedVariant?.options) {
      return { ...selectedVariant.options }
    }
    // Default to the first variant's options
    if (variants.length > 0 && variants[0].options) {
      return { ...variants[0].options }
    }
    return {}
  })

  // Find variant matching current selections
  const findMatchingVariant = useCallback(
    (options: Record<string, string>) => {
      return variants.find(v => {
        const vOptions = v.options || {}
        return optionDefinitions.every(
          def => vOptions[def.name] === options[def.name]
        )
      }) ?? null
    },
    [variants, optionDefinitions]
  )

  // Check if a specific option value is available given other selections
  const isValueAvailable = useCallback(
    (optionName: string, value: string) => {
      const testOptions = { ...selectedOptions, [optionName]: value }
      return variants.some(v => {
        const vOptions = v.options || {}
        return Object.entries(testOptions).every(
          ([key, val]) => vOptions[key] === val
        ) && v.is_active && (v.inventory_quantity === null || v.inventory_quantity > 0)
      })
    },
    [selectedOptions, variants]
  )

  const handleOptionSelect = useCallback(
    (optionName: string, value: string) => {
      const newOptions = { ...selectedOptions, [optionName]: value }
      setSelectedOptions(newOptions)
      const variant = findMatchingVariant(newOptions)
      onSelectVariant(variant)
    },
    [selectedOptions, findMatchingVariant, onSelectVariant]
  )

  // Stock info for selected variant
  const stockInfo = useMemo(() => {
    if (!selectedVariant) return null
    if (selectedVariant.inventory_quantity === null) return null
    if (selectedVariant.inventory_quantity <= 0) return { text: "Out of stock", color: "text-destructive" }
    if (selectedVariant.inventory_quantity <= 5) return { text: `Only ${selectedVariant.inventory_quantity} left`, color: "text-amber-600 dark:text-amber-400" }
    return { text: "In stock", color: "text-green-600 dark:text-green-400" }
  }, [selectedVariant])

  if (optionDefinitions.length === 0) return null

  return (
    <div className="space-y-4">
      {optionDefinitions.map(def => (
        <div key={def.id}>
          <label className="text-sm font-medium mb-2 block">
            {def.name}
            {selectedOptions[def.name] && (
              <span className="font-normal text-muted-foreground ml-1.5">
                — {selectedOptions[def.name]}
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {def.values.map(value => {
              const isSelected = selectedOptions[def.name] === value
              const available = isValueAvailable(def.name, value)

              return (
                <button
                  key={value}
                  onClick={() => handleOptionSelect(def.name, value)}
                  disabled={!available}
                  className={cn(
                    "px-3 py-1.5 text-sm border rounded-md transition-all",
                    isSelected
                      ? "border-foreground bg-foreground text-background font-medium"
                      : available
                        ? "border-border hover:border-foreground/50"
                        : "border-border/40 text-muted-foreground/40 cursor-not-allowed line-through"
                  )}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {stockInfo && (
        <p className={cn("text-xs", stockInfo.color)}>
          {stockInfo.text}
        </p>
      )}
    </div>
  )
}
