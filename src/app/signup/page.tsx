"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Head from "next/head"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        await signIn("credentials", { email, password })
        router.push("/dashboard")
      } else if (data.error === "User already exists") {
        setError("User already exists. Try logging in.")
      } else {
        setError(data.error || "Signup failed")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Billmart - Create Your Account</title>
        <meta name="description" content="Create your Billmart account" />
      </Head>
      
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
        }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <h1 style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              marginBottom: 8, 
              color: "#4a5568",
              letterSpacing: "-0.5px"
            }}>
              Welcome to BillCraft
            </h1>
            <p style={{ 
              fontSize: 16, 
              color: "#718096", 
              marginBottom: 30 
            }}>
              Create your account
            </p>
          </div>

          {error && (
            <div style={{
              background: "#fed7d7",
              color: "#c53030",
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <svg style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  padding: "14px 16px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 15,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                  color: "#2d3748",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "#667eea"}
                onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
              />
            </div>
            
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  padding: "14px 16px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 15,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                  color: "#2d3748",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "#667eea"}
                onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  padding: "14px 16px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 15,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                  color: "#2d3748",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "#667eea"}
                onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
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
                marginTop: 10,
                boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#5a67d8"}
              onMouseOut={e => e.currentTarget.style.background = "#667eea"}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            margin: "25px 0",
            color: "#a0aec0"
          }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }}></div>
            <span style={{ padding: "0 15px", fontSize: 14 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }}></div>
          </div>

          {/* <button
            onClick={() => signIn("google")}
            style={{
              padding: 14,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#4a5568",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = "#f7fafc";
              e.currentTarget.style.borderColor = "#cbd5e0";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Sign up with Google
          </button> */}

          <div style={{
            marginTop: 30,
            textAlign: "center",
            fontSize: 14,
            color: "#718096",
          }}>
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              style={{
                color: "#667eea",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: "transparent",
                padding: 0,
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </>
  )
}