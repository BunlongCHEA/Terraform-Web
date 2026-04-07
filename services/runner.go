package services

import (
	"bufio"
	"fmt"
	"os/exec"
	"path/filepath"
)

type JobResult struct {
	LogLine string
	Done    bool
	Error   error
}

type RunRequest struct {
	Provider string     // "digitalocean" or "gke"
	Option   string     // "all", "plan", "apply", "destroy", "rancher", etc.
	RepoSrc  RepoSource // URL or local path
	DOVars   *DigitalOceanVars
	GKEVars  *GKEVars
	SSHInput SSHKeyInput
}

// RunTerraformJob resolves the repo, writes tfvars, then executes terraform_run.sh
func RunTerraformJob(req RunRequest, logChan chan<- JobResult) {
	// Step 1: Resolve repo (clone from URL or use local dir)
	logChan <- JobResult{LogLine: fmt.Sprintf("[GUI] Resolving repo source: %s ...", req.RepoSrc.Type)}
	repoDir, err := ResolveRepo(req.RepoSrc)
	if err != nil {
		logChan <- JobResult{Error: fmt.Errorf("repo error: %w", err), Done: true}
		return
	}
	logChan <- JobResult{LogLine: "[GUI] Repo ready at: " + repoDir}

	// Step 2: Resolve SSH keys
	logChan <- JobResult{LogLine: "[GUI] Resolving SSH keys..."}
	sshPath, err := ResolveSSHKey(req.SSHInput, repoDir)
	if err != nil {
		logChan <- JobResult{Error: fmt.Errorf("SSH key error: %w", err), Done: true}
		return
	}
	logChan <- JobResult{LogLine: "[GUI] SSH keys resolved at: " + sshPath}

	// Step 3: Write terraform.tfvars based on provider
	logChan <- JobResult{LogLine: "[GUI] Writing terraform.tfvars..."}
	switch req.Provider {
	case "digitalocean":
		if req.DOVars == nil {
			logChan <- JobResult{Error: fmt.Errorf("DigitalOcean vars are required"), Done: true}
			return
		}
		req.DOVars.SSHPath = sshPath
		if err := WriteDigitalOceanTfvars(repoDir, *req.DOVars); err != nil {
			logChan <- JobResult{Error: fmt.Errorf("tfvars write error: %w", err), Done: true}
			return
		}

	case "gke":
		if req.GKEVars == nil {
			logChan <- JobResult{Error: fmt.Errorf("GKE vars are required"), Done: true}
			return
		}
		if err := WriteGKETfvars(repoDir, *req.GKEVars); err != nil {
			logChan <- JobResult{Error: fmt.Errorf("tfvars write error: %w", err), Done: true}
			return
		}

	default:
		logChan <- JobResult{Error: fmt.Errorf("unknown provider: %s", req.Provider), Done: true}
		return
	}
	logChan <- JobResult{LogLine: "[GUI] terraform.tfvars written ✔"}

	// Step 4: Determine script path based on provider
	var scriptPath string
	switch req.Provider {
	case "digitalocean":
		scriptPath = filepath.Join(repoDir, "digitalocean", "terraform_run.sh")
	case "gke":
		scriptPath = filepath.Join(repoDir, "gke", "terraform_run.sh")
	}

	// Step 5: Execute the shell script
	logChan <- JobResult{LogLine: fmt.Sprintf("[GUI] Running: bash %s %s", scriptPath, req.Option)}
	cmd := exec.Command("bash", scriptPath, req.Option)
	cmd.Dir = filepath.Dir(scriptPath)

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		logChan <- JobResult{Error: fmt.Errorf("failed to start script: %w", err), Done: true}
		return
	}

	// Stream stdout
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			logChan <- JobResult{LogLine: scanner.Text()}
		}
	}()

	// Stream stderr
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			logChan <- JobResult{LogLine: "[ERR] " + scanner.Text()}
		}
	}()

	cmd.Wait()
	logChan <- JobResult{Done: true}
}
