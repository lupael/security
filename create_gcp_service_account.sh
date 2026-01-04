#!/bin/bash

# This script is DEPRECATED for CI/CD pipelines.
# It creates a service account but DOES NOT generate a service account key.
# For automated deployments (like GitHub Actions), please follow the Workload Identity Federation setup
# instructions in DEPLOY_GCP.md, which is the recommended secure, keyless authentication method.

# --- Configuration ---
# Replace 'your-gcp-project-id' with your actual Google Cloud project ID.
export PROJECT_ID="metal-being-482316-d7"

# Set the desired name for your service account.
export SA_NAME="github-actions-deployer"
export SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# --- Script ---

# Set the active project
gcloud config set project $PROJECT_ID

# Create the service account if it doesn't exist
echo "Creating service account '$SA_NAME' if it doesn't exist..."
gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID > /dev/null 2>&1 || \
  gcloud iam service-accounts create $SA_NAME --display-name="GitHub Actions Deployer" --project=$PROJECT_ID

# Grant the required IAM roles to the service account
echo "Granting roles to $SA_EMAIL..."
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/storage.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/artifactregistry.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/iam.serviceAccountUser"

echo "Service account setup is complete."
echo "For CI/CD, please follow the Workload Identity Federation guide in DEPLOY_GCP.md to allow GitHub Actions to impersonate this service account securely without keys."
