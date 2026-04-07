"use client"
import { useState, useRef, useEffect } from "react"
import RepoSourceInput, { type RepoSource } from "@/components/RepoSourceInput"
import SSHKeyInput, { type SSHKeyData } from "@/components/SSHKeyInput"
import DigitalOceanForm, { type DOVars } from "@/components/DigitalOceanForm"
import GKEForm, { type GKEVars } from "@/components/GKEForm"
import CloudProviderSelector from "@/components/CloudProviderSelector"
import ActionButtons from "@/components/ActionButtons"
import LogPanel from "@/components/LogPanel"
import axios, { AxiosError } from "axios"

type Provider = "digitalocean" | "gke"

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

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight
    }
  }, [logs])

  const runJob = async (option: string) => {
    setLogs([])
    setRunning(true)
    const token = localStorage.getItem("token")

    try {
      const res = await axios.post(
        "/api/tasks/run",
        {
          provider,
          option,
          repoSrc,
          sshInput: sshKey,
          doVars: provider === "digitalocean" ? doVars : null,
          gkeVars: provider === "gke" ? gkeVars : null,
        },
        { headers: { Authorization: token ?? "" } }
      )

      const taskId = res.data.task_id as string

      // Open WebSocket for live log streaming
      const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/tasks/${taskId}/logs`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = (e: MessageEvent<string>) => {
        if (e.data === "[DONE]") {
          setRunning(false)
          return
        }
        setLogs((prev) => [...prev, e.data])
      }

      ws.onerror = () => {
        setLogs((prev) => [...prev, "[ERROR] WebSocket connection failed"])
        setRunning(false)
      }

      ws.onclose = () => setRunning(false)

    } catch (err: unknown) {
      // Typed error handling — no 'any' needed
      if (err instanceof AxiosError) {
        const message = (err.response?.data as { error?: string })?.error ?? err.message
        setLogs([`[ERROR] ${message}`])
      } else if (err instanceof Error) {
        setLogs([`[ERROR] ${err.message}`])
      } else {
        setLogs(["[ERROR] An unexpected error occurred"])
      }
      setRunning(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">🚀 Terraform &amp; Ansible Control Panel</h1>
          <p className="text-gray-400 mt-1">Deploy and manage your cloud infrastructure from the browser</p>
        </div>

        {/* Cloud Provider Selector */}
        <CloudProviderSelector provider={provider} onChange={setProvider} />

        {/* Repo Source */}
        <RepoSourceInput onChange={setRepoSrc} />

        {/* Cloud Provider Config Form */}
        {provider === "digitalocean" && <DigitalOceanForm onChange={setDOVars} />}
        {provider === "gke" && <GKEForm onChange={setGKEVars} />}

        {/* SSH Key */}
        <SSHKeyInput onChange={setSSHKey} />

        {/* Action Buttons */}
        <ActionButtons running={running} onRun={runJob} />

        {/* Live Log Panel */}
        <LogPanel logs={logs} running={running} logBoxRef={logBoxRef} onClear={() => setLogs([])} />

      </div>
    </main>
  )
}