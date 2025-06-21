"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

interface HeaderProps {
  children?: React.ReactNode
}

export function Header({ children }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
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
