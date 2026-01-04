# Deployment Instructions for Google Cloud Platform (GCP)

This document provides the steps to configure a CI/CD pipeline using GitHub Actions to automatically deploy your application to Google Cloud Run.

This guide uses **Workload Identity Federation**, which is the recommended, keyless authentication method for accessing Google Cloud from external environments like GitHub Actions.

## 1. Understanding the Authentication Method

Previously, this guide recommended using service account keys. However, your GCP organization may have a security policy (`constraints/iam.disableServiceAccountKeyCreation`) that prevents the creation of service account keys. This is a good security practice.

Instead, we will use Workload Identity Federation, which allows GitHub Actions to impersonate a Google Cloud service account without needing a long-lived JSON key.

## 2. Prerequisites on Google Cloud

### 2.1. Enable APIs
In your GCP project console, ensure the following APIs are enabled:
-   IAM Credentials API (`iamcredentials.googleapis.com`)
-   Cloud Run API (`cloudrun.googleapis.com`)
-   Artifact Registry API (`artifactregistry.googleapis.com`)
-   Cloud Build API (`cloudbuild.googleapis.com`)

You can enable them with `gcloud` in your Cloud Shell:
```bash
gcloud services enable iamcredentials.googleapis.com cloudrun.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

### 2.2. Create a Service Account
Create a service account that GitHub Actions will impersonate. The service account `github-actions-deployer` may already exist from previous attempts.

Run the following commands in your Cloud Shell:
```bash
# --- Configuration ---
export PROJECT_ID="metal-being-482316-d7"
export SA_NAME="github-actions-deployer"
export SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# --- Script ---

# Create the service account if it doesn't exist
gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID > /dev/null 2>&1 || \
  gcloud iam service-accounts create $SA_NAME --display-name="GitHub Actions Deployer" --project=$PROJECT_ID

# Grant the necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/storage.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/artifactregistry.admin"
```
*Note: The `add-iam-policy-binding` commands might prompt you to specify a condition if your project has conditional role bindings. If so, choose the 'None' option to grant the roles unconditionally.*

### 2.3. Set up Workload Identity Federation
This process connects your GitHub repository to your GCP service account.

1.  **Create a Workload Identity Pool:**
    ```bash
    gcloud iam workload-identity-pools create "github-pool" \
        --project="$PROJECT_ID" \
        --location="global" \
        --display-name="GitHub Pool"
    ```

2.  **Get the full ID of the pool:**
    ```bash
    export POOL_ID=$(gcloud iam workload-identity-pools describe "github-pool" --project="$PROJECT_ID" --location="global" --format="value(name)")
    ```

3.  **Create a Workload Identity Provider for your GitHub repository:**
    ```bash
    gcloud iam workload-identity-pools providers create-oidc "github-provider" \
        --project="$PROJECT_ID" \
        --location="global" \
        --workload-identity-pool="github-pool" \
        --display-name="GitHub Provider" \
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
        --issuer-uri="https://token.actions.githubusercontent.com"
    ```

4.  **Allow GitHub Actions from your repo to impersonate the service account:**
    Replace `your-github-organization/your-repo-name` with your repository path (e.g., `my-user/my-app`).
    ```bash
    gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
        --project="$PROJECT_ID" \
        --role="roles/iam.workloadIdentityUser" \
        --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/your-github-organization/your-repo-name"
    ```

5.  **Get your Project Number:**
    You will need this for the GitHub Actions workflow file.
    ```bash
    export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
    echo "Your project number is: $PROJECT_NUMBER"
    ```

## 3. GitHub Actions Workflow

The `.github/workflows/deploy.yml` file has been updated to use Workload Identity Federation. You just need to configure the `WORKLOAD_IDENTITY_PROVIDER` environment variable in that file.

1.  Open the `.github/workflows/deploy.yml` file.
2.  Find the `WORKLOAD_IDENTITY_PROVIDER` variable.
3.  Its value should be in the format: `projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/YOUR_POOL_NAME/providers/YOUR_PROVIDER_NAME`.
4.  Based on the commands above, replace `YOUR_PROJECT_NUMBER` with the number you got from the previous step. The pool name is `github-pool` and the provider name is `github-provider`.

**No GitHub secrets are required for this setup.** You can safely remove the `GCP_SA_KEY` secret from your GitHub repository settings if it exists.

## 4. Verify Frontend Dockerfile

This workflow builds the frontend by passing the deployed backend URL as a build argument (`VITE_API_BASE_URL`). Your frontend's `Dockerfile` must be configured to use this argument.

Here is an example `frontend/Dockerfile` that handles this correctly:

```Dockerfile
# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Add build argument for the API URL
ARG VITE_API_BASE_URL

# Set environment variable for the build process
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the project
RUN npm run build

# Stage 2: Serve the static files with a lightweight web server
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```