"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot, getDocs, getDoc, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import type { Transaction } from "@/types"
import { Header } from "@/components/header"
import { StatsCards } from "@/components/stats-cards"
import { SpendingChart } from "@/components/spending-chart"
import { TransactionFeed } from "@/components/transaction-feed"
import { AddTransactionModal } from "@/components/add-transaction-modal"
import { StandingsModal } from "@/components/standings-modal"
import { AdminPanel } from "@/components/admin-panel"
import { Button } from "@/components/ui/button"
import { Plus, Calculator, Settings, Users, LogOut, Trash2, Key, Copy, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTransactions } from "@/lib/hooks/use-transactions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showStandings, setShowStandings] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [householdName, setHouseholdName] = useState("")
  const [householdMembers, setHouseholdMembers] = useState<Array<{ id: string; name: string }>>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [householdCode, setHouseholdCode] = useState("")
  const { toast } = useToast()

  // State for editing transactions
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");

  const createSystemTransaction = async (message: string) => {
    if (!user?.householdId) return

    try {
      await addDoc(collection(db, "transactions"), {
        householdId: user.householdId,
        amount: 0,
        note: message,
        timestamp: new Date().toISOString(),
        type: "system",
        userName: "System"
      })
    } catch (error) {
      console.error("Error creating system transaction:", error)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toFixed(2));
    setEditNote(transaction.note || "");
    // You might want to open a modal here for editing
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "transactions", transactionId));
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed.",
      });
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error deleting transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      await updateDoc(doc(db, "transactions", editingTransaction.id), {
        amount: Number.parseFloat(editAmount),
        note: editNote.trim() || null,
      });
      toast({
        title: "Transaction updated",
        description: "Changes have been saved.",
      });
      setEditingTransaction(null);
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error updating transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleDeleteHousehold = async () => {
    if (!user?.householdId || !user.isAdmin) return

    try {
      // Get all transactions in the household
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("householdId", "==", user.householdId)
      )
      const transactionsSnapshot = await getDocs(transactionsQuery)

      // Delete all transactions
      const deletePromises = transactionsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Get all users in the household
      const usersQuery = query(
        collection(db, "users"),
        where("householdId", "==", user.householdId)
      )
      const usersSnapshot = await getDocs(usersQuery)

      // Update all users to remove household association
      const updatePromises = usersSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          householdId: null,
          isAdmin: false
        })
      )
      await Promise.all(updatePromises)

      // Delete the household document
      const householdQuery = query(
        collection(db, "households"),
        where("id", "==", user.householdId)
      )
      const householdSnapshot = await getDocs(householdQuery)
      if (!householdSnapshot.empty) {
        await deleteDoc(householdSnapshot.docs[0].ref)
      }

      toast({
        title: "Household deleted",
        description: "The household and all its data have been deleted.",
      })

      // Force reload to update auth state
      window.location.reload()
    } catch (error: any) {
      console.error("Error deleting household:", error)
      toast({
        title: "Error deleting household",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleLeaveHousehold = async () => {
    if (!user?.householdId) return

    try {
      // Get household document
      const householdRef = doc(db, "households", user.householdId)
      const householdDoc = await getDoc(householdRef)
      
      if (householdDoc.exists()) {
        const householdData = householdDoc.data()

        // Remove user from household members
        const updatedMembers = householdData.members.filter((id: string) => id !== user.id)
        
        // If this is the last member, delete the household
        if (updatedMembers.length === 0) {
          // Delete all transactions
          const transactionsQuery = query(
            collection(db, "transactions"),
            where("householdId", "==", user.householdId)
          )
          const transactionsSnapshot = await getDocs(transactionsQuery)
          const deletePromises = transactionsSnapshot.docs.map(doc => deleteDoc(doc.ref))
          await Promise.all(deletePromises)

          // Delete the household
          await deleteDoc(householdRef)
        } else {
          // Update household with new members and admin if needed
          const updates: any = {
            members: updatedMembers
          }
          
          // If user was admin, make the first remaining member admin
          if (user.isAdmin && householdData.admin === user.id) {
            updates.admin = updatedMembers[0]
          }
          
          await updateDoc(householdRef, updates)
          
          // Create system transaction for member leaving
          await createSystemTransaction(`${user.name} left the household`)
        }
      }

      // Update user document - completely remove household association
      const userRef = doc(db, "users", user.id)
      await updateDoc(userRef, {
        householdId: null,
        isAdmin: false,
        isActive: true,
        // Remove any household-specific data
        householdName: null,
        householdCode: null
      })

      toast({
        title: "Left household",
        description: "You have successfully left the household.",
      })

      // Force reload to update auth state
      window.location.reload()
    } catch (error: any) {
      console.error("Error leaving household:", error)
      toast({
        title: "Error leaving household",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(householdCode)
      toast({
        title: "Copied!",
        description: "Household code copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error copying code",
        description: "Please copy the code manually",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!user?.householdId) {
      setLoading(false)
      return
    }

    const householdId = user.householdId // Store in variable to satisfy TypeScript

    // Load household members and name
    const loadHouseholdData = async () => {
      try {
        const householdRef = doc(db, "households", householdId)
        const householdDoc = await getDoc(householdRef)
        
        if (householdDoc.exists()) {
          const householdData = householdDoc.data()
          setHouseholdName(householdData.name || "")
          setHouseholdCode(householdData.code || "")
          
          // Load member details
          const memberDetails = await Promise.all(
            householdData.members.map(async (memberId: string) => {
              const userDoc = await getDoc(doc(db, "users", memberId))
              const userData = userDoc.data()
              return {
                id: memberId,
                name: userData?.name || "Unknown User"
              }
            })
          )
          setHouseholdMembers(memberDetails)
        }
      } catch (error) {
        console.error("Error loading household data:", error)
        setError("Failed to load household data")
      }
    }

    loadHouseholdData()

    // Load transactions
    const q = query(
      collection(db, "transactions"),
      where("householdId", "==", householdId),
      orderBy("timestamp", "desc")
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transactionData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]
        setTransactions(transactionData)
        setLoading(false)
        setError(null)
      },
      (error) => {
        setError(error.message)
        setLoading(false)
        toast({
          title: "Error loading transactions",
          description: "Please try refreshing the page. If the error persists, contact support.",
          variant: "destructive",
        })
      }
    )
    return () => unsubscribe()
  }, [user?.householdId, toast])

  if (!user) return null

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Error Loading Dashboard</h2>
            <p className="text-red-600 mt-2">{error}</p>
            <p className="text-red-600 mt-2">
              If you see an error about missing indexes, please wait a few minutes for the index to be created.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header>
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">{householdName}</h1>
          {user?.isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCodeDialog(true)}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Show Code
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStandings(true)}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Standings
          </Button>
          {user?.isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Members
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {householdMembers.map((member) => (
                <DropdownMenuItem key={member.id}>
                  {member.name}
                  {member.id === user?.id && " (You)"}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {user?.isAdmin ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Household
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowLeaveDialog(true)}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Household
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Header>

      <main className="container mx-auto px-2 sm:px-6 md:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold">{householdName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                    <Users className="h-4 w-4 mr-2" />
                    Show Members ({householdMembers.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {householdMembers.map((member) => (
                    <div key={member.id} className="px-4 py-2 text-sm">
                      {member.name} {member.id === user.id && "(You)"}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {user.isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => setShowAdmin(true)}>
                      Manage Household
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Household
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowLeaveDialog(true)}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Household
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => setShowAddTransaction(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
            <Button variant="outline" onClick={() => setShowStandings(true)} className="w-full sm:w-auto">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Standings
            </Button>
          </div>
        </div>

        <StatsCards transactions={transactions} />

        <SpendingChart transactions={transactions} />

        <TransactionFeed
          transactions={transactions}
          loading={loading}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      </main>

      {editingTransaction && (
        <AlertDialog open={!!editingTransaction} onOpenChange={setEditingTransaction as any}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Edit the amount and note for this transaction.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="editAmount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Amount ($)</label>
                <input
                  id="editAmount"
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="editNote" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Note (optional)</label>
                <textarea
                  id="editNote"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={3}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelEdit}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveEdit}>Save Changes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AddTransactionModal open={showAddTransaction} onOpenChange={setShowAddTransaction} />

      <StandingsModal open={showStandings} onOpenChange={setShowStandings} transactions={transactions} />

      {user.isAdmin && <AdminPanel open={showAdmin} onOpenChange={setShowAdmin} />}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Household</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this household? This action cannot be undone.
              All transactions and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHousehold}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Household</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this household? You will lose access to all transactions
              and will need to be invited back to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveHousehold}
              className="bg-red-600 hover:bg-red-700"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Household Code Dialog */}
      <AlertDialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Household Code</AlertDialogTitle>
            <AlertDialogDescription>
              Share this code with others to let them join your household
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg my-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Your Household Code</p>
              <p className="text-2xl font-bold">{householdCode}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
