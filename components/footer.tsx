import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="glass-footer mt-auto w-full">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Image
            src="/spending.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6"
            loading="lazy"
          />
          <span className="font-semibold text-foreground">Household Expenses</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} Household Expenses</span>
          <span className="hidden sm:inline" aria-hidden>
            |
          </span>
          <span className="italic text-muted-foreground/80">Made by Astronil</span>
          <Link
            href="https://poudelanil.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:text-primary/90 hover:underline"
          >
            poudelanil.com
          </Link>
        </div>
      </div>
    </footer>
  )
}
