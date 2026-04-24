#!/usr/bin/env bash
# Manual deploy to EKS — useful for first-time setup or when Jenkins isn't
# available. Mirrors what the `Deploy to EKS` stage in Jenkinsfile does.
#
# Usage:
#   AWS_ACCOUNT_ID=123456789012 AWS_REGION=ap-south-1 \
#   EKS_CLUSTER_NAME=gullyscore IMAGE_TAG=feature-6d70c95 \
#   ./scripts/deploy.sh
#
# Prerequisites:
#   - Images already pushed to ECR with the given IMAGE_TAG
#   - `kubectl` and `aws` installed and authenticated
#   - Secret 'gullyscore-backend' already created in the target namespace

set -euo pipefail

: "${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
: "${AWS_REGION:?AWS_REGION is required}"
: "${EKS_CLUSTER_NAME:?EKS_CLUSTER_NAME is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"
NAMESPACE="${NAMESPACE:-gullyscore}"

echo "==> kubeconfig"
aws eks update-kubeconfig --name "$EKS_CLUSTER_NAME" --region "$AWS_REGION"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp -r k8s/* "$TMP"/

if [ "$NAMESPACE" != "gullyscore" ]; then
  find "$TMP" -name '*.yaml' -type f -exec \
    sed -i "s/namespace: gullyscore$/namespace: ${NAMESPACE}/g" {} +
  sed -i "s/name: gullyscore$/name: ${NAMESPACE}/g" "$TMP/namespace.yaml" || true
fi

echo "==> substituting image placeholders"
sed -i "s|<ACCOUNT_ID>|${AWS_ACCOUNT_ID}|g; s|<REGION>|${AWS_REGION}|g; s|<IMAGE_TAG>|${IMAGE_TAG}|g" \
  "$TMP/backend-deployment.yaml" "$TMP/frontend-deployment.yaml"

echo "==> applying manifests"
kubectl apply -f "$TMP/namespace.yaml"
kubectl apply -f "$TMP/backend-configmap.yaml"

if ! kubectl -n "$NAMESPACE" get secret gullyscore-backend >/dev/null 2>&1; then
  cat <<EOF
ERROR: Secret 'gullyscore-backend' not found in '$NAMESPACE'.
Create it first:

  kubectl -n $NAMESPACE create secret generic gullyscore-backend \\
    --from-literal=MONGO_URI='mongodb+srv://user:pass@cluster/gullyscore' \\
    --from-literal=ADMIN_TOKEN='your-long-random-secret'

Then re-run this script.
EOF
  exit 1
fi

kubectl apply -f "$TMP/backend-deployment.yaml"
kubectl apply -f "$TMP/backend-service.yaml"
kubectl apply -f "$TMP/backend-hpa.yaml"
kubectl apply -f "$TMP/frontend-deployment.yaml"
kubectl apply -f "$TMP/frontend-service.yaml"
kubectl apply -f "$TMP/ingress.yaml"

echo "==> waiting for rollouts"
kubectl -n "$NAMESPACE" rollout status deploy/gullyscore-backend  --timeout=5m
kubectl -n "$NAMESPACE" rollout status deploy/gullyscore-frontend --timeout=5m

echo "==> ingress"
kubectl -n "$NAMESPACE" get ingress gullyscore

echo "Done. Once the ALB finishes provisioning, the ADDRESS column above"
echo "will show the public hostname (takes 1–3 minutes first time)."
