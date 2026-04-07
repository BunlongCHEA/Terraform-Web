"use client"

interface Action {
  key: string
  label: string
  color: string
}

const ACTIONS: Action[] = [
  { key: "all",        label: "▶ Full Run",           color: "bg-purple-600 hover:bg-purple-500" },
  { key: "plan",       label: "📋 Plan",               color: "bg-blue-600 hover:bg-blue-500"   },
  { key: "apply",      label: "✅ Apply",              color: "bg-green-600 hover:bg-green-500"  },
  { key: "ansible",    label: "🔧 Install Ansible",    color: "bg-sky-600 hover:bg-sky-500"     },
  { key: "rancher",    label: "🐄 Install Rancher",    color: "bg-sky-600 hover:bg-sky-500"     },
  { key: "argocd",     label: "🐙 Install ArgoCD",     color: "bg-sky-600 hover:bg-sky-500"     },
  { key: "prometheus", label: "📊 Install Prometheus", color: "bg-sky-600 hover:bg-sky-500"     },
  { key: "destroy",    label: "💥 Destroy All",        color: "bg-red-600 hover:bg-red-500"     },
]

interface Props {
  running: boolean
  onRun: (option: string) => void
}

export default function ActionButtons({ running, onRun }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold text-lg mb-3">⚡ Actions</h3>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            disabled={running}
            onClick={() => onRun(a.key)}
            className={`
              ${a.color}
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white px-4 py-2 rounded-lg text-sm font-medium transition-all
            `}
          >
            {running ? "⏳ Running..." : a.label}
          </button>
        ))}
      </div>
      {running && (
        <p className="text-yellow-400 text-xs mt-3">
          ⚠️ A job is currently running. Please wait before starting another.
        </p>
      )}
    </div>
  )
}