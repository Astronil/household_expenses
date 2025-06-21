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
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authComplete, setAuthComplete] = useState(false)

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUser({ id: firebaseUser.uid, ...userData } as User)
      } else {
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
  }

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser)
    }
  }

  useEffect(() => {
    const startTime = Date.now()
    const minLoadingTime = 2000 // 2 seconds minimum loading time
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)

      if (firebaseUser) {
        await fetchUserData(firebaseUser)
      } else {
        setUser(null)
      }

      setAuthComplete(true)
      
      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
      
      setTimeout(() => {
        setLoading(false)
      }, remainingTime)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return <AuthContext.Provider value={{ user, firebaseUser, loading, logout, refreshUser }}>{children}</AuthContext.Provider>
}
