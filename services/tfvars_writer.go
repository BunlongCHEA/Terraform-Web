package services

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
)

// DigitalOceanVars matches your digitalocean/terraform.tfvars.example
type DigitalOceanVars struct {
	DoToken      string // DigitalOcean API token
	Region       string // e.g. "sgp1"
	DropletOS    string // e.g. "ubuntu-24-04-x64"
	DropletSize  string // e.g. "s-1vcpu-2gb"
	DropletCount int    // e.g. 1
	SSHKeyName   string
	SSHPath      string // final resolved path on disk
	ProjectName  string
}

// GKEVars for future Google Cloud GKE support
type GKEVars struct {
	ProjectID         string
	Region            string
	ClusterName       string
	NodeCount         int
	MachineType       string // e.g. "e2-standard-2"
	ServiceAccountB64 string // base64-encoded service account JSON
}

// SSHKeyInput — user provides either a path OR raw key content
type SSHKeyInput struct {
	Mode           string // "path" or "upload"
	DirectoryPath  string // used if Mode == "path"
	PrivateKeyData string // raw private key content if Mode == "upload"
	PublicKeyData  string // raw public key content if Mode == "upload" (optional)
}

// WriteDigitalOceanTfvars writes terraform.tfvars into repoDir/digitalocean/
func WriteDigitalOceanTfvars(repoDir string, vars DigitalOceanVars) error {
	content := fmt.Sprintf(`do_token      = "%s"
region        = "%s"
droplet_os    = "%s"
droplet_size  = "%s"
droplet_count = %d
ssh_key_name  = "%s"
ssh_path      = "%s"
project_name  = "%s"
`,
		vars.DoToken,
		vars.Region,
		vars.DropletOS,
		vars.DropletSize,
		vars.DropletCount,
		vars.SSHKeyName,
		vars.SSHPath,
		vars.ProjectName,
	)

	tfvarsPath := filepath.Join(repoDir, "digitalocean", "terraform.tfvars")
	return os.WriteFile(tfvarsPath, []byte(content), 0600)
}

// WriteGKETfvars writes terraform.tfvars for GKE into repoDir/gke/
func WriteGKETfvars(repoDir string, vars GKEVars) error {
	content := fmt.Sprintf(`project_id           = "%s"
region               = "%s"
cluster_name         = "%s"
node_count           = %d
machine_type         = "%s"
service_account_b64  = "%s"
`,
		vars.ProjectID,
		vars.Region,
		vars.ClusterName,
		vars.NodeCount,
		vars.MachineType,
		vars.ServiceAccountB64,
	)

	tfvarsPath := filepath.Join(repoDir, "gke", "terraform.tfvars")
	return os.WriteFile(tfvarsPath, []byte(content), 0600)
}

// ResolveSSHKey handles both path mode and upload mode.
// Returns the final SSH directory path to be written into tfvars ssh_path.
func ResolveSSHKey(input SSHKeyInput, repoDir string) (string, error) {
	switch input.Mode {

	case "path":
		// User provided an existing directory path — validate it
		if _, err := os.Stat(input.DirectoryPath); os.IsNotExist(err) {
			return "", fmt.Errorf("SSH path does not exist: %s", input.DirectoryPath)
		}
		return input.DirectoryPath, nil

	case "upload":
		// Save uploaded key content into repoDir/digitalocean/ssh_keys/
		sshDir := filepath.Join(repoDir, "digitalocean", "ssh_keys")
		if err := os.MkdirAll(sshDir, 0700); err != nil {
			return "", err
		}

		// Private key — required
		if input.PrivateKeyData == "" {
			return "", fmt.Errorf("private key content is required when using upload mode")
		}
		privPath := filepath.Join(sshDir, "id_rsa_digitalocean")
		if err := os.WriteFile(privPath, []byte(input.PrivateKeyData), 0600); err != nil {
			return "", err
		}

		// Public key — optional, generate notice if missing
		if input.PublicKeyData != "" {
			pubPath := filepath.Join(sshDir, "id_rsa_digitalocean.pub")
			if err := os.WriteFile(pubPath, []byte(input.PublicKeyData), 0644); err != nil {
				return "", err
			}
		}

		return sshDir, nil

	default:
		return "", fmt.Errorf("invalid SSH mode: must be 'path' or 'upload'")
	}
}

// ConvertServiceAccountToBase64 converts a GKE service account JSON string to base64
func ConvertServiceAccountToBase64(jsonContent string) string {
	return base64.StdEncoding.EncodeToString([]byte(jsonContent))
}
