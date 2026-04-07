package main

import (
	"Terraform-Web/api"
	"Terraform-Web/db"
	"log"
	"os"
)

func main() {
	// Initialize database
	db.Init()

	// Start HTTP server
	r := api.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[SERVER] Starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("[SERVER] Failed to start: %v", err)
	}
}
