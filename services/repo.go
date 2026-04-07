package services

import (
	"errors"
	"os"

	gogit "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/transport/http"
)

type RepoSource struct {
	Type     string // "url" or "local"
	URL      string // used if Type == "url"
	Username string // optional, for private repos
	Password string // optional, for private repos (token or password)
	LocalDir string // used if Type == "local"
}

// ResolveRepo returns the local working directory of the repo.
// - If Type == "local", validates the path exists and returns it.
// - If Type == "url", clones (or pulls) into a temp dir and returns it.
func ResolveRepo(src RepoSource) (string, error) {
	switch src.Type {

	case "local":
		if _, err := os.Stat(src.LocalDir); os.IsNotExist(err) {
			return "", errors.New("local directory does not exist: " + src.LocalDir)
		}
		return src.LocalDir, nil

	case "url":
		if src.URL == "" {
			return "", errors.New("repo URL is required")
		}

		// Clone into /tmp/terraform-gui-repos/<repo-name>
		cloneDir := "/tmp/terraform-gui-repos/" + sanitizeName(src.URL)

		cloneOpts := &gogit.CloneOptions{
			URL:      src.URL,
			Progress: os.Stdout,
		}

		// Attach credentials only if provided (private repo)
		if src.Username != "" || src.Password != "" {
			cloneOpts.Auth = &http.BasicAuth{
				Username: src.Username, // GitHub: any non-empty string works with token
				Password: src.Password, // GitHub: use Personal Access Token here
			}
		}

		// If already cloned, do a git pull instead
		if _, err := os.Stat(cloneDir); err == nil {
			repo, err := gogit.PlainOpen(cloneDir)
			if err == nil {
				w, _ := repo.Worktree()
				pullOpts := &gogit.PullOptions{RemoteName: "origin"}
				if cloneOpts.Auth != nil {
					pullOpts.Auth = cloneOpts.Auth
				}
				// Ignore "already up to date" error
				_ = w.Pull(pullOpts)
				return cloneDir, nil
			}
		}

		// Fresh clone
		if err := os.MkdirAll(cloneDir, 0755); err != nil {
			return "", err
		}

		_, err := gogit.PlainClone(cloneDir, false, cloneOpts)
		if err != nil {
			return "", errors.New("failed to clone repo: " + err.Error())
		}

		return cloneDir, nil

	default:
		return "", errors.New("invalid repo source type, must be 'url' or 'local'")
	}
}

// sanitizeName converts a URL to a safe directory name
func sanitizeName(url string) string {
	safe := ""
	for _, c := range url {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_' {
			safe += string(c)
		} else {
			safe += "_"
		}
	}
	if len(safe) > 80 {
		return safe[len(safe)-80:]
	}
	return safe
}
