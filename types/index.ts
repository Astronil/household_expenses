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

export interface ExpenseCategory {
  id: string;
  householdId: string;
  name: string;
  nameKey: string;
  createdAt: string;
}

export interface ExpenseSubcategory {
  id: string;
  householdId: string;
  categoryId: string;
  name: string;
  nameKey: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  /** Present for user expenses; omitted on some legacy/system rows */
  userId?: string;
  userName: string;
  householdId: string;
  amount: number;
  note?: string;
  receiptUrl?: string;
  timestamp: string;
  month?: string;
  type?: "system" | "expense";
  /** Optional; older transactions may omit these */
  categoryId?: string;
  subcategoryId?: string;
  categoryName?: string;
  subcategoryName?: string;
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
