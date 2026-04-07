# I. Project Structure

```bash
terraform-gui/
├── main.go                  # Entry point
├── go.mod
├── api/
│   ├── router.go            # HTTP routes
│   ├── auth.go              # JWT login/logout
│   ├── projects.go          # Project management
│   └── tasks.go             # Run terraform/ansible jobs
├── services/
│   ├── runner.go            # Execute shell commands (terraform_run.sh)
│   ├── job_queue.go         # Queue & manage long-running jobs
│   └── websocket.go         # Stream live logs to browser
├── db/
│   └── sqlite.go            # Store job history, users
├── web/                     # Vue.js frontend
│   ├── src/
│   │   ├── views/
│   │   │   ├── Dashboard.vue
│   │   │   ├── RunJob.vue   # Trigger terraform/ansible
│   │   │   └── Logs.vue     # Live log streaming
│   │   ├── components/
│   │   └── main.js
│   └── package.json
└── Dockerfile
```

