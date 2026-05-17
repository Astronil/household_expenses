import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Categories",
  description: "Create and organize expense categories and subcategories for your household.",
}

export default function AdminCategoriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
