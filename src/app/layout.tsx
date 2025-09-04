import Link from "next/link"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <header className="bg-white shadow-md">
          <nav className="container mx-auto flex justify-between items-center p-4">
            <h1 className="text-xl font-bold text-blue-600">Billcraft</h1>
            <div className="space-x-6">
              <Link href="/dashboard" className="hover:text-blue-500">
                Dashboard
              </Link>
              <Link href="/invoices" className="hover:text-blue-500">
                Invoices
              </Link>
              <Link href="/clients" className="hover:text-blue-500">
                Clients
              </Link>
              <Link href="/settings" className="hover:text-blue-500">
                Settings
              </Link>
            </div>
          </nav>
        </header>

        <main className="container mx-auto p-6">{children}</main>
      </body>
    </html>
  )
}