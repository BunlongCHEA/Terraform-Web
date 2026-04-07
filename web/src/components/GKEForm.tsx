"use client"
import { useState } from "react"

export type GKEVars = {
  projectID: string
  region: string
  clusterName: string
  nodeCount: number
  machineType: string
  serviceAccountB64: string
  saInputMode: "json" | "base64"
}

export default function GKEForm({ onChange }: { onChange: (v: GKEVars) => void }) {
  const [vars, setVars] = useState<GKEVars>({
    projectID: "", region: "asia-southeast1", clusterName: "my-gke-cluster",
    nodeCount: 1, machineType: "e2-standard-2", serviceAccountB64: "", saInputMode: "json"
  })
  const [saJSON, setSaJSON] = useState("")

  const update = (patch: Partial<GKEVars>) => {
    const next = { ...vars, ...patch }
    setVars(next)
    onChange(next)
  }

  const handleSAJson = (json: string) => {
    setSaJSON(json)
    // Auto-convert JSON → base64
    const b64 = btoa(unescape(encodeURIComponent(json)))
    update({ serviceAccountB64: b64, saInputMode: "json" })
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <img src="https://www.gstatic.com/devrel-devsite/prod/vfe5b685b801830b4fa29b1c14cee9a3803dd89a61b9f6c12f97cad36d2be92aa/cloud/images/favicons/onecloud/apple-icon.png" className="h-6 w-6" alt="GCP" />
        <h3 className="text-white font-semibold text-lg">Google Cloud GKE Configuration</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-300 text-sm block mb-1">GCP Project ID <span className="text-red-400">*</span></label>
          <input className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 outline-none"
            placeholder="my-gcp-project-id" value={vars.projectID}
            onChange={(e) => update({ projectID: e.target.value })} />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">
            Region
            <a href="https://cloud.google.com/compute/docs/regions-zones" target="_blank"
              className="ml-2 text-yellow-400 hover:text-yellow-300 text-xs">🔗 See all regions</a>
          </label>
          <input className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 outline-none"
            placeholder="asia-southeast1" value={vars.region}
            onChange={(e) => update({ region: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-300 text-sm block mb-1">Cluster Name</label>
          <input className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 outline-none"
            placeholder="my-gke-cluster" value={vars.clusterName}
            onChange={(e) => update({ clusterName: e.target.value })} />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">Node Count</label>
          <input type="number" min={1} className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 outline-none"
            value={vars.nodeCount}
            onChange={(e) => update({ nodeCount: parseInt(e.target.value) || 1 })} />
        </div>
      </div>

      <div>
        <label className="text-gray-300 text-sm block mb-1">
          Machine Type
          <a href="https://cloud.google.com/compute/docs/machine-resource" target="_blank"
            className="ml-2 text-yellow-400 hover:text-yellow-300 text-xs">🔗 See all machine types</a>
        </label>
        <input className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 outline-none"
          placeholder="e2-standard-2" value={vars.machineType}
          onChange={(e) => update({ machineType: e.target.value })} />
      </div>

      {/* Service Account */}
      <div>
        <label className="text-gray-300 text-sm block mb-2">Service Account <span className="text-red-400">*</span></label>
        <div className="flex gap-2 mb-3">
          {(["json", "base64"] as const).map((m) => (
            <button key={m} onClick={() => update({ saInputMode: m })}
              className={`px-3 py-1 rounded text-sm transition-all ${vars.saInputMode === m ? "bg-yellow-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
              {m === "json" ? "📋 Paste JSON → auto base64" : "🔤 Paste base64 directly"}
            </button>
          ))}
        </div>

        {vars.saInputMode === "json" ? (
          <div>
            <textarea
              className="w-full bg-gray-700 text-white text-xs px-3 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 outline-none h-28 font-mono"
              placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'}
              value={saJSON}
              onChange={(e) => handleSAJson(e.target.value)}
            />
            {vars.serviceAccountB64 && (
              <p className="text-green-400 text-xs mt-1">✔ Auto-converted to base64 ({vars.serviceAccountB64.length} chars)</p>
            )}
          </div>
        ) : (
          <textarea
            className="w-full bg-gray-700 text-white text-xs px-3 py-2 rounded-lg border border-gray-600 focus:border-yellow-400 outline-none h-20 font-mono"
            placeholder="eyJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsIC4uLn0="
            value={vars.serviceAccountB64}
            onChange={(e) => update({ serviceAccountB64: e.target.value, saInputMode: "base64" })}
          />
        )}
      </div>
    </div>
  )
}