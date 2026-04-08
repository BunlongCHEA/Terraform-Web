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
	host := getEnv("POSTGRES_HOST", "172.31.16.1")
	port := getEnv("POSTGRES_PORT", "5433")
	user := getEnv("POSTGRES_USER", "postgres")
	password := getEnv("POSTGRES_PASSWORD", "12345")
	dbName := getEnv("POSTGRES_DB", "terraform_web")

	// Step 1: Connect to the default "postgres" database first
	// to check/create our target database
	adminDSN := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=postgres sslmode=disable",
		host, port, user, password,
	)

	adminDB, err := sql.Open("postgres", adminDSN)
	if err != nil {
		log.Fatalf("[DB] Failed to open admin connection: %v", err)
	}
	defer adminDB.Close()

	if err = adminDB.Ping(); err != nil {
		log.Fatalf("[DB] Failed to ping PostgreSQL server: %v", err)
	}

	// Step 2: Check if target database exists
	var exists bool
	err = adminDB.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)`,
		dbName,
	).Scan(&exists)
	if err != nil {
		log.Fatalf("[DB] Failed to check database existence: %v", err)
	}

	// Step 3: Create database if it does not exist
	if !exists {
		log.Printf("[DB] Database '%s' not found — creating...", dbName)

		// Cannot use parameterized queries for CREATE DATABASE
		_, err = adminDB.Exec(fmt.Sprintf(`CREATE DATABASE "%s"`, dbName))
		if err != nil {
			log.Fatalf("[DB] Failed to create database '%s': %v", dbName, err)
		}
		log.Printf("[DB] Database '%s' created successfully", dbName)
	} else {
		log.Printf("[DB] Database '%s' already exists", dbName)
	}

	// Step 4: Connect to the target database
	targetDSN := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbName,
	)

	DB, err = sql.Open("postgres", targetDSN)
	if err != nil {
		log.Fatalf("[DB] Failed to open connection to '%s': %v", dbName, err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("[DB] Failed to ping database '%s': %v", dbName, err)
	}

	log.Printf("[DB] Connected to PostgreSQL database '%s' successfully", dbName)

	// Step 5: Create tables if they do not exist
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
