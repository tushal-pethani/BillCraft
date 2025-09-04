"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import LogoutButton from "./LogoutButton"

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="flex justify-between items-center p-4 shadow-md">
      <Link href="/" className="text-xl font-bold">BillCraft</Link>

      <div className="flex gap-4">
        {session ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/clients">Clients</Link>
            <Link href="/invoices">Invoices</Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/signup">Sign Up</Link>
            <Link href="/api/auth/signin">Login</Link>
          </>
        )}
      </div>
    </nav>
  )
}