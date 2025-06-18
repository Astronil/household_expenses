"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { LogOut, Home, BarChart2, Settings, Menu, LogIn } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StandingsModal } from "@/components/standings-modal"
import { AdminPanel } from "@/components/admin-panel"
import Link from "next/link"
import { useTransactions } from "@/lib/hooks/use-transactions"

export function Navbar() {
  const { user } = useAuth()
  const { transactions } = useTransactions()
  const [showStandings, setShowStandings] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  const handleSignOut = () => {
    // TODO: Implement sign out logic
    alert("Sign out clicked")
  }

  const handleSignIn = () => {
    // TODO: Implement sign in logic
    alert("Sign in clicked")
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <span className="font-semibold">Household</span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {user ? (
            <>
              {/* Desktop Menu */}
              <div className="hidden sm:flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setShowStandings(true)}>
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Standings
                </Button>
                {user.isAdmin && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAdminPanel(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              {/* Mobile Menu */}
              <div className="flex sm:hidden items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowStandings(true)}>
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Standings
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem onClick={() => setShowAdminPanel(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {user.displayName || user.email}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleSignIn}>
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      <StandingsModal open={showStandings} onOpenChange={setShowStandings} transactions={transactions} />
      <AdminPanel open={showAdminPanel} onOpenChange={setShowAdminPanel} />
    </nav>
  )
} 