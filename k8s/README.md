# Kubernetes manifests

Plain YAML manifests for deploying GullyScore to EKS (or any Kubernetes
cluster). Everything lives in the `gullyscore` namespace.

## Apply order (first time)

```bash
# 1. namespace + config
kubectl apply -f namespace.yaml
kubectl apply -f backend-configmap.yaml

# 2. secrets — DO NOT check real secrets into git. Create from CLI:
kubectl -n gullyscore create secret generic gullyscore-backend \
  --from-literal=MONGO_URI='mongodb+srv://user:pass@cluster/gullyscore' \
  --from-literal=ADMIN_TOKEN='your-long-random-secret'

# 3. workloads
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f backend-hpa.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# 4. ingress (requires AWS Load Balancer Controller pre-installed)
kubectl apply -f ingress.yaml
```

## Placeholders you must replace before applying

| Token | Where | What to put |
|---|---|---|
| `<ACCOUNT_ID>` | `backend-deployment.yaml`, `frontend-deployment.yaml` | Your 12-digit AWS account ID |
| `<REGION>` | same | Your AWS region (e.g. `ap-south-1`) |
| `<IMAGE_TAG>` | same | The image tag Jenkins published (e.g. a git SHA) |
| `<CERT_ARN>` | `ingress.yaml` | ACM certificate ARN for HTTPS (optional — drop the annotation to go HTTP-only) |

The Jenkins pipeline (`Jenkinsfile` at repo root) substitutes these for
you via `sed` during the deploy stage.
