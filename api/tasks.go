package api

import (
	"Terraform-Web/db"
	"Terraform-Web/services"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// RunTaskRequest matches the full payload sent from the Next.js frontend
type RunTaskRequest struct {
	Provider string                     `json:"provider"` // "digitalocean" or "gke"
	Option   string                     `json:"option"`   // "all", "plan", "apply", "rancher", etc.
	RepoSrc  services.RepoSource        `json:"repoSrc"`
	SSHInput services.SSHKeyInput       `json:"sshInput"`
	DOVars   *services.DigitalOceanVars `json:"doVars,omitempty"`
	GKEVars  *services.GKEVars          `json:"gkeVars,omitempty"`
}

// Task represents a job record
type Task struct {
	ID         string     `json:"id"`
	Provider   string     `json:"provider"`
	Option     string     `json:"option"`
	Status     string     `json:"status"`
	CreatedAt  time.Time  `json:"created_at"`
	FinishedAt *time.Time `json:"finished_at,omitempty"`
}

// in-memory log channel store — keyed by task ID
var (
	taskLogsMu sync.RWMutex
	taskLogs   = map[string]chan services.JobResult{}
)

// RunTask triggers a new terraform job
func RunTask(c *gin.Context) {
	var req RunTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if req.Provider == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provider is required"})
		return
	}
	if req.Option == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "option is required"})
		return
	}

	taskID := "task-" + time.Now().Format("20060102-150405-000")
	logChan := make(chan services.JobResult, 1000)

	// Store channel for WebSocket streaming
	taskLogsMu.Lock()
	taskLogs[taskID] = logChan
	taskLogsMu.Unlock()

	// Persist task to DB
	_, _ = db.DB.Exec(
		`INSERT INTO tasks (id, provider, option, status) VALUES ($1, $2, $3, 'running')`,
		taskID, req.Provider, req.Option,
	)

	// Build runner request
	runReq := services.RunRequest{
		Provider: req.Provider,
		Option:   req.Option,
		RepoSrc:  req.RepoSrc,
		SSHInput: req.SSHInput,
		DOVars:   req.DOVars,
		GKEVars:  req.GKEVars,
	}

	// Run job in background goroutine — non-blocking
	go func() {
		services.RunTerraformJob(runReq, logChan)

		// Update task status when done
		now := time.Now()
		_, _ = db.DB.Exec(
			`UPDATE tasks SET status='done', finished_at=$1 WHERE id=$2`,
			now, taskID,
		)

		// Cleanup channel after a delay
		time.AfterFunc(10*time.Minute, func() {
			taskLogsMu.Lock()
			delete(taskLogs, taskID)
			taskLogsMu.Unlock()
		})
	}()

	c.JSON(http.StatusOK, gin.H{"task_id": taskID})
}

// StreamLogs upgrades to WebSocket and streams live logs.
// Auth is via ?token=<jwt> query parameter because browsers
// cannot send custom headers with the WebSocket API.
func StreamLogs(c *gin.Context) {
	// Validate JWT from query param
	tokenStr := c.Query("token")
	if tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing token query parameter"})
		return
	}

	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	// Find log channel
	taskID := c.Param("id")

	taskLogsMu.RLock()
	logChan, ok := taskLogs[taskID]
	taskLogsMu.RUnlock()

	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found or already completed"})
		return
	}

	services.StreamLogsToWS(c.Writer, c.Request, logChan)
}

// GetTasks returns job history from DB
func GetTasks(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT id, provider, option, status, created_at, finished_at
		FROM tasks ORDER BY created_at DESC LIMIT 50
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query tasks"})
		return
	}
	defer rows.Close()

	tasks := []Task{}
	for rows.Next() {
		var t Task
		if err := rows.Scan(&t.ID, &t.Provider, &t.Option, &t.Status, &t.CreatedAt, &t.FinishedAt); err != nil {
			continue
		}
		tasks = append(tasks, t)
	}

	c.JSON(http.StatusOK, tasks)
}
