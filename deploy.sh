#!/bin/bash

# This script deploys the frontend and backend services to Google Cloud Run.
#
# Prerequisites:
# 1. Google Cloud SDK (gcloud) installed and authenticated.
# 2. Docker installed and running.
# 3. A GCP project created.
# 4. A service account with the following roles:
#    - Cloud Run Admin (roles/run.admin)
#    - Storage Admin (roles/storage.admin)
#    - Artifact Registry Admin (roles/artifactregistry.admin)
#    - Service Account User (roles/iam.serviceAccountUser)
#
# NOTE: Your project seems to have a policy that prevents service account key
# creation (`constraints/iam.disableServiceAccountKeyCreation`). You need to either
# get this policy changed or use an alternative authentication method like
# Workload Identity Federation to generate the necessary credentials.
# This script assumes you have a JSON key file for your service account.

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
export PROJECT_ID="metal-being-482316-d7" # Replace with your GCP Project ID
export GCP_REGION="us-central1" # Replace with your desired GCP region
export AR_REPO="vuln-scan-repo" # Name for the Artifact Registry repository
export BACKEND_SERVICE_NAME="vuln-scan-backend"
export FRONTEND_SERVICE_NAME="vuln-scan-frontend"
export GCP_SA_KEY_PATH="./gcp-sa-key.json" # Path to your GCP service account JSON key

# --- Derived Variables ---
export AR_HOST="${GCP_REGION}-docker.pkg.dev"
export BACKEND_IMAGE_URI="${AR_HOST}/${PROJECT_ID}/${AR_REPO}/${BACKEND_SERVICE_NAME}:latest"
export FRONTEND_IMAGE_URI="${AR_HOST}/${PROJECT_ID}/${AR_REPO}/${FRONTEND_SERVICE_NAME}:latest"

# --- Script ---

echo "--- Starting Deployment ---"

# 1. Authentication
echo "1. Authenticating with GCP..."
if [ ! -f "$GCP_SA_KEY_PATH" ]; then
    echo "ERROR: Service Account Key file not found at '$GCP_SA_KEY_PATH'."
    echo "Please download the key and place it at the correct path."
    exit 1
fi
gcloud auth activate-service-account --key-file="$GCP_SA_KEY_PATH"
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
gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$GCP_REGION" \
    --description="Docker repository for vuln-scan application" || echo "Repository '$AR_REPO' already exists."

# 5. Build and Push Backend Image
echo "5. Building and pushing backend image: $BACKEND_IMAGE_URI"
docker build -t "$BACKEND_IMAGE_URI" ./backend
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
    --build-arg VITE_API_BASE_URL="$BACKEND_URL" \
    ./frontend
docker push "$FRONTEND_IMAGE_URI"

# 9. Deploy Frontend to Cloud Run
echo "9. Deploying frontend service '$FRONTEND_SERVICE_NAME' to Cloud Run..."
gcloud run deploy "$FRONTEND_SERVICE_NAME" \
    --image="$FRONTEND_IMAGE_URI" \
    --platform=managed \
    --port=80 \
    --allow-unauthenticated \
    --quiet

export FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE_NAME" --platform=managed --format="value(status.url)")

echo "--- Deployment Complete ---"
echo "Backend Service URL: $BACKEND_URL"
echo "Frontend Service URL: $FRONTEND_URL"
