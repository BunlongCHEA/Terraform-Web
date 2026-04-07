package api

import (
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Serve Vue.js frontend
	r.Static("/assets", "./web/dist/assets")
	r.StaticFile("/", "./web/dist/index.html")

	// API routes
	v1 := r.Group("/api")
	{
		// Auth
		v1.POST("/login", Login)

		// Protected routes
		auth := v1.Group("/")
		auth.Use(AuthMiddleware())
		{
			auth.GET("/projects", GetProjects)
			auth.POST("/tasks/run", RunTask)        // trigger terraform_run.sh
			auth.GET("/tasks", GetTasks)            // job history
			auth.GET("/tasks/:id/logs", StreamLogs) // WebSocket live logs
		}
	}

	return r
}
