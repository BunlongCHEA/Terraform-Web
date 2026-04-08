package services

import (
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"

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

// RepoFileEntry represents a file or directory inside the repo
type RepoFileEntry struct {
	Name  string `json:"name"`
	Path  string `json:"path"`
	IsDir bool   `json:"is_dir"`
}

// ResolveRepo returns the local working directory of the repo.
// - If Type == "local", validates the path exists and returns it.
// - If Type == "url", clones (or pulls) into a temp dir and returns it.
func ResolveRepo(src RepoSource) (string, error) {
	switch src.Type {

	case "local":
		// Normalize path — converts Windows backslashes and resolves ~
		dir := normalizePath(src.LocalDir)
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			return "", errors.New("local directory does not exist: " + dir)
		}
		return dir, nil

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

// ListRepoFiles resolves the repo and returns a flat list of files/dirs
// in the top-level directory (non-recursive, one level deep).
func ListRepoFiles(src RepoSource) ([]RepoFileEntry, string, error) {
	repoDir, err := ResolveRepo(src)
	if err != nil {
		return nil, "", err
	}

	entries, err := os.ReadDir(repoDir)
	if err != nil {
		return nil, repoDir, errors.New("failed to read directory: " + err.Error())
	}

	// Sort: dirs first, then files
	sort.Slice(entries, func(i, j int) bool {
		if entries[i].IsDir() != entries[j].IsDir() {
			return entries[i].IsDir()
		}
		return entries[i].Name() < entries[j].Name()
	})

	files := make([]RepoFileEntry, 0, len(entries))
	for _, e := range entries {
		// Skip hidden files like .git
		if strings.HasPrefix(e.Name(), ".") {
			continue
		}
		files = append(files, RepoFileEntry{
			Name:  e.Name(),
			Path:  filepath.Join(repoDir, e.Name()),
			IsDir: e.IsDir(),
		})
	}

	return files, repoDir, nil
}

// normalizePath handles Windows paths (D:\...) and converts to a usable path.
// When running on Linux/WSL, converts D:\path → /mnt/d/path automatically.
func normalizePath(path string) string {
	if path == "" {
		return path
	}

	// If already a Unix path, return as-is
	if strings.HasPrefix(path, "/") {
		return filepath.Clean(path)
	}

	// Windows absolute path: D:\Terraform
	// Detect by pattern X:\ or X:/
	if len(path) >= 3 && path[1] == ':' {
		driveLetter := strings.ToLower(string(path[0]))
		rest := path[2:]
		// Normalize backslashes to forward slashes
		rest = strings.ReplaceAll(rest, "\\", "/")
		// Strip leading slash if present
		rest = strings.TrimPrefix(rest, "/")

		if runtime.GOOS == "windows" {
			// Running natively on Windows — keep as Windows path
			return filepath.FromSlash(string(path[0]) + ":/" + rest)
		}
		// Running on Linux/WSL — convert to WSL mount path
		return "/mnt/" + driveLetter + "/" + rest
	}

	// Relative or other paths — clean as-is
	return filepath.Clean(path)
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
