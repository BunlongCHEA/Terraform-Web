package api

import (
	"Terraform-Web/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type RunTaskRequest struct {
	Option string `json:"option"` // "all", "plan", "apply", "rancher", "argocd", etc.
}

// In-memory log store per task (use DB/Redis in full production)
var taskLogs = map[string]chan services.JobResult{}

func RunTask(c *gin.Context) {
	var req RunTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	taskID := generateTaskID() // simple UUID
	logChan := make(chan services.JobResult, 1000)
	taskLogs[taskID] = logChan

	// Run in background goroutine — non-blocking
	go services.RunTerraformScript(req.Option, logChan)

	c.JSON(http.StatusOK, gin.H{"task_id": taskID})
}

func StreamLogs(c *gin.Context) {
	taskID := c.Param("id")
	logChan, ok := taskLogs[taskID]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}
	// Upgrade to WebSocket and stream logs
	services.StreamLogsToWS(c.Writer, c.Request, logChan)
}

func generateTaskID() string {
	return "task-" + time.Now().Format("20060102150405")
}
