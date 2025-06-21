"use client"

import { useState } from "react"
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function HouseholdSetup() {
  const [householdCode, setHouseholdCode] = useState("")
  const [householdName, setHouseholdName] = useState("")
  const [loading, setLoading] = useState(false)
  const [createdCode, setCreatedCode] = useState("")
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const generateHouseholdCode = () => {
    // Generate a 6-character code using uppercase letters and numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const createHousehold = async () => {
    if (!user || !householdName.trim()) return

    setLoading(true)
    try {
      const code = generateHouseholdCode()
      const householdId = `household_${Date.now()}`
      
      // Create household document
      const householdData = {
        id: householdId,
        name: householdName.trim(),
        code,
        admin: user.id,
        members: [user.id],
        createdAt: new Date().toISOString(),
      }

      await setDoc(doc(db, "households", householdId), householdData)

      // Update user document
      const userRef = doc(db, "users", user.id)
      await updateDoc(userRef, {
        householdId,
        isAdmin: true,
        householdName: householdName.trim(),
        householdCode: code,
      })

      // Refresh user data
      const updatedUserDoc = await getDoc(userRef)
      if (updatedUserDoc.exists()) {
        const updatedUserData = updatedUserDoc.data()
        await refreshUser()
      }

      toast({
        title: "Household created!",
        description: "Your household has been set up successfully",
      })
    } catch (error: any) {
      console.error("Error creating household:", error)
      toast({
        title: "Error creating household",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinHousehold = async () => {
    if (!user || !householdCode.trim()) return

    setLoading(true)
    try {
      // Find household by code
      const householdsRef = collection(db, "households")
      const q = query(householdsRef, where("code", "==", householdCode.trim().toUpperCase()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        toast({
          title: "Invalid code",
          description: "No household found with this code",
          variant: "destructive",
        })
        return
      }

      const householdDoc = querySnapshot.docs[0]
      const householdData = householdDoc.data()

      // Check if user is already a member
      if (householdData.members.includes(user.id)) {
        toast({
          title: "Already a member",
          description: "You are already a member of this household",
          variant: "destructive",
        })
        return
      }

      // Add user to household
      const updatedMembers = [...householdData.members, user.id]
      await updateDoc(householdDoc.ref, {
        members: updatedMembers,
      })

      // Update user document
      const userRef = doc(db, "users", user.id)
      await updateDoc(userRef, {
        householdId: householdDoc.id,
        isAdmin: false,
        householdName: householdData.name,
        householdCode: householdData.code,
      })

      // Refresh user data
      const updatedUserDoc = await getDoc(userRef)
      if (updatedUserDoc.exists()) {
        const updatedUserData = updatedUserDoc.data()
        await refreshUser()
      }

      toast({
        title: "Joined household!",
        description: `Welcome to ${householdData.name}`,
      })
    } catch (error: any) {
      console.error("Error joining household:", error)
      toast({
        title: "Error joining household",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Household Setup</CardTitle>
          <CardDescription className="text-sm">
            Create a new household or join an existing one
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="text-xs sm:text-sm">Create Household</TabsTrigger>
              <TabsTrigger value="join" className="text-xs sm:text-sm">Join Household</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Household Name</Label>
                <Input
                  id="name"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="Enter household name"
                  className="w-full"
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Create a new household to start tracking expenses with your family or roommates.
              </p>
              <Button
                onClick={createHousehold}
                disabled={loading || !householdName.trim()}
                className="w-full"
              >
                {loading ? "Creating..." : "Create New Household"}
              </Button>
              {createdCode && (
                <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs sm:text-sm font-medium text-green-800">Household Code:</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1">{createdCode}</p>
                  <p className="text-xs sm:text-sm text-green-600 mt-2">
                    Share this code with others to let them join your household.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="join" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Household Code</Label>
                <Input
                  id="code"
                  value={householdCode}
                  onChange={(e) => setHouseholdCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleJoinHousehold}
                disabled={loading || !householdCode}
                className="w-full"
              >
                {loading ? "Joining..." : "Join Household"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
