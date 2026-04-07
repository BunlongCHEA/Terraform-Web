"use client"

type Provider = "digitalocean" | "gke"

interface Props {
  provider: Provider
  onChange: (p: Provider) => void
}

const PROVIDERS: { key: Provider; label: string; icon: string; badge?: string }[] = [
  { key: "digitalocean", label: "DigitalOcean", icon: "🌊" },
  { key: "gke",          label: "Google Cloud GKE", icon: "🟡", badge: "coming soon" },
]

export default function CloudProviderSelector({ provider, onChange }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-lg mb-3">☁️ Cloud Provider</h3>
      <div className="flex flex-wrap gap-3">
        {PROVIDERS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all border-2 ${
              provider === p.key
                ? "border-blue-500 bg-blue-600/20 text-white"
                : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
            {p.badge && (
              <span className="text-xs bg-yellow-700 text-yellow-200 px-2 py-0.5 rounded-full">
                {p.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}