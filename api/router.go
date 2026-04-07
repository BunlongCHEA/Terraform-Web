package api

import (
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Serve Next.js exported static files (next build && next export → out/)
	r.Static("/_next", "./web/out/_next")
	r.StaticFile("/favicon.ico", "./web/out/favicon.ico")
	r.NoRoute(func(c *gin.Context) {
		c.File("./web/out/index.html")
	})

	// API routes
	v1 := r.Group("/api")

	// Public
	v1.POST("/login", Login)

	// Protected — auth middleware applied per-route group
	protected := v1.Group("/")
	protected.Use(AuthMiddleware())
	{
		protected.GET("/projects", GetProjects)
		protected.POST("/projects", CreateProject)
		protected.POST("/tasks/run", RunTask)
		protected.GET("/tasks", GetTasks)
		protected.GET("/tasks/:id/logs", StreamLogs)
	}

	return r
}
