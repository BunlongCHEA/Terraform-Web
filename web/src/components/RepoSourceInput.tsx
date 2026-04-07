"use client"
import { useState } from "react"

export type RepoSource = {
  type: "url" | "local"
  url?: string
  username?: string
  password?: string
  localDir?: string
}

export default function RepoSourceInput({ onChange }: { onChange: (v: RepoSource) => void }) {
  const [type, setType] = useState<"url" | "local">("url")
  const [url, setUrl] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [localDir, setLocalDir] = useState("")

  const update = (patch: Partial<RepoSource>) => {
    const val = { type, url, username, password, localDir, ...patch }
    onChange(val)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-semibold text-lg">📁 Terraform Repo Source</h3>

      {/* Toggle */}
      <div className="flex gap-2">
        {(["url", "local"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); update({ type: t }) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              type === t ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {t === "url" ? "🌐 Git URL" : "📂 Local Directory"}
          </button>
        ))}
      </div>

      {type === "url" && (
        <div className="space-y-3">
          <input
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
            placeholder="https://github.com/BunlongCHEA/Terraform-Plan.git"
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
          <p className="text-gray-400 text-xs">💡 For private GitHub repos, use a Personal Access Token (PAT) as the password.</p>
        </div>
      )}

      {type === "local" && (
        <input
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
          placeholder="/home/user/Terraform-Plan  or  /mnt/d/1-Git/Terraform-Plan"
          value={localDir}
          onChange={(e) => { setLocalDir(e.target.value); update({ localDir: e.target.value }) }}
        />
      )}
    </div>
  )
}