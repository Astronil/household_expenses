"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ExpenseCategory, ExpenseSubcategory } from "@/types"

type Props = {
  categories: ExpenseCategory[]
  subcategoriesForCategory: ExpenseSubcategory[]
  categoryId: string
  subcategoryId: string
  onCategoryChange: (categoryId: string) => void
  onSubcategoryChange: (subcategoryId: string) => void
  disabled?: boolean
  idPrefix?: string
}

export function CategorySubcategoryFields({
  categories,
  subcategoriesForCategory,
  categoryId,
  subcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  disabled,
  idPrefix = "cat",
}: Props) {
  const p = idPrefix

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${p}-category`}>Category (optional)</Label>
        <Select
          value={categoryId || "__none__"}
          onValueChange={(v) => {
            onCategoryChange(v === "__none__" ? "" : v)
            onSubcategoryChange("")
          }}
          disabled={disabled}
        >
          <SelectTrigger id={`${p}-category`} className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${p}-subcategory`}>Subcategory (optional)</Label>
        <Select
          value={subcategoryId || "__none__"}
          onValueChange={(v) => onSubcategoryChange(v === "__none__" ? "" : v)}
          disabled={disabled || !categoryId}
        >
          <SelectTrigger id={`${p}-subcategory`} className="w-full">
            <SelectValue placeholder={categoryId ? "Select subcategory" : "Choose a category first"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {subcategoriesForCategory.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
