"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await axios.post<{ token: string }>("/api/login", { username, password })
      localStorage.setItem("token", res.data.token)
      router.push("/")
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const msg = (err.response?.data as { error?: string })?.error ?? err.message
        setError(msg)
      } else {
        setError("Login failed")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">🚀 Terraform GUI</h1>
          <p className="text-gray-400 mt-1 text-sm">Sign in to manage your infrastructure</p>
        </div>

        <form onSubmit={handleLogin} className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-gray-300 text-sm block mb-1">Username</label>
            <input
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm block mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-600 rounded-lg px-3 py-2 text-red-300 text-sm">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-all"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-gray-500 text-xs text-center">
            Default: <code className="text-gray-400">admin</code> / <code className="text-gray-400">admin123</code>
          </p>
        </form>
      </div>
    </main>
  )
}