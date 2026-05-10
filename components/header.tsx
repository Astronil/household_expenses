"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LogOut, User } from "lucide-react"

interface HeaderProps {
  children?: React.ReactNode
}

export function Header({ children }: HeaderProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium px-2 py-1 rounded-md transition-colors whitespace-nowrap",
        pathname === href
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
      )}
    >
      {label}
    </Link>
  )

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 w-full space-y-2">
            {user?.householdId && (
              <nav className="flex flex-wrap items-center gap-1 sm:gap-2 pb-1 border-b border-border/60 sm:border-0 sm:pb-0">
                {navLink("/", "Dashboard")}
                {navLink("/transactions", "Transactions")}
                {user?.isAdmin && navLink("/admin/categories", "Categories")}
              </nav>
            )}
            {children || <h1 className="text-lg sm:text-xl font-bold">🏡 Household Expenses</h1>}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium truncate">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="flex-shrink-0">
              <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
