import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full border-t bg-white mt-8">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <img src="/spending.png" alt="Logo" className="h-6 w-6" />
          <span className="font-semibold text-gray-700">Household Expenses</span>
        </div>
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} Household Expenses</span>
          <span className="hidden sm:inline">|</span>
          <span className="italic text-gray-400">Made by Astronil</span>
          <Link href="https://poudelanil.com" target="_blank" rel="noopener" className="text-blue-500 hover:underline ml-1">
            poudelanil.com
          </Link>
        </div>
      </div>
    </footer>
  )
} 