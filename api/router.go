package api

import (
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// API routes first — MUST be registered before NoRoute
	v1 := r.Group("/api")

	// Public
	v1.POST("/login", Login)

	// Directory listing — browse repo files
	v1.POST("/repo/browse", BrowseRepo)

	// WebSocket: auth via ?token= query param
	v1.GET("/tasks/:id/logs", StreamLogs)

	// Protected — auth middleware applied per-route group
	protected := v1.Group("/")
	protected.Use(AuthMiddleware())
	{
		protected.GET("/projects", GetProjects)
		protected.POST("/projects", CreateProject)
		protected.POST("/tasks/run", RunTask)
		protected.GET("/tasks", GetTasks)
		// protected.GET("/tasks/:id/logs", StreamLogs)
	}

	// Serve Next.js exported static files (next build && next export → out/)
	r.Static("/_next", "./web/out/_next")
	r.StaticFile("/favicon.ico", "./web/out/favicon.ico")

	// Catch-all for Next.js client-side routing — MUST be last
	r.NoRoute(func(c *gin.Context) {
		// Don't serve index.html for /api/* — return proper 404
		if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
			c.JSON(404, gin.H{"error": "API endpoint not found"})
			return
		}
		c.File("./web/out/index.html")
	})

	return r
}
