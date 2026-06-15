"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="bottom-right"
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-foreground/60",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:border-success group-[.toast]:bg-success/10 group-[.toast]:text-success-foreground",
          error: "group-[.toast]:border-destructive group-[.toast]:bg-destructive/10 group-[.toast]:text-destructive-foreground",
          warning: "group-[.toast]:border-warning group-[.toast]:bg-warning/10 group-[.toast]:text-warning-foreground",
          info: "group-[.toast]:border-info group-[.toast]:bg-info/10 group-[.toast]:text-info-foreground",
        },
      }}
    />
  )
}
