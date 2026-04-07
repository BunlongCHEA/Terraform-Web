package main

import (
	"Terraform-Web/api"
	"Terraform-Web/db"
)

func main() {
	// Initialize database
	db.Init()

	// Start HTTP server
	r := api.SetupRouter()
	r.Run(":8080")
}
