#!/usr/bin/env bash
# One-time AWS bootstrap for GullyScore.
#
# Creates the two ECR repositories and (optionally) the EKS cluster.
# Safe to re-run — all steps are idempotent.
#
# Requirements: aws CLI, eksctl, kubectl. You must be authenticated with
# an AWS account that has permissions to create ECR repos + EKS clusters.
#
# Usage:
#   AWS_REGION=ap-south-1 CLUSTER_NAME=gullyscore ./scripts/aws-bootstrap.sh ecr
#   AWS_REGION=ap-south-1 CLUSTER_NAME=gullyscore ./scripts/aws-bootstrap.sh eks
#   AWS_REGION=ap-south-1 CLUSTER_NAME=gullyscore ./scripts/aws-bootstrap.sh all

set -euo pipefail

AWS_REGION="${AWS_REGION:-ap-south-1}"
CLUSTER_NAME="${CLUSTER_NAME:-gullyscore}"
NODE_TYPE="${NODE_TYPE:-t3.small}"
NODES="${NODES:-2}"
NODES_MAX="${NODES_MAX:-3}"

step() { printf '\n=== %s ===\n' "$*"; }

create_ecr() {
  step "Creating ECR repos in $AWS_REGION"
  for repo in gullyscore-backend gullyscore-frontend; do
    if aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" >/dev/null 2>&1; then
      echo "  - $repo already exists"
    else
      aws ecr create-repository \
        --repository-name "$repo" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 >/dev/null
      echo "  - created $repo"
    fi
  done

  local account
  account=$(aws sts get-caller-identity --query Account --output text)
  echo
  echo "ECR registry: ${account}.dkr.ecr.${AWS_REGION}.amazonaws.com"
  echo "Login with:"
  echo "  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${account}.dkr.ecr.${AWS_REGION}.amazonaws.com"
}

create_eks() {
  step "Creating EKS cluster '$CLUSTER_NAME' in $AWS_REGION (takes ~15 min)"

  if eksctl get cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "  - cluster $CLUSTER_NAME already exists"
  else
    eksctl create cluster \
      --name "$CLUSTER_NAME" \
      --region "$AWS_REGION" \
      --node-type "$NODE_TYPE" \
      --nodes "$NODES" \
      --nodes-min 1 \
      --nodes-max "$NODES_MAX" \
      --managed \
      --with-oidc \
      --alb-ingress-access
  fi

  step "Updating kubeconfig"
  aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$AWS_REGION"
  kubectl get nodes
}

install_alb_controller() {
  step "Installing AWS Load Balancer Controller"

  # IAM policy
  local policy_arn
  policy_arn=$(aws iam list-policies --query "Policies[?PolicyName=='AWSLoadBalancerControllerIAMPolicy'].Arn" --output text)
  if [ -z "$policy_arn" ] || [ "$policy_arn" = "None" ]; then
    curl -fsSL -o /tmp/alb-iam-policy.json \
      https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.2/docs/install/iam_policy.json
    policy_arn=$(aws iam create-policy \
      --policy-name AWSLoadBalancerControllerIAMPolicy \
      --policy-document file:///tmp/alb-iam-policy.json \
      --query 'Policy.Arn' --output text)
  fi
  echo "  - policy arn: $policy_arn"

  # Service account with IRSA
  eksctl create iamserviceaccount \
    --cluster="$CLUSTER_NAME" --region="$AWS_REGION" \
    --namespace=kube-system --name=aws-load-balancer-controller \
    --attach-policy-arn="$policy_arn" \
    --approve --override-existing-serviceaccounts

  # Helm-install the controller
  if ! command -v helm >/dev/null 2>&1; then
    echo "helm is required to install the ALB controller. See https://helm.sh/docs/intro/install/"
    exit 1
  fi
  helm repo add eks https://aws.github.io/eks-charts >/dev/null 2>&1 || true
  helm repo update >/dev/null

  local vpc_id
  vpc_id=$(aws eks describe-cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" \
    --query 'cluster.resourcesVpcConfig.vpcId' --output text)

  helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
    --namespace kube-system \
    --set clusterName="$CLUSTER_NAME" \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller \
    --set region="$AWS_REGION" \
    --set vpcId="$vpc_id"

  kubectl -n kube-system rollout status deploy/aws-load-balancer-controller
  echo "  - ALB controller ready"
}

case "${1:-all}" in
  ecr) create_ecr ;;
  eks) create_eks; install_alb_controller ;;
  alb) install_alb_controller ;;
  all) create_ecr; create_eks; install_alb_controller ;;
  *) echo "Usage: $0 {ecr|eks|alb|all}"; exit 1 ;;
esac

step "Done."
