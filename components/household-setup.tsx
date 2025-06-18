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
  const { user } = useAuth()
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
    if (!user) return
    if (!householdName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a household name",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("Creating new household...")
      const code = generateHouseholdCode()
      console.log("Generated household code:", code)

      const householdId = `household_${Date.now()}`
      console.log("Generated household ID:", householdId)
      console.log("User ID:", user.id)

      // Create household document with setDoc
      const householdRef = doc(db, "households", householdId)
      await setDoc(householdRef, {
        id: householdId,
        code: code,
        name: householdName.trim(),
        admin: user.id,
        members: [user.id],
        createdAt: new Date().toISOString(),
      })
      console.log("Created household document:", householdId)

      // Update user document
      const userRef = doc(db, "users", user.id)
      await updateDoc(userRef, {
        householdId: householdId,
        isAdmin: true,
      })
      console.log("Updated user document with household ID")

      // Verify the updates
      const updatedUserDoc = await getDoc(userRef)
      console.log("Updated user data:", updatedUserDoc.data())
      
      const householdDoc = await getDoc(householdRef)
      console.log("Created household data:", householdDoc.data())

      setCreatedCode(code)
      toast({
        title: "Household created!",
        description: `Your household code is: ${code}`,
      })

      // Force reload to update auth state
      window.location.reload()
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

  const joinHousehold = async () => {
    if (!user || !householdCode) return

    setLoading(true)
    try {
      console.log("Joining household:", householdCode)
      
      // Check if household exists
      const householdQuery = query(
        collection(db, "households"),
        where("code", "==", householdCode)
      )
      const householdSnapshot = await getDocs(householdQuery)
      
      if (householdSnapshot.empty) {
        throw new Error("Household not found")
      }

      const householdDoc = householdSnapshot.docs[0]
      const householdData = householdDoc.data()
      console.log("Found household:", householdData)

      // Check if user is already a member
      if (householdData.members.includes(user.id)) {
        // If user is already a member but has no householdId (left previously),
        // just update their user document
        if (!user.householdId) {
          const userRef = doc(db, "users", user.id)
          await updateDoc(userRef, {
            householdId: householdDoc.id,
            isAdmin: false,
            isActive: true
          })

          // Create system transaction for rejoining
          await addDoc(collection(db, "transactions"), {
            householdId: householdDoc.id,
            amount: 0,
            note: `${user.name} rejoined the household`,
            timestamp: new Date().toISOString(),
            type: "system",
            userName: "System"
          })

          toast({
            title: "Rejoined household!",
            description: "You have successfully rejoined the household.",
          })

          // Force reload to update auth state
          window.location.reload()
          return
        }
        throw new Error("You are already a member of this household")
      }

      // Update household members
      const householdRef = doc(db, "households", householdDoc.id)
      await updateDoc(householdRef, {
        members: [...householdData.members, user.id],
      })
      console.log("Updated household members")

      // Update user document
      const userRef = doc(db, "users", user.id)
      await updateDoc(userRef, {
        householdId: householdDoc.id,
        isAdmin: false,
        isActive: true
      })
      console.log("Updated user document with household ID")

      // Create system transaction for new member
      await addDoc(collection(db, "transactions"), {
        householdId: householdDoc.id,
        amount: 0,
        note: `${user.name} joined the household`,
        timestamp: new Date().toISOString(),
        type: "system",
        userName: "System"
      })

      // Verify the updates
      const updatedUserDoc = await getDoc(userRef)
      console.log("Updated user data:", updatedUserDoc.data())
      
      const updatedHouseholdDoc = await getDoc(householdRef)
      console.log("Updated household data:", updatedHouseholdDoc.data())

      toast({
        title: "Joined household!",
        description: "You have successfully joined the household.",
      })

      // Force reload to update auth state
      window.location.reload()
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
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Household Setup</CardTitle>
          <CardDescription>
            Create a new household or join an existing one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Household</TabsTrigger>
              <TabsTrigger value="join">Join Household</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Household Name</Label>
                  <Input
                    id="name"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="Enter household name"
                  />
                </div>
                <p className="text-sm text-gray-500">
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
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Household Code:</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{createdCode}</p>
                    <p className="text-sm text-green-600 mt-2">
                      Share this code with others to let them join your household.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="join">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Household Code</Label>
                  <Input
                    id="code"
                    value={householdCode}
                    onChange={(e) => setHouseholdCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    maxLength={6}
                  />
                </div>
                <Button
                  onClick={joinHousehold}
                  disabled={loading || !householdCode}
                  className="w-full"
                >
                  {loading ? "Joining..." : "Join Household"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
