"use client"
import { useState } from "react"

export type SSHKeyData = {
  mode: "path" | "upload"
  directoryPath?: string
  privateKeyData?: string
  publicKeyData?: string
}

export default function SSHKeyInput({ onChange }: { onChange: (v: SSHKeyData) => void }) {
  const [mode, setMode] = useState<"path" | "upload">("path")
  const [dirPath, setDirPath] = useState("")
  const [privKey, setPrivKey] = useState("")
  const [pubKey, setPubKey] = useState("")

  const update = (patch: Partial<SSHKeyData>) => {
    onChange({ mode, directoryPath: dirPath, privateKeyData: privKey, publicKeyData: pubKey, ...patch })
  }

  const handleFileRead = (file: File, setter: (v: string) => void, key: keyof SSHKeyData) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const val = e.target?.result as string
      setter(val)
      update({ [key]: val })
    }
    reader.readAsText(file)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-4">
      <h3 className="text-white font-semibold text-lg">🔑 SSH Key</h3>

      {/* Toggle */}
      <div className="flex gap-2">
        {(["path", "upload"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); update({ mode: m }) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {m === "path" ? "📂 Directory Path" : "⬆️ Upload Key Content"}
          </button>
        ))}
      </div>

      {mode === "path" && (
        <div>
          <input
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
            placeholder="/home/user/.ssh  or  ~/.ssh"
            value={dirPath}
            onChange={(e) => { setDirPath(e.target.value); update({ directoryPath: e.target.value }) }}
          />
          <p className="text-gray-400 text-xs mt-1">
            Directory must contain <code className="text-blue-400">id_rsa_digitalocean</code> and optionally <code className="text-blue-400">id_rsa_digitalocean.pub</code>
          </p>
        </div>
      )}

      {mode === "upload" && (
        <div className="space-y-3">
          {/* Private Key — Required */}
          <div>
            <label className="text-gray-300 text-sm block mb-1">
              Private Key <span className="text-red-400">*required</span>
            </label>
            <div className="flex gap-2">
              <textarea
                className="flex-1 bg-gray-700 text-white text-xs px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 outline-none h-24 font-mono"
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                value={privKey}
                onChange={(e) => { setPrivKey(e.target.value); update({ privateKeyData: e.target.value }) }}
              />
              <label className="cursor-pointer bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg text-xs flex items-center">
                📄 Browse
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileRead(e.target.files[0], setPrivKey, "privateKeyData")} />
              </label>
            </div>
          </div>

          {/* Public Key — Optional */}
          <div>
            <label className="text-gray-300 text-sm block mb-1">
              Public Key <span className="text-gray-500">(optional — recommended)</span>
            </label>
            <div className="flex gap-2">
              <textarea
                className="flex-1 bg-gray-700 text-white text-xs px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 outline-none h-16 font-mono"
                placeholder="ssh-rsa AAAA..."
                value={pubKey}
                onChange={(e) => { setPubKey(e.target.value); update({ publicKeyData: e.target.value }) }}
              />
              <label className="cursor-pointer bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg text-xs flex items-center">
                📄 Browse
                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileRead(e.target.files[0], setPubKey, "publicKeyData")} />
              </label>
            </div>
            <p className="text-gray-400 text-xs mt-1">💡 Providing both private + public is recommended. Private key alone is sufficient for most operations.</p>
          </div>
        </div>
      )}
    </div>
  )
}