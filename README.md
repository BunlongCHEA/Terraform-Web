# I. Project Structure

```bash
terraform-gui/
├── main.go
├── go.mod
├── api/
│   ├── router.go
│   ├── auth.go
│   ├── tasks.go
│   └── projects.go
├── services/
│   ├── runner.go         ← Updated: URL repo + local path
│   ├── repo.go           ← Git clone logic
│   ├── tfvars_writer.go  ← Write terraform.tfvars from UI input
│   ├── websocket.go
│   └── job_queue.go
├── web/                  ← Next.js + TailwindCSS
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    ← Dashboard
│   │   └── configure/
│   │       └── page.tsx                ← Cloud provider config
│   ├── components/
│   │   ├── CloudProviderSelector.tsx   ← DO vs GKE switcher
│   │   ├── DigitalOceanForm.tsx        ← DO tfvars inputs
│   │   ├── GKEForm.tsx                 ← GKE tfvars inputs
│   │   ├── SSHKeyInput.tsx             ← SSH key upload or path
│   │   ├── RepoSourceInput.tsx         ← URL or local path
│   │   ├── ActionButtons.tsx           ← Run/Plan/Destroy etc.
│   │   └── LogPanel.tsx                ← Live WebSocket log stream
│   ├── tailwind.config.ts
│   └── package.json
└── Dockerfile
```

II. How to Start

## 1. Go: Start
Initialize Go module and download dependencies
```bash
go mod init Terraform-Web
go mod tidy
```

Or run locally, but need to start PostgreSQL First
Then run:
```bash
go run .
```

## 2. Next.JS: Start

```bash
cd web
npx create-next-app@latest . --typescript --tailwind --app --src-dir
npm install axios
```
