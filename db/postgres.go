package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// Init connects to PostgreSQL using env vars and creates required tables.
// Set these env vars:
//
//	POSTGRES_HOST     (default: localhost)
//	POSTGRES_PORT     (default: 5432)
//	POSTGRES_USER     (default: postgres)
//	POSTGRES_PASSWORD (required)
//	POSTGRES_DB       (default: terraform_web)
func Init() {
	host := getEnv("POSTGRES_HOST", "localhost")
	port := getEnv("POSTGRES_PORT", "5432")
	user := getEnv("POSTGRES_USER", "postgres")
	password := getEnv("POSTGRES_PASSWORD", "postgres")
	dbName := getEnv("POSTGRES_DB", "terraform_web")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbName,
	)

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("[DB] Failed to open connection: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("[DB] Failed to ping PostgreSQL: %v", err)
	}

	log.Println("[DB] Connected to PostgreSQL successfully")
	createTables()
}

func createTables() {
	// users table — used by auth for login
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id         SERIAL PRIMARY KEY,
			username   TEXT UNIQUE NOT NULL,
			password   TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Fatalf("[DB] Failed to create users table: %v", err)
	}

	// projects table — stores repo source configs
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS projects (
			id          SERIAL PRIMARY KEY,
			name        TEXT NOT NULL,
			provider    TEXT NOT NULL,
			repo_type   TEXT NOT NULL,
			repo_url    TEXT,
			repo_dir    TEXT,
			created_at  TIMESTAMP DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Fatalf("[DB] Failed to create projects table: %v", err)
	}

	// tasks table — stores job run history
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS tasks (
			id          TEXT PRIMARY KEY,
			project_id  INTEGER REFERENCES projects(id) ON DELETE SET NULL,
			provider    TEXT NOT NULL,
			option      TEXT NOT NULL,
			status      TEXT NOT NULL DEFAULT 'running',
			created_at  TIMESTAMP DEFAULT NOW(),
			finished_at TIMESTAMP
		)
	`)
	if err != nil {
		log.Fatalf("[DB] Failed to create tasks table: %v", err)
	}

	log.Println("[DB] Tables ready")
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
