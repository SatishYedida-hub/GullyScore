# Deploying GullyScore on AWS (EKS + Jenkins + Docker)

This guide walks you from an empty AWS account to a working,
load-balanced GullyScore deployment on Amazon EKS, built and shipped by a
Jenkins pipeline. The `feature` branch is used throughout for testing
before promoting to `main`.

High-level architecture:

```
               ┌──────────────┐
  You ───push──┤ GitHub repo  │
               │ branch=feature │
               └─────┬────────┘
                     │ webhook
                     ▼
               ┌──────────────┐      docker build / push
               │   Jenkins    │ ─────────────────────────────▶  Amazon ECR
               └─────┬────────┘
                     │ kubectl apply
                     ▼
       ┌──────────────────────────────┐
       │          Amazon EKS          │
       │  ┌────────┐    ┌──────────┐  │
       │  │frontend│───▶│ backend  │──┼──▶  MongoDB Atlas (external)
       │  │(nginx) │    │ (Node 20)│  │
       │  └───▲────┘    └──────────┘  │
       │      │ ALB (Ingress)         │
       └──────┼───────────────────────┘
              │
           Internet
```

---

## 0. Prerequisites (one-time per workstation)

Install:
- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [eksctl](https://eksctl.io/installation/)
- [Helm](https://helm.sh/docs/intro/install/)
- [Docker](https://docs.docker.com/get-docker/)

Configure AWS credentials for your account:

```bash
aws configure    # or `aws sso login` if you use AWS IAM Identity Center
```

Pick your region up front and use it consistently. The examples below
use `ap-south-1` (Mumbai). Swap in your own.

---

## 1. Put the app on MongoDB Atlas (free tier)

If you already set this up for the Render deployment, reuse the same
cluster — just add the EKS node group CIDR to the IP allowlist (or open
`0.0.0.0/0` for simplicity on a small project).

Copy the SRV URI, you'll need it as `MONGO_URI` in step 5.

---

## 2. Local smoke test with Docker Compose

Before touching AWS, make sure the container images actually work:

```bash
docker compose up --build
# browse http://localhost:8080
```

`docker-compose.yml` at the repo root brings up MongoDB + backend +
nginx-served frontend in one go. Tear down with `docker compose down -v`.

---

## 3. Create the AWS bits

From the repo root:

```bash
# Creates the two ECR repos
AWS_REGION=ap-south-1 ./scripts/aws-bootstrap.sh ecr

# Creates the EKS cluster + installs the AWS Load Balancer Controller
AWS_REGION=ap-south-1 CLUSTER_NAME=gullyscore ./scripts/aws-bootstrap.sh eks
```

The cluster creation takes ~15 minutes. When it finishes:

```bash
kubectl get nodes       # should show 2+ ready nodes
kubectl -n kube-system get deploy aws-load-balancer-controller
```

Jot down your 12-digit AWS account id:

```bash
aws sts get-caller-identity --query Account --output text
```

---

## 4. (Optional) First manual deploy from your laptop

If you want to see the app live before wiring Jenkins:

```bash
# Login to ECR and push the current images with tag 'dev-local'
AWS_REGION=ap-south-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR

docker build -t $ECR/gullyscore-backend:dev-local  ./backend
docker build --build-arg REACT_APP_API_URL=/api \
             -t $ECR/gullyscore-frontend:dev-local ./frontend
docker push $ECR/gullyscore-backend:dev-local
docker push $ECR/gullyscore-frontend:dev-local
```

Create the Secret that holds `MONGO_URI` and `ADMIN_TOKEN`:

```bash
kubectl create namespace gullyscore 2>/dev/null || true
kubectl -n gullyscore create secret generic gullyscore-backend \
  --from-literal=MONGO_URI='mongodb+srv://user:pass@cluster/gullyscore' \
  --from-literal=ADMIN_TOKEN='pick-a-long-random-string'
```

Deploy:

```bash
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID \
AWS_REGION=$AWS_REGION \
EKS_CLUSTER_NAME=gullyscore \
IMAGE_TAG=dev-local \
./scripts/deploy.sh
```

Grab the public hostname:

```bash
kubectl -n gullyscore get ingress gullyscore -o wide
# ADDRESS column → something like
#   k8s-gullyscore-abc-123456789.ap-south-1.elb.amazonaws.com
```

Open `http://<that-hostname>/` in your browser. The backend health check
is at `http://<that-hostname>/health`.

---

## 5. Install Jenkins

You have three reasonable options. Pick one.

### Option A — Jenkins on EC2 (simplest)

1. Launch an `t3.medium` EC2 instance with Ubuntu 22.04 in the same VPC
   as the EKS cluster (not strictly required but nice for latency).
2. Install Jenkins + Docker + AWS CLI + kubectl + Node 20:

```bash
sudo apt update && sudo apt install -y openjdk-17-jre curl unzip
curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian binary/" \
  | sudo tee /etc/apt/sources.list.d/jenkins.list
sudo apt update && sudo apt install -y jenkins
sudo usermod -aG docker jenkins
# kubectl + aws CLI + node 20 — see the respective install docs
```

3. Open TCP 8080 in the security group (restrict to your IP), browse
   the Jenkins UI, unlock with `/var/lib/jenkins/secrets/initialAdminPassword`,
   install the recommended plugins plus:
   - `AWS Credentials`
   - `Amazon ECR`
   - `Kubernetes CLI`
   - `NodeJS`
   - `AnsiColor`
   - `Pipeline: Declarative`

### Option B — Jenkins on the EKS cluster

Install the official Helm chart:

```bash
helm repo add jenkins https://charts.jenkins.io
helm upgrade --install jenkins jenkins/jenkins \
  --namespace jenkins --create-namespace \
  --set controller.serviceType=LoadBalancer
```

Needs DinD (Docker-in-Docker) or a Kaniko agent for image builds. More
involved; recommended only if you already run other workloads on EKS.

### Option C — Jenkins on Docker locally (just to try it)

```bash
docker run -d --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

---

## 6. Configure Jenkins for this repo

### 6a. Global tools

**Manage Jenkins → Tools**:
- NodeJS installation named **`node20`** (pointing at Node 20.x).

### 6b. Credentials

**Manage Jenkins → Credentials → (global) → Add Credentials**:
- **Kind:** AWS Credentials
- **ID:** `aws-ecr-eks`
- **Access Key ID / Secret Access Key:** an IAM user with:
  - `AmazonEC2ContainerRegistryPowerUser`
  - `AmazonEKSClusterPolicy` + `eks:DescribeCluster`
  - Permission to read/update the EKS cluster (add the IAM principal to
    the `aws-auth` ConfigMap, or use `eksctl create iamidentitymapping`).

### 6c. Global env vars

**Manage Jenkins → System → Global properties → Environment variables**:
- `AWS_REGION` = e.g. `ap-south-1`
- `AWS_ACCOUNT_ID` = your 12-digit account id
- `EKS_CLUSTER_NAME` = `gullyscore`

### 6d. Create the pipeline job

- **New Item → Multibranch Pipeline**
- **Branch Sources → GitHub** → point at your fork (add a PAT if private)
- **Build Configuration → by Jenkinsfile** (default path `Jenkinsfile`)
- Save.

Jenkins scans the repo, discovers `main` and `feature`, and queues a
build for each. The Jenkinsfile runs:

1. Lint + build the frontend
2. Build both Docker images
3. Push to ECR (tagged with `<branch>-<gitSha>`)
4. Deploy to EKS **only** on the `main` branch (by default)

---

## 7. Using the `feature` branch for testing

The `feature` branch is the testbed. Each push to it:
- builds and pushes new images tagged `feature-<sha>` to ECR,
- does **NOT** deploy automatically (default),
- lets you manually deploy to a separate namespace when you want.

### Deploy a feature build for QA

Option 1 — flip the Jenkins env and re-run:

Set `DEPLOY_FEATURE=true` as a build parameter / env var on the
`feature` branch job. The pipeline will deploy into a
`gullyscore-feature` namespace, isolated from prod.

Option 2 — manual, from your laptop:

```bash
AWS_ACCOUNT_ID=<your-id> AWS_REGION=ap-south-1 \
EKS_CLUSTER_NAME=gullyscore NAMESPACE=gullyscore-feature \
IMAGE_TAG=feature-<sha> ./scripts/deploy.sh
```

Create the namespace's Secret once:

```bash
kubectl create namespace gullyscore-feature
kubectl -n gullyscore-feature create secret generic gullyscore-backend \
  --from-literal=MONGO_URI='...feature Mongo URI...' \
  --from-literal=ADMIN_TOKEN='feature-admin-key'
```

Once you're happy, merge `feature` into `main`. The `main` build deploys
to the real `gullyscore` namespace automatically.

### Tearing the feature environment back down

```bash
kubectl delete namespace gullyscore-feature
```

---

## 8. Add HTTPS (optional but recommended for prod)

1. Register a domain (e.g. `gullyscore.example.com`) in Route 53.
2. Request an ACM certificate **in the same region as EKS** for that
   hostname. Validate via DNS (Route 53 one-click).
3. In `k8s/ingress.yaml`, uncomment the HTTPS listener lines and paste
   the cert ARN:
   ```yaml
   alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80},{"HTTPS": 443}]'
   alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-south-1:123456789012:certificate/...
   alb.ingress.kubernetes.io/ssl-redirect: "443"
   ```
4. `kubectl apply -f k8s/ingress.yaml` (Jenkins will do this on next deploy).
5. Create a Route 53 `ALIAS` record pointing your domain at the ALB
   hostname from `kubectl get ingress`.

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `ImagePullBackOff` on a pod | Check the ECR image tag exists (`aws ecr list-images`) and that the EKS node IAM role has `AmazonEC2ContainerRegistryReadOnly`. |
| Ingress ADDRESS stays empty | The AWS Load Balancer Controller isn't running. `kubectl -n kube-system logs deploy/aws-load-balancer-controller`. |
| Backend pod crashloops with "bad auth" | `MONGO_URI` in the Secret is wrong, or the Atlas IP allowlist doesn't include the NAT gateway / node IPs. |
| CORS errors in the browser | Set `CORS_ORIGIN` in `k8s/backend-configmap.yaml` to the exact origin your frontend is served from. |
| Jenkins can't `kubectl apply` | The Jenkins IAM principal isn't mapped in `aws-auth`. Run `eksctl create iamidentitymapping --cluster gullyscore --arn <iam-user-arn> --group system:masters`. |
| Pods are pending forever | You've hit the EKS node capacity. Scale the node group: `eksctl scale nodegroup --cluster gullyscore --name <ng-name> --nodes 3`. |

---

## 10. Cost notes (why MongoDB Atlas + EKS-small)

| Component | Typical monthly cost |
|---|---|
| EKS control plane | $73 (flat) |
| 2x t3.small worker nodes (on-demand, 24/7) | ~$30 |
| ALB | ~$20 + ~$0.008/LCU-hour |
| ECR storage (<1 GB) | Free tier |
| MongoDB Atlas M0 | Free |
| NAT gateway (if private subnets) | ~$32 |
| **Total** | **~$150/mo** |

For a personal project this is a lot. If cost matters more than learning
Kubernetes, Render's free tier (which you already have set up) is
genuinely better. Use this AWS setup if you want real K8s / Jenkins
experience on your CV.

Budget-shrinking knobs:
- Run the cluster only during working hours (`eksctl scale nodegroup ... --nodes 0` in the evenings).
- Use Spot worker nodes (`--node-volume-type=gp3 --spot`).
- Switch to **ECS Fargate** if you don't actually need K8s features.
