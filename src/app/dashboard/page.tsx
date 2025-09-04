import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-96 p-6 shadow rounded bg-white space-y-4 text-center">
        <h2 className="text-2xl font-bold">Welcome to BillCraft 🎉</h2>
        <p className="text-gray-600">Hello {session.user?.name || session.user?.email}</p>

        <a
          href="/api/auth/signout"
          className="inline-block mt-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </a>
      </div>
    </div>
  )
}