# This script automates the deployment of the application to Google Cloud Run from a local machine.
# It uses your personal gcloud credentials to impersonate a service account, avoiding the need for service account keys.
#
# PRE-REQUISITES:
# 1. Google Cloud SDK (gcloud) must be installed.
# 2. You must be authenticated with gcloud. Run `gcloud auth login` and follow the prompts.
# 3. Docker must be installed and running.
# 4. Your user account must have the 'Service Account Token Creator' role on the service account below.
#    You can grant this role by running the following command in Cloud Shell, replacing 'your-email@example.com' with the email you use for `gcloud auth login`:
#
#    gcloud iam service-accounts add-iam-policy-binding "github-actions-deployer@metal-being-482316-d7.iam.gserviceaccount.com" --member="user:your-email@example.com" --role="roles/iam.serviceAccountTokenCreator" --project="metal-being-482316-d7"

# --- USER CONFIGURATION ---
$GCP_PROJECT_ID = "metal-being-482316-d7"
$GCP_REGION = "us-central1"
$GAR_REPOSITORY_NAME = "host-app-repo"

$BACKEND_SERVICE_NAME = "host-app-backend"
$FRONTEND_SERVICE_NAME = "host-app-frontend"
$SERVICE_ACCOUNT_EMAIL = "github-actions-deployer@metal-being-482316-d7.iam.gserviceaccount.com"

# --- SCRIPT ---

try {
    # Set the active project
    Write-Host "Setting active project to $GCP_PROJECT_ID..."
    gcloud config set project $GCP_PROJECT_ID

    # Set gcloud to impersonate the service account for all subsequent commands in this session
    Write-Host "Configuring gcloud to impersonate service account: $SERVICE_ACCOUNT_EMAIL..."
    gcloud config set auth/impersonate_service_account $SERVICE_ACCOUNT_EMAIL

    # Configure Docker to authenticate with Google Artifact Registry using impersonation
    Write-Host "Configuring Docker authentication for Artifact Registry..."
    gcloud auth configure-docker "$($GCP_REGION)-docker.pkg.dev"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker authentication failed. Aborting deployment."
        exit 1
    }

    # --- Install Dependencies ---
    Write-Host "Installing npm dependencies for workspaces..."
    npm install

    # --- Backend Deployment ---
    Write-Host "--- Starting Backend Deployment ---"
    $BACKEND_IMAGE_NAME = "$($GCP_REGION)-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY_NAME/backend:latest"
    Write-Host "Building backend Docker image: $BACKEND_IMAGE_NAME"
    docker build -t $BACKEND_IMAGE_NAME ./backend
    Write-Host "Pushing backend image to Artifact Registry..."
    docker push $BACKEND_IMAGE_NAME
    Write-Host "Deploying backend service to Cloud Run..."
    gcloud run deploy $BACKEND_SERVICE_NAME `
        --image=$BACKEND_IMAGE_NAME `
        --platform=managed `
        --region=$GCP_REGION `
        --allow-unauthenticated

    # --- Frontend Deployment ---
    Write-Host "--- Starting Frontend Deployment ---"
    Write-Host "Fetching backend service URL..."
    $BACKEND_URL = gcloud run services describe $BACKEND_SERVICE_NAME --platform=managed --region=$GCP_REGION --format="value(status.url)"
    if (-not $BACKEND_URL) {
        Write-Error "Could not retrieve backend URL. Aborting deployment."
        exit 1
    }
    Write-Host "Backend URL: $BACKEND_URL"
    $FRONTEND_IMAGE_NAME = "$($GCP_REGION)-docker.pkg.dev/$GCP_PROJECT_ID/$GAR_REPOSITORY_NAME/frontend:latest"
    Write-Host "Building frontend Docker image: $FRONTEND_IMAGE_NAME"
    docker build --build-arg VITE_API_BASE_URL=$BACKEND_URL -t $FRONTEND_IMAGE_NAME ./frontend
    Write-Host "Pushing frontend image to Artifact Registry..."
    docker push $FRONTEND_IMAGE_NAME
    Write-Host "Deploying frontend service to Cloud Run..."
    gcloud run deploy $FRONTEND_SERVICE_NAME `
        --image=$FRONTEND_IMAGE_NAME `
        --platform=managed `
        --region=$GCP_REGION `
        --allow-unauthenticated

    # --- Finished ---
    Write-Host "--- Deployment Complete! ---"
    $FRONTEND_URL = gcloud run services describe $FRONTEND_SERVICE_NAME --platform=managed --region=$GCP_REGION --format="value(status.url)"
    Write-Host "Frontend is available at: $FRONTEND_URL"

} finally {
    # Unset impersonation at the end of the script, regardless of success or failure
    Write-Host "Cleaning up: unsetting service account impersonation."
    gcloud config unset auth/impersonate_service_account
}
