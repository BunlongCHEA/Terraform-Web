"use client"
import { useState, useRef, useEffect } from "react"
import RepoSourceInput, { type RepoSource } from "@/components/RepoSourceInput"
import SSHKeyInput, { type SSHKeyData } from "@/components/SSHKeyInput"
import DigitalOceanForm, { type DOVars } from "@/components/DigitalOceanForm"
import GKEForm, { type GKEVars } from "@/components/GKEForm"
import axios from "axios"

type Provider = "digitalocean" | "gke"

const ACTIONS = [
  { key: "all",        label: "▶ Full Run",          color: "bg-purple-600 hover:bg-purple-500" },
  { key: "plan",       label: "📋 Plan",              color: "bg-blue-600 hover:bg-blue-500" },
  { key: "apply",      label: "✅ Apply",             color: "bg-green-600 hover:bg-green-500" },
  { key: "ansible",    label: "🔧 Install Ansible",   color: "bg-sky-600 hover:bg-sky-500" },
  { key: "rancher",    label: "🐄 Install Rancher",   color: "bg-sky-600 hover:bg-sky-500" },
  { key: "argocd",     label: "🐙 Install ArgoCD",    color: "bg-sky-600 hover:bg-sky-500" },
  { key: "prometheus", label: "📊 Install Prometheus",color: "bg-sky-600 hover:bg-sky-500" },
  { key: "destroy",    label: "💥 Destroy All",       color: "bg-red-600 hover:bg-red-500" },
]

export default function Dashboard() {
  const [provider, setProvider] = useState<Provider>("digitalocean")
  const [repoSrc, setRepoSrc] = useState<RepoSource>({ type: "url" })
  const [sshKey, setSSHKey] = useState<SSHKeyData>({ mode: "path" })
  const [doVars, setDOVars] = useState<DOVars | null>(null)
  const [gkeVars, setGKEVars] = useState<GKEVars | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const logBoxRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Auto-scroll logs
  useEffect(() => {
    if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
  }, [logs])

  const runJob = async (option: string) => {
    setLogs([])
    setRunning(true)
    const token = localStorage.getItem("token")

    try {
      const res = await axios.post("/api/tasks/run", {
        provider,
        option,
        repoSrc,
        sshInput: sshKey,
        doVars: provider === "digitalocean" ? doVars : null,
        gkeVars: provider === "gke" ? gkeVars : null,
      }, { headers: { Authorization: token } })

      const taskId = res.data.task_id

      // Open WebSocket for live logs
      const ws = new WebSocket(`ws://localhost:8080/api/tasks/${taskId}/logs`)
      wsRef.current = ws

      ws.onmessage = (e) => {
        if (e.data === "[DONE]") { setRunning(false); return }
        setLogs((prev) => [...prev, e.data])
      }
      ws.onerror = () => { setLogs((prev) => [...prev, "[ERROR] WebSocket connection failed"]); setRunning(false) }
      ws.onclose = () => setRunning(false)

    } catch (err: any) {
      setLogs([`[ERROR] ${err.response?.data?.error || err.message}`])
      setRunning(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">🚀 Terraform & Ansible Control Panel</h1>
          <p className="text-gray-400 mt-1">Deploy and manage your cloud infrastructure from the browser</p>
        </div>

        {/* Cloud Provider Selector */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-lg mb-3">☁️ Cloud Provider</h3>
          <div className="flex gap-3">
            {([
              { key: "digitalocean", label: "DigitalOcean", icon: "🌊" },
              { key: "gke",          label: "Google Cloud GKE", icon: "🟡" },
            ] as const).map((p) => (
              <button key={p.key} onClick={() => setProvider(p.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all border-2 ${
                  provider === p.key
                    ? "border-blue-500 bg-blue-600/20 text-white"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                }`}>
                <span>{p.icon}</span> {p.label}
                {p.key === "gke" && <span className="text-xs bg-yellow-700 text-yellow-200 px-2 py-0.5 rounded-full">coming soon</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Repo Source */}
        <RepoSourceInput onChange={setRepoSrc} />

        {/* Cloud Provider Config */}
        {provider === "digitalocean" && <DigitalOceanForm onChange={setDOVars} />}
        {provider === "gke" && <GKEForm onChange={setGKEVars} />}

        {/* SSH Key */}
        <SSHKeyInput onChange={setSSHKey} />

        {/* Action Buttons */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-lg mb-3">⚡ Actions</h3>
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <button key={a.key} disabled={running}
                onClick={() => runJob(a.key)}
                className={`${a.color} disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-all`}>
                {running ? "⏳ Running..." : a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Log Panel */}
        {logs.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-lg">📜 Live Output</h3>
              {running && <span className="flex items-center gap-2 text-green-400 text-sm"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Running...</span>}
            </div>
            <div ref={logBoxRef}
              className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm space-y-0.5">
              {logs.map((line, i) => (
                <p key={i} className={
                  line.startsWith("[ERR]") ? "text-red-400" :
                  line.startsWith("[GUI]") ? "text-yellow-400" :
                  line === "[DONE]"        ? "text-green-400 font-bold" :
                  "text-green-300"
                }>{line}</p>
              ))}
            </div>
            <button onClick={() => setLogs([])} className="mt-2 text-xs text-gray-400 hover:text-gray-200">
              🗑 Clear logs
            </button>
          </div>
        )}

      </div>
    </main>
  )
}