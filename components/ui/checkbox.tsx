"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"
import { cn } from "cn"

function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer inline-flex size-4 shrink-0 cursor-pointer items-center justify-center align-middle rounded-[4px] border border-white/40 bg-[#102019] text-emerald-950 shadow-xs outline-none transition-colors focus-visible:border-emerald-400 focus-visible:ring-3 focus-visible:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-emerald-500 data-checked:bg-emerald-500 data-indeterminate:border-emerald-500 data-indeterminate:bg-emerald-500",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
