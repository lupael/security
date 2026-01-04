#!/bin/bash

# This script deploys the frontend and backend services to Google Cloud Run.
#
# Prerequisites:
# 1. Google Cloud SDK (gcloud) installed.
# 2. An authenticated gcloud session (e.g., run `gcloud auth login` or be in an environment
#    with Workload Identity Federation like GitHub Actions).
# 3. Docker installed and running.
# 4. A GCP project created with the necessary APIs enabled (run, artifactregistry, cloudbuild).
# 5. The authenticated user/service account must have the following roles:
#    - Cloud Run Admin (roles/run.admin)
#    - Storage Admin (roles/storage.admin)
#    - Artifact Registry Admin (roles/artifactregistry.admin)
#    - Service Account User (roles/iam.serviceAccountUser)

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
export PROJECT_ID="metal-being-482316-d7" # Replace with your GCP Project ID
export GCP_REGION="us-central1" # Replace with your desired GCP region
export AR_REPO="host-app-repo" # Name for the Artifact Registry repository
export BACKEND_SERVICE_NAME="host-app-backend"
export FRONTEND_SERVICE_NAME="host-app-frontend"

# --- Derived Variables ---
export AR_HOST="${GCP_REGION}-docker.pkg.dev"
export BACKEND_IMAGE_URI="${AR_HOST}/${PROJECT_ID}/${AR_REPO}/${BACKEND_SERVICE_NAME}:latest"
export FRONTEND_IMAGE_URI="${AR_HOST}/${PROJECT_ID}/${AR_REPO}/${FRONTEND_SERVICE_NAME}:latest"

# --- Script ---

echo "--- Starting Deployment ---"

# 1. Set GCP Project and Region
echo "1. Setting GCP project and region..."
gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$GCP_REGION"

# 2. Enable Services
echo "2. Enabling necessary GCP services..."
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com

# 3. Configure Docker
echo "3. Configuring Docker to authenticate with Artifact Registry..."
gcloud auth configure-docker "$AR_HOST"

# 4. Create Artifact Registry Repo
echo "4. Creating Artifact Registry repository '$AR_REPO' if it doesn't exist..."
if ! gcloud artifacts repositories describe "$AR_REPO" --location="$GCP_REGION" --project="$PROJECT_ID" &> /dev/null; then
    gcloud artifacts repositories create "$AR_REPO" \
        --repository-format=docker \
        --location="$GCP_REGION" \
        --description="Docker repository for host-app application"
fi

# Run npm install to generate the root package-lock.json
echo "Installing npm dependencies for workspaces..."
npm install

# 5. Build and Push Backend Image
echo "5. Building and pushing backend image: $BACKEND_IMAGE_URI"
docker build -t "$BACKEND_IMAGE_URI" -f ./backend/Dockerfile .
docker push "$BACKEND_IMAGE_URI"

# 6. Deploy Backend to Cloud Run
echo "6. Deploying backend service '$BACKEND_SERVICE_NAME' to Cloud Run..."
gcloud run deploy "$BACKEND_SERVICE_NAME" \
    --image="$BACKEND_IMAGE_URI" \
    --platform=managed \
    --port=5000 \
    --allow-unauthenticated \
    --quiet

# 7. Get Backend URL
echo "7. Retrieving backend service URL..."
export BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE_NAME" --platform=managed --format="value(status.url)")
if [ -z "$BACKEND_URL" ]; then
    echo "ERROR: Failed to get backend URL. Aborting."
    exit 1
fi
echo "Backend URL: $BACKEND_URL"

# 8. Build and Push Frontend Image
echo "8. Building and pushing frontend image: $FRONTEND_IMAGE_URI"
# We pass the backend URL as a build argument to the frontend Dockerfile
docker build -t "$FRONTEND_IMAGE_URI" \
    --build-arg VITE_API_BASE_URL="$BACKEND_URL" -f ./frontend/Dockerfile .
docker push "$FRONTEND_IMAGE_URI"

# 9. Deploy Frontend to Cloud Run
echo "9. Deploying frontend service '$FRONTEND_SERVICE_NAME' to Cloud Run..."
gcloud run deploy "$FRONTEND_SERVICE_NAME" \
    --image="$FRONTEND_IMAGE_URI" \
    --platform=managed \
    --port=5000 \
    --allow-unauthenticated \
    --quiet

export FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE_NAME" --platform=managed --format="value(status.url)")

echo "--- Deployment Complete ---"
echo "Backend Service URL: $BACKEND_URL"
echo "Frontend Service URL: $FRONTEND_URL"
