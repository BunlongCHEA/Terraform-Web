"use client"
import { type RefObject } from "react"

interface Props {
  logs: string[]
  running: boolean
  logBoxRef: RefObject<HTMLDivElement | null>
  onClear: () => void
}

function getLineColor(line: string): string {
  if (line.startsWith("[ERR]"))   return "text-red-400"
  if (line.startsWith("[GUI]"))   return "text-yellow-400"
  if (line.startsWith("[ERROR]")) return "text-red-400"
  if (line === "[DONE]")          return "text-green-400 font-bold"
  return "text-green-300"
}

export default function LogPanel({ logs, running, logBoxRef, onClear }: Props) {
  if (logs.length === 0) return null

  return (
    <div className="bg-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-lg">📜 Live Output</h3>
        <div className="flex items-center gap-3">
          {running && (
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Running...
            </span>
          )}
          <span className="text-gray-500 text-xs">{logs.length} lines</span>
        </div>
      </div>

      {/* Log Box */}
      <div
        ref={logBoxRef}
        className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm space-y-0.5"
      >
        {logs.map((line, i) => (
          <p key={i} className={getLineColor(line)}>
            {line}
          </p>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          🗑 Clear logs
        </button>
        <button
          onClick={() => {
            const text = logs.join("\n")
            const blob = new Blob([text], { type: "text/plain" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `terraform-log-${Date.now()}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          ⬇️ Download logs
        </button>
      </div>
    </div>
  )
}