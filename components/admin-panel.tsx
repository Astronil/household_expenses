"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { collection, query, where, doc, updateDoc, getDocs, getDoc, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Copy, UserPlus } from "lucide-react"
import { Label } from "@/components/ui/label"
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface AdminPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Member {
  id: string
  name: string
  email: string
  isActive: boolean
  isAdmin: boolean
  photoURL?: string
  displayName?: string
}

export function AdminPanel({ open, onOpenChange }: AdminPanelProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [householdCode, setHouseholdCode] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const { toast } = useToast()
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)

  useEffect(() => {
    if (!user?.householdId || !open) return

    // Get household code
    const fetchHouseholdCode = async () => {
      const householdQuery = query(
        collection(db, "households"),
        where("id", "==", user.householdId)
      )
      const householdSnapshot = await getDocs(householdQuery)
      if (!householdSnapshot.empty) {
        const householdData = householdSnapshot.docs[0].data()
        setHouseholdCode(householdData.code)
      }
    }

    // Get members
    const fetchMembers = async () => {
      if (!user?.householdId) {
        return
      }

      try {
        const householdRef = doc(db, "households", user.householdId)
        const householdDoc = await getDoc(householdRef)
        
        if (householdDoc.exists()) {
          const householdData = householdDoc.data()
          const memberIds = householdData.members || []
          
          const memberDetails = await Promise.all(
            memberIds.map(async (memberId: string) => {
              const userDoc = await getDoc(doc(db, "users", memberId))
              const userData = userDoc.data()
              return {
                id: memberId,
                name: userData?.name || "Unknown User",
                email: userData?.email || "",
                isAdmin: userData?.isAdmin || false,
              }
            })
          )
          setMembers(memberDetails)
        }
      } catch (error) {
        console.error("Error fetching household members:", error)
      }
    }

    fetchHouseholdCode()
    fetchMembers()
  }, [user?.householdId, open])

  const createSystemTransaction = async (message: string) => {
    if (!user?.householdId) return

    try {
      const ts = new Date().toISOString()
      await addDoc(collection(db, "transactions"), {
        householdId: user.householdId,
        amount: 0,
        note: message,
        timestamp: ts,
        month: ts.slice(0, 7),
        type: "system",
        userName: "System"
      })
    } catch (error) {
      console.error("Error creating system transaction:", error)
    }
  }

  const handleInvite = async () => {
    if (!user?.householdId || !inviteEmail.trim()) return

    setLoading(true)
    try {
      // Check if user exists
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", inviteEmail.trim().toLowerCase())
      )
      const usersSnapshot = await getDocs(usersQuery)

      if (usersSnapshot.empty) {
        throw new Error("User not found")
      }

      const invitedUser = usersSnapshot.docs[0]
      const invitedUserData = invitedUser.data()

      // Check if user is already in a household
      if (invitedUserData.householdId) {
        throw new Error("User is already in a household")
      }

      // Get household document
      const householdRef = doc(db, "households", user.householdId)
      const householdDoc = await getDoc(householdRef)

      if (!householdDoc.exists()) {
        throw new Error("Household not found")
      }

      const householdData = householdDoc.data()

      // Add user to household members
      await updateDoc(householdRef, {
        members: [...householdData.members, invitedUser.id],
      })

      // Update invited user's document
      await updateDoc(invitedUser.ref, {
        householdId: user.householdId,
        isAdmin: false,
        isActive: true
      })

      // Create system transaction for new member
      await createSystemTransaction(`${invitedUserData.name} joined the household`)

      toast({
        title: "Invitation sent!",
        description: `${inviteEmail} has been added to your household.`,
      })

      setInviteEmail("")
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error inviting user:", error)
      toast({
        title: "Error inviting user",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMemberStatus = async (member: Member) => {
    try {
      const userRef = doc(db, "users", member.id)
      await updateDoc(userRef, {
        isActive: !member.isActive
      })

      setMembers(members.map(m => 
        m.id === member.id ? { ...m, isActive: !m.isActive } : m
      ))

      toast({
        title: member.isActive ? "Member deactivated" : "Member activated",
        description: `${member.name} has been ${member.isActive ? "deactivated" : "activated"}.`,
      })
    } catch (error: any) {
      toast({
        title: "Error updating member status",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedMember || !user?.householdId) return

    try {
      // Get household document
      const householdRef = doc(db, "households", user.householdId)
      const householdDoc = await getDoc(householdRef)

      if (householdDoc.exists()) {
        const householdData = householdDoc.data()

        // Remove member from household
        const updatedMembers = householdData.members.filter((id: string) => id !== selectedMember.id)
        await updateDoc(householdRef, {
          members: updatedMembers
        })

        // Update member's document
        const userRef = doc(db, "users", selectedMember.id)
        await updateDoc(userRef, {
          householdId: null,
          isAdmin: false,
          isActive: true
        })

        // Create system transaction for member removal
        await createSystemTransaction(`${selectedMember.name} was removed from the household`)

        // Update local state
        setMembers(members.filter(m => m.id !== selectedMember.id))

        toast({
          title: "Member removed",
          description: `${selectedMember.name} has been removed from the household.`,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setShowRemoveDialog(false)
      setSelectedMember(null)
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

  const handleInviteMember = async () => {
    if (!user?.householdId || !inviteEmail.trim()) return

    setLoading(true)
    try {
      // Check if user exists
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", inviteEmail.trim().toLowerCase())
      )
      const usersSnapshot = await getDocs(usersQuery)

      if (usersSnapshot.empty) {
        throw new Error("User not found")
      }

      const invitedUser = usersSnapshot.docs[0]
      const invitedUserData = invitedUser.data()

      // Check if user is already in a household
      if (invitedUserData.householdId) {
        throw new Error("User is already in a household")
      }

      // Get household document
      const householdRef = doc(db, "households", user.householdId)
      const householdDoc = await getDoc(householdRef)

      if (!householdDoc.exists()) {
        throw new Error("Household not found")
      }

      const householdData = householdDoc.data()

      // Add user to household members
      await updateDoc(householdRef, {
        members: [...householdData.members, invitedUser.id],
      })

      // Update invited user's document
      await updateDoc(invitedUser.ref, {
        householdId: user.householdId,
        isAdmin: false,
        isActive: true
      })

      // Create system transaction for new member
      await createSystemTransaction(`${invitedUserData.name} joined the household`)

      toast({
        title: "Invitation sent!",
        description: `${inviteEmail} has been added to your household.`,
      })

      setInviteEmail("")
      setShowInviteDialog(false)
    } catch (error: any) {
      console.error("Error inviting user:", error)
      toast({
        title: "Error inviting user",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmRemove = async () => {
    if (!memberToRemove || !user?.householdId) return

    try {
      // Get household document
      const householdRef = doc(db, "households", user.householdId)
      const householdDoc = await getDoc(householdRef)

      if (householdDoc.exists()) {
        const householdData = householdDoc.data()

        // Remove member from household
        const updatedMembers = householdData.members.filter((id: string) => id !== memberToRemove.id)
        await updateDoc(householdRef, {
          members: updatedMembers
        })

        // Update member's document
        const userRef = doc(db, "users", memberToRemove.id)
        await updateDoc(userRef, {
          householdId: null,
          isAdmin: false,
          isActive: true
        })

        // Create system transaction for member removal
        await createSystemTransaction(`${memberToRemove.name} was removed from the household`)

        // Update local state
        setMembers(members.filter(m => m.id !== memberToRemove.id))

        toast({
          title: "Member removed",
          description: `${memberToRemove.name} has been removed from the household.`,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setShowRemoveDialog(false)
      setMemberToRemove(null)
    }
  }

  if (!user?.isAdmin) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admin Panel</DialogTitle>
          <DialogDescription>
            Manage your household members and settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Admin Panel</h2>
              <p className="text-muted-foreground">
                Manage your household members and settings
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/categories">Expense categories</Link>
              </Button>
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Household Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.photoURL || undefined} />
                        <AvatarFallback>
                          {member.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.displayName}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    {member.id !== user?.id && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setMemberToRemove(member)
                          setShowRemoveDialog(true)
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="sm:max-w-[425px] w-[95vw]">
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogDescription>
                Enter the email address of the person you want to invite to your household.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMember} disabled={!inviteEmail}>
                Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <AlertDialogContent className="sm:max-w-[425px] w-[95vw]">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {memberToRemove?.displayName} from your household?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRemove}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
