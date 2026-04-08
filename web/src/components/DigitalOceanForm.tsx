"use client"
import { useState } from "react"

export type DOVars = {
  doToken: string
  region: string
  dropletOS: string
  dropletSize: string
  dropletCount: number
  sshKeyName: string
  projectName: string
}

export default function DigitalOceanForm({ onChange }: { onChange: (v: DOVars) => void }) {
  const [vars, setVars] = useState<DOVars>({
    doToken: "", region: "sgp1", dropletOS: "ubuntu-24-04-x64",
    dropletSize: "s-1vcpu-2gb", dropletCount: 1,
    sshKeyName: "terraform-ansible-key", projectName: "terraform-ansible"
  })

  const update = (patch: Partial<DOVars>) => {
    const next = { ...vars, ...patch }
    setVars(next)
    onChange(next)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <img src="https://upload.wikimedia.org/wikipedia/commons/f/ff/DigitalOcean_logo.svg" className="h-6 w-6" alt="DO" />
        <h3 className="text-white font-semibold text-lg">DigitalOcean Configuration</h3>
      </div>

      {/* API Token */}
      <div>
        <label className="text-gray-300 text-sm block mb-1">API Token <span className="text-red-400">*</span></label>
        <input
          type="password"
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
          placeholder="dop_v1_xxxxxxxxxxxx"
          value={vars.doToken}
          onChange={(e) => update({ doToken: e.target.value })}
        />
      </div>

      {/* Region + Size on same row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-300 text-sm block mb-1">
            Region
            <a href="https://docs.digitalocean.com/platform/regional-availability/" target="_blank"
              className="ml-2 text-blue-400 hover:text-blue-300 text-xs">🔗 See all regions</a>
          </label>
          <input
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
            placeholder="sgp1"
            value={vars.region}
            onChange={(e) => update({ region: e.target.value })}
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">
            Droplet Size
            <a href="https://slugs.do-api.dev/" target="_blank"
              className="ml-2 text-blue-400 hover:text-blue-300 text-xs">🔗 See all sizes</a>
          </label>
          <input
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
            placeholder="s-1vcpu-2gb"
            value={vars.dropletSize}
            onChange={(e) => update({ dropletSize: e.target.value })}
          />
        </div>
      </div>

      {/* OS + Count */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-300 text-sm block mb-1">
            OS Image
            <a href="https://slugs.do-api.dev/" target="_blank"
              className="ml-2 text-blue-400 hover:text-blue-300 text-xs">🔗 See OS slugs</a>
          </label>
          <input
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
            placeholder="ubuntu-24-04-x64"
            value={vars.dropletOS}
            onChange={(e) => update({ dropletOS: e.target.value })}
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">Droplet Count</label>
          <input
            type="number" min={1}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
            value={vars.dropletCount}
            onChange={(e) => update({ dropletCount: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      {/* SSH Key Name + Project Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-300 text-sm block mb-1">SSH Key Name</label>
          <input
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
            placeholder="terraform-ansible-key"
            value={vars.sshKeyName}
            onChange={(e) => update({ sshKeyName: e.target.value })}
          />
        </div>
        <div>
          <label className="text-gray-300 text-sm block mb-1">Project Name</label>
          <input
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
            placeholder="ansible-lab"
            value={vars.projectName}
            onChange={(e) => update({ projectName: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}