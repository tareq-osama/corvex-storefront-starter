import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        badge: "text-muted-foreground hover:bg-muted hover:text-foreground ",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "bg-card text-card-foreground border border-border hover:bg-muted hover:text-foreground",
        secondary:
          "bg-transparent hover:bg-primary hover:text-primary-foreground bg-muted-foreground/10 text-foreground",
        ghost: "bg-muted-foreground/10 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40",

        link: "text-primary underline-offset-4 hover:underline",
        elevated: "bg-card text-card-foreground shadow-sm border border-border hover:bg-muted hover:text-foreground",
        light: "bg-muted text-foreground hover:bg-muted/80 border border-border/50",
      },
      size: {
        default: "h-10 px-4 py-2",
        badge: "h-7 px-3 py-1 text-xs",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
