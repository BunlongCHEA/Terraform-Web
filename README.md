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

Then run locally:
```bash
npm run dev
```

## 3. Connect to Postgres: Run on Window WSL

+ Find your Windows IP from WSL

If run on Widow WSL Ubuntu, and require to connect DB Postgres
```bash
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'

# OR

ip route show default | awk '{print $3}'
```

+ Allow PostgreSQL on Windows to accept WSL connections

Open pg_hba.conf on Windows (usually at):
```bash
C:\Program Files\PostgreSQL\17\data\pg_hba.conf
```

Add this line at the bottom:
```bash
host    all    all    172.31.0.0/16    md5
```
The 172.31.0.0/16 covers all WSL IP ranges — safe for local dev.

+ Allow PostgreSQL to listen on all interfaces

Open postgresql.conf on Windows (same folder):
```bash
C:\Program Files\PostgreSQL\17\data\postgresql.conf
```

Find and change:
```bash
listen_addresses = '*'
```

+ Restart PostgreSQL on Windows

```bash
# Run in Windows PowerShell as Admin
Restart-Service postgresql-x64-16
```

+ Open the Windows Firewall

- # Windows Defender Firewall with Advanced Security #
- # Inbound Rules # > # New Rule #
- # Port # > # TCP # > Specific local ports: # 5433 # (based on postgres config port)
- # Allow the connection #