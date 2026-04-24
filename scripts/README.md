# Deployment helper scripts

Bash scripts that back the manual steps in `docs/DEPLOYMENT-AWS.md` and
the `Jenkinsfile`. All scripts are idempotent — safe to re-run.

| Script | What it does |
|---|---|
| `aws-bootstrap.sh ecr` | Creates the two ECR repositories |
| `aws-bootstrap.sh eks` | Creates the EKS cluster + installs the AWS Load Balancer Controller |
| `aws-bootstrap.sh all` | Runs ecr + eks in one go (~20 min) |
| `deploy.sh` | Applies the Kubernetes manifests against the current cluster |

## Running on Windows

These are bash scripts. Use one of:
- **Git Bash** (ships with Git for Windows)
- **WSL 2** (recommended if you do this often)
- **A Linux Jenkins agent** — the Jenkinsfile invokes the same commands

Don't forget to `chmod +x scripts/*.sh` on a Linux/Mac host before running.
