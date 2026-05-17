import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Transactions",
  description:
    "Browse, search, and filter household expenses by date, category, member, amount, and notes.",
}

export default function TransactionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
