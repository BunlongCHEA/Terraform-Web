package api

import (
	"Terraform-Web/db"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Project struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Provider  string    `json:"provider"`
	RepoType  string    `json:"repo_type"`
	RepoURL   string    `json:"repo_url,omitempty"`
	RepoDir   string    `json:"repo_dir,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateProjectRequest struct {
	Name     string `json:"name"     binding:"required"`
	Provider string `json:"provider" binding:"required"`  // "digitalocean" or "gke"
	RepoType string `json:"repo_type" binding:"required"` // "url" or "local"
	RepoURL  string `json:"repo_url"`
	RepoDir  string `json:"repo_dir"`
}

// GetProjects returns all saved projects
func GetProjects(c *gin.Context) {
	rows, err := db.DB.Query(`
		SELECT id, name, provider, repo_type, COALESCE(repo_url,''), COALESCE(repo_dir,''), created_at
		FROM projects ORDER BY created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query projects"})
		return
	}
	defer rows.Close()

	projects := []Project{}
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Provider, &p.RepoType, &p.RepoURL, &p.RepoDir, &p.CreatedAt); err != nil {
			continue
		}
		projects = append(projects, p)
	}

	c.JSON(http.StatusOK, projects)
}

// CreateProject saves a new project
func CreateProject(c *gin.Context) {
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var id int
	err := db.DB.QueryRow(`
		INSERT INTO projects (name, provider, repo_type, repo_url, repo_dir)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, req.Name, req.Provider, req.RepoType, req.RepoURL, req.RepoDir).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Project created"})
}
