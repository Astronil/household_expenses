export interface User {
  id: string;
  email: string;
  name: string;
  householdId?: string;
  isAdmin?: boolean;
  createdAt: string;
  photoURL?: string;
  displayName?: string;
}

export interface Household {
  id: string;
  name: string;
  code: string;
  adminId: string;
  members: string[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  householdId: string;
  amount: number;
  note?: string;
  receiptUrl?: string;
  timestamp: string;
  month: string;
  type?: "system" | "expense";
}

export interface Standing {
  id: string;
  householdId: string;
  month: string;
  totalExpense: number;
  userTotals: Record<string, number>;
  fairShare: number;
  settlements: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
  createdAt: string;
}
