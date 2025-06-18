"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import type { Transaction } from "@/types";

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.householdId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "transactions"),
      where("householdId", "==", user.householdId),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transactionData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setTransactions(transactionData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching transactions:", error);
        setError("Failed to load transactions");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.householdId]);

  return { transactions, loading, error };
}
