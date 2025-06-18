"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User as FirebaseUser, onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { User } from "@/types"

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("Setting up auth state listener...")
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User logged in" : "No user")
      setFirebaseUser(firebaseUser)

      if (firebaseUser) {
        try {
          console.log("Fetching user data for:", firebaseUser.uid)
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            console.log("User data found:", userData)
            setUser({ id: firebaseUser.uid, ...userData } as User)
          } else {
            console.log("No user document found, creating new user...")
            // Create new user document if it doesn't exist
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "User",
              createdAt: new Date().toISOString(),
            }
            await setDoc(doc(db, "users", firebaseUser.uid), newUser)
            setUser(newUser)
          }
        } catch (error) {
          console.error("Error fetching/creating user data:", error)
          setUser(null)
        }
      } else {
        console.log("No firebase user, clearing user state")
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      console.log("Cleaning up auth state listener")
      unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      console.log("Logging out user...")
      await signOut(auth)
      setUser(null)
      setFirebaseUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return <AuthContext.Provider value={{ user, firebaseUser, loading, logout }}>{children}</AuthContext.Provider>
}
