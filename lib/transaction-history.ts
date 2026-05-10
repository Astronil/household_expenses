/** How far back household members can load transactions (months). */
export const TRANSACTION_HISTORY_MONTHS = 17

export function getTransactionHistoryStartDate(): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - TRANSACTION_HISTORY_MONTHS)
  return d
}

export function getTransactionHistoryStartIso(): string {
  return getTransactionHistoryStartDate().toISOString()
}

export function endOfDayIso(d: Date): string {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x.toISOString()
}

export function startOfMonthIso(year: number, monthIndex0: number): string {
  return new Date(year, monthIndex0, 1, 0, 0, 0, 0).toISOString()
}

export function endOfMonthIso(year: number, monthIndex0: number): string {
  return endOfDayIso(new Date(year, monthIndex0 + 1, 0))
}
