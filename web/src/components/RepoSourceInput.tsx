"use client"
import { useState, useEffect } from "react"
import axios, { AxiosError } from "axios"

export type RepoSource = {
  type: "url" | "local"
  url?: string
  username?: string
  password?: string
  localDir?: string
}

type FileEntry = {
  name: string
  path: string
  is_dir: boolean
}

type BrowseResult = {
  resolved_path: string
  files: FileEntry[]
  count: number
}

// Path conversion helper (client-side preview only)
// Mirrors the normalizePath() logic in services/repo.go
function convertToWSLPath(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Already a Unix/WSL path — no conversion needed
  if (trimmed.startsWith("/")) return null

  // Windows path pattern: D:\ or D:/
  const winPattern = /^([a-zA-Z]):[\\\/](.*)/
  const match = trimmed.match(winPattern)
  if (!match) return null

  const driveLetter = match[1].toLowerCase()
  const rest = match[2]
    .replace(/\\/g, "/")   // backslash → forward slash
    .replace(/\/+$/, "")   // strip trailing slash

  return `/mnt/${driveLetter}/${rest}`
}

export default function RepoSourceInput({ onChange }: { onChange: (v: RepoSource) => void }) {
  const [type, setType] = useState<"url" | "local">("url")
  const [url, setUrl] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [localDir, setLocalDir] = useState("")
  const [wslPath, setWslPath]   = useState<string | null>(null)
  const [browsing, setBrowsing]   = useState(false)
  const [browseResult, setBrowseResult] = useState<BrowseResult | null>(null)
  const [browseError, setBrowseError]   = useState<string | null>(null)

  // Auto-convert Windows path to WSL path on every keystroke
  useEffect(() => {
    const converted = convertToWSLPath(localDir)
    setWslPath(converted)
    // Clear browse result when path changes
    setBrowseResult(null)
    setBrowseError(null)
  }, [localDir])

  const current = (): RepoSource => ({ type, url, username, password, localDir })

  const update = (patch: Partial<RepoSource>) => {
    const val = { ...current(), ...patch }
    onChange(val)
    // Clear browse result on any change
    setBrowseResult(null)
    setBrowseError(null)
  }

  const handleBrowse = async () => {
    setBrowsing(true)
    setBrowseResult(null)
    setBrowseError(null)

    const token = localStorage.getItem("token")
    try {
      const res = await axios.post<BrowseResult>(
        "/api/repo/browse",
        current(),
        { headers: { Authorization: token ?? "" } }
      )
      setBrowseResult(res.data)
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        const msg = (err.response?.data as { error?: string })?.error ?? err.message
        setBrowseError(msg)
      } else if (err instanceof Error) {
        setBrowseError(err.message)
      } else {
        setBrowseError("Unknown error occurred")
      }
    } finally {
      setBrowsing(false)
    }
  }

  const canBrowse =
    (type === "local" && localDir.trim() !== "") ||
    (type === "url"   && url.trim() !== "")

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-semibold text-lg">📁 Terraform Repo Source</h3>

      {/* Toggle */}
      <div className="flex gap-2">
        {(["url", "local"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t)
              setWslPath(null)
              setBrowseResult(null)
              setBrowseError(null)
              update({ type: t })
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              type === t
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {t === "url" ? "🌐 Git URL" : "📂 Local Directory"}
          </button>
        ))}
      </div>

      {/* URL inputs */}
      {type === "url" && (
        <div className="space-y-3">
          <input
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
            placeholder="https://github.com/Username/Terraform.git"
            value={url}
            onChange={(e) => { setUrl(e.target.value); update({ url: e.target.value }) }}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
              placeholder="Username (private repo only)"
              value={username}
              onChange={(e) => { setUsername(e.target.value); update({ username: e.target.value }) }}
            />
            <input
              type="password"
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
              placeholder="Password / PAT Token (private repo only)"
              value={password}
              onChange={(e) => { setPassword(e.target.value); update({ password: e.target.value }) }}
            />
          </div>
          <p className="text-gray-400 text-xs">
            💡 For private GitHub repos, use a Personal Access Token (PAT) as the password.
            Leave both empty for public repos.
          </p>
        </div>
      )}

      {/* Local dir input */}
      {type === "local" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <input
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
              placeholder="D:\Terraform  or  /home/user/Terraform"
              value={localDir}
              onChange={(e) => { setLocalDir(e.target.value); update({ localDir: e.target.value }) }}
            />

            {/* WSL path conversion preview */}
            {localDir.trim() !== "" && (
              <div className={`rounded-lg px-4 py-3 text-xs font-mono flex items-start gap-3 ${
                wslPath
                  ? "bg-blue-900/30 border border-blue-700"
                  : "bg-gray-700/50 border border-gray-600"
              }`}>
                {wslPath ? (
                  <>
                    {/* Windows path — original */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 shrink-0">🪟 Windows</span>
                        <span className="text-yellow-300 break-all">{localDir.trim()}</span>
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-500 pl-1">↓ auto-converted</div>

                      {/* WSL path — converted */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 shrink-0">🐧 WSL</span>
                        <span className="text-green-400 break-all">{wslPath}</span>
                      </div>
                    </div>

                    {/* Copy button */}
                    <button
                      onClick={() => navigator.clipboard.writeText(wslPath)}
                      title="Copy WSL path"
                      className="shrink-0 text-gray-400 hover:text-white transition-colors mt-0.5"
                    >
                      📋
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>🐧 WSL</span>
                    <span className="text-green-400">{localDir.trim()}</span>
                    <span className="text-gray-500">(already a Unix path — no conversion needed)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-gray-500 text-xs">
            💡 Windows paths like <code className="text-purple-300">D:\Terraform</code> are
            automatically converted to <code className="text-purple-300">/mnt/d/Terraform</code> for WSL.
            The Go server must run inside WSL for this to work.
          </p>
        </div>
      )}

      {/* Browse button */}
      <button
        onClick={handleBrowse}
        disabled={!canBrowse || browsing}
        className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all font-medium"
      >
        {browsing
          ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connecting...</>
          : "🔍 Browse / Test Connection"
        }
      </button>

      {/* Browse error */}
      {browseError && (
        <div className="bg-red-900/40 border border-red-600 rounded-lg px-4 py-3 text-sm space-y-1">
          <p className="text-red-400 font-medium">❌ Connection Failed</p>
          <p className="text-red-300 font-mono text-xs break-all">{browseError}</p>
          {type === "local" && wslPath && (
            <p className="text-gray-400 text-xs mt-1">
              Attempted path: <code className="text-yellow-300">{wslPath}</code>
            </p>
          )}
        </div>
      )}

      {/* Browse success — directory listing */}
      {browseResult && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-green-400 font-medium text-sm">✅ Connected — {browseResult.count} items</p>
            <span className="text-gray-400 text-xs">{browseResult.resolved_path}</span>
          </div>

          <div className="bg-black/40 rounded-lg p-3 max-h-48 overflow-y-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left pb-1">Type</th>
                  <th className="text-left pb-1">Name</th>
                </tr>
              </thead>
              <tbody>
                {browseResult.files.map((f, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="py-0.5 pr-3 text-gray-500">
                      {f.is_dir ? "📁" : "📄"}
                    </td>
                    <td className={`py-0.5 ${f.is_dir ? "text-blue-300" : "text-green-300"}`}>
                      {f.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}