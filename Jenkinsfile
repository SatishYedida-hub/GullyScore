// GullyScore CI/CD pipeline
// ==========================
// Stages:
//   1. Checkout              (implicit)
//   2. Lint (frontend)       — fast fail on code problems
//   3. Build images          — backend + frontend, tagged with <branch>-<gitSha>
//   4. Push to ECR           — both images
//   5. Deploy to EKS         — only on `main` by default; `feature` deploys
//                              to a separate namespace when DEPLOY_FEATURE=true
//   6. Smoke test            — hit /health through the Ingress
//
// Required Jenkins setup
// ----------------------
// * Node.js 20 tool named "node20"                   (Global Tool Configuration)
// * Docker available to the agent                    (agent on a Docker host, or use Jenkins-on-K8s with DIND)
// * `aws`, `kubectl`, `eksctl` on PATH (or installed via the pipeline)
// * AWS credentials:
//     - id  `aws-ecr-eks`     — an AWS access key/secret with ECR push + EKS read perms
// * Environment variables (set in Jenkins System → Global properties, or override per-job):
//     - AWS_REGION            e.g. ap-south-1
//     - AWS_ACCOUNT_ID        12-digit account id
//     - EKS_CLUSTER_NAME      e.g. gullyscore
//     - DEPLOY_FEATURE        "true" to roll feature-branch builds into a
//                              `gullyscore-feature` namespace for QA (default off)

pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
    buildDiscarder(logRotator(numToKeepStr: '20'))
    timeout(time: 30, unit: 'MINUTES')
  }

  tools {
    nodejs 'node20'
  }

  environment {
    // Global — override in Jenkins if your values differ.
    AWS_REGION          = "${env.AWS_REGION ?: 'ap-south-1'}"
    AWS_ACCOUNT_ID      = "${env.AWS_ACCOUNT_ID ?: ''}"
    EKS_CLUSTER_NAME    = "${env.EKS_CLUSTER_NAME ?: 'gullyscore'}"
    BACKEND_REPO        = 'gullyscore-backend'
    FRONTEND_REPO       = 'gullyscore-frontend'
    // Image tag = <safe-branch>-<short-sha>. Short SHA keeps rollbacks trivial.
    IMAGE_TAG           = ''   // populated in the Prep stage
    ECR_REGISTRY        = ''   // populated in the Prep stage
    K8S_NAMESPACE       = ''   // populated in the Prep stage
  }

  stages {

    stage('Prep') {
      steps {
        script {
          if (!env.AWS_ACCOUNT_ID?.trim()) {
            error 'AWS_ACCOUNT_ID is not set. Configure it as a global/job env var.'
          }

          def gitSha = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          def safeBranch = (env.BRANCH_NAME ?: 'local')
            .toLowerCase()
            .replaceAll('[^a-z0-9_.-]', '-')

          env.IMAGE_TAG    = "${safeBranch}-${gitSha}"
          env.ECR_REGISTRY = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"
          env.K8S_NAMESPACE = (safeBranch == 'main') ? 'gullyscore' : "gullyscore-${safeBranch}"

          echo "Branch      : ${env.BRANCH_NAME}"
          echo "Image tag   : ${env.IMAGE_TAG}"
          echo "ECR registry: ${env.ECR_REGISTRY}"
          echo "Target ns   : ${env.K8S_NAMESPACE}"
        }
      }
    }

    stage('Lint (frontend)') {
      steps {
        dir('frontend') {
          // CRA ships with react-scripts; a clean production build doubles as a lint pass.
          sh '''
            npm install --no-audit --no-fund
            CI=true npm run build
          '''
        }
      }
    }

    stage('Build images') {
      parallel {
        stage('backend') {
          steps {
            sh '''
              docker build \
                -t "${BACKEND_REPO}:${IMAGE_TAG}" \
                -t "${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG}" \
                -t "${ECR_REGISTRY}/${BACKEND_REPO}:latest" \
                ./backend
            '''
          }
        }
        stage('frontend') {
          steps {
            // Bake the API URL into the bundle. For a single ALB Ingress
            // (path /api → backend), a relative URL is enough.
            sh '''
              docker build \
                --build-arg REACT_APP_API_URL=/api \
                -t "${FRONTEND_REPO}:${IMAGE_TAG}" \
                -t "${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}" \
                -t "${ECR_REGISTRY}/${FRONTEND_REPO}:latest" \
                ./frontend
            '''
          }
        }
      }
    }

    stage('Push to ECR') {
      steps {
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-eks',
          accessKeyVariable: 'AWS_ACCESS_KEY_ID',
          secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
        ]]) {
          sh '''
            aws ecr get-login-password --region "$AWS_REGION" \
              | docker login --username AWS --password-stdin "$ECR_REGISTRY"

            # Make sure repos exist (idempotent).
            aws ecr describe-repositories --repository-names "$BACKEND_REPO"  --region "$AWS_REGION" >/dev/null 2>&1 \
              || aws ecr create-repository --repository-name "$BACKEND_REPO"  --region "$AWS_REGION" --image-scanning-configuration scanOnPush=true
            aws ecr describe-repositories --repository-names "$FRONTEND_REPO" --region "$AWS_REGION" >/dev/null 2>&1 \
              || aws ecr create-repository --repository-name "$FRONTEND_REPO" --region "$AWS_REGION" --image-scanning-configuration scanOnPush=true

            docker push "$ECR_REGISTRY/$BACKEND_REPO:$IMAGE_TAG"
            docker push "$ECR_REGISTRY/$BACKEND_REPO:latest"
            docker push "$ECR_REGISTRY/$FRONTEND_REPO:$IMAGE_TAG"
            docker push "$ECR_REGISTRY/$FRONTEND_REPO:latest"
          '''
        }
      }
    }

    stage('Deploy to EKS') {
      when {
        anyOf {
          branch 'main'
          expression { return (env.BRANCH_NAME == 'feature' && env.DEPLOY_FEATURE == 'true') }
        }
      }
      steps {
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-eks',
          accessKeyVariable: 'AWS_ACCESS_KEY_ID',
          secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
        ]]) {
          sh '''
            set -euo pipefail

            aws eks update-kubeconfig --name "$EKS_CLUSTER_NAME" --region "$AWS_REGION"

            # Render the manifests into a tmp dir with real values substituted.
            TMP=$(mktemp -d)
            cp -r k8s/* "$TMP"/

            # Point at the correct namespace for feature deploys.
            if [ "$K8S_NAMESPACE" != "gullyscore" ]; then
              # Rewrite namespace in each manifest (simple sed — all manifests
              # declare `namespace: gullyscore` on metadata).
              find "$TMP" -name '*.yaml' -type f -exec \
                sed -i "s/namespace: gullyscore$/namespace: ${K8S_NAMESPACE}/g" {} +
              # Ensure the namespace itself is renamed in namespace.yaml.
              sed -i "s/name: gullyscore$/name: ${K8S_NAMESPACE}/g" "$TMP/namespace.yaml" || true
            fi

            # Replace the image placeholders with real ECR images.
            sed -i "s|<ACCOUNT_ID>|${AWS_ACCOUNT_ID}|g; s|<REGION>|${AWS_REGION}|g; s|<IMAGE_TAG>|${IMAGE_TAG}|g" \
              "$TMP/backend-deployment.yaml" "$TMP/frontend-deployment.yaml"

            kubectl apply -f "$TMP/namespace.yaml"
            kubectl apply -f "$TMP/backend-configmap.yaml"

            # Skip the secret template — real secrets are created out-of-band.
            # But fail early if the expected secret doesn't exist yet.
            if ! kubectl -n "$K8S_NAMESPACE" get secret gullyscore-backend >/dev/null 2>&1; then
              echo "ERROR: Secret 'gullyscore-backend' not found in namespace '$K8S_NAMESPACE'."
              echo "Create it once with:"
              echo "  kubectl -n $K8S_NAMESPACE create secret generic gullyscore-backend \\"
              echo "    --from-literal=MONGO_URI='...' --from-literal=ADMIN_TOKEN='...'"
              exit 1
            fi

            kubectl apply -f "$TMP/backend-deployment.yaml"
            kubectl apply -f "$TMP/backend-service.yaml"
            kubectl apply -f "$TMP/backend-hpa.yaml"
            kubectl apply -f "$TMP/frontend-deployment.yaml"
            kubectl apply -f "$TMP/frontend-service.yaml"
            kubectl apply -f "$TMP/ingress.yaml"

            # Block the stage until the new pods are Ready.
            kubectl -n "$K8S_NAMESPACE" rollout status deploy/gullyscore-backend  --timeout=5m
            kubectl -n "$K8S_NAMESPACE" rollout status deploy/gullyscore-frontend --timeout=5m
          '''
        }
      }
    }

    stage('Smoke test') {
      when {
        anyOf {
          branch 'main'
          expression { return (env.BRANCH_NAME == 'feature' && env.DEPLOY_FEATURE == 'true') }
        }
      }
      steps {
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-eks',
          accessKeyVariable: 'AWS_ACCESS_KEY_ID',
          secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
        ]]) {
          sh '''
            set -euo pipefail
            aws eks update-kubeconfig --name "$EKS_CLUSTER_NAME" --region "$AWS_REGION"

            # Grab the ALB hostname from the Ingress. Retry for up to 3 min
            # because first-time provisioning can take a minute or two.
            HOST=""
            for i in $(seq 1 18); do
              HOST=$(kubectl -n "$K8S_NAMESPACE" get ingress gullyscore \
                -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)
              [ -n "$HOST" ] && break
              echo "Waiting for Ingress hostname… ($i/18)"
              sleep 10
            done

            if [ -z "$HOST" ]; then
              echo "Ingress hostname never populated — check the AWS Load Balancer Controller."
              kubectl -n "$K8S_NAMESPACE" describe ingress gullyscore || true
              exit 1
            fi

            echo "Pinging http://$HOST/health …"
            for i in $(seq 1 10); do
              CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://$HOST/health" || true)
              if [ "$CODE" = "200" ]; then
                echo "OK — backend healthy at http://$HOST/health"
                exit 0
              fi
              sleep 6
            done
            echo "Smoke test failed (last status: $CODE)"
            exit 1
          '''
        }
      }
    }
  }

  post {
    success { echo "Build ${env.IMAGE_TAG} succeeded." }
    failure { echo "Build ${env.IMAGE_TAG} failed." }
    always  { sh 'docker image prune -f || true' }
  }
}
