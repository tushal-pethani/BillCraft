"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session) {
    router.push("/") // redirect to signup/login if not logged in
    return null
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      width: "100vw",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "'Inter', sans-serif",
      margin: 0,
      padding: 0,
      position: "fixed",
      top: 0,
      left: 0,
      overflow: "auto"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
        padding: "40px 35px",
        margin: "20px",
        textAlign: "center"
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, color: "#4a5568" }}>
          Welcome, {session.user?.name || session.user?.email}!
        </h1>
        <p style={{ fontSize: 16, color: "#718096", marginBottom: 30 }}>
          You are now logged in to BillCraft.
        </p>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            padding: 14,
            borderRadius: 8,
            border: "none",
            background: "#667eea",
            color: "white",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
          }}
          onMouseOver={e => e.currentTarget.style.background = "#5a67d8"}
          onMouseOut={e => e.currentTarget.style.background = "#667eea"}
        >
          Logout
        </button>
      </div>
    </div>
  )
}