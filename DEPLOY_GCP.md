# Deployment Instructions for Google Cloud Platform (GCP)

This document provides the steps to configure a CI/CD pipeline using GitHub Actions to automatically deploy your application to Google Cloud Run.

## 1. Prerequisites on Google Cloud

Before you begin, you need to set up the following in your Google Cloud project:

*   **Enable APIs**: In your GCP project console, ensure the following APIs are enabled:
    *   Cloud Run API
    *   Artifact Registry API
    *   Cloud Build API

*   **Create a Service Account**: This account will be used by GitHub Actions to authenticate with GCP.
    1.  Navigate to **IAM & Admin > Service Accounts**.
    2.  Click **Create Service Account**.
    3.  Give it a name (e.g., `github-actions-deployer`).
    4.  Grant it the following roles:
        *   `Cloud Run Admin`
        *   `Storage Admin`
        *   `Artifact Registry Admin`
    5.  Continue and create the account.
    6.  After creation, find the service account, click on it, go to the **Keys** tab, click **Add Key**, and choose **Create new key**.
    7.  Select **JSON** as the key type and click **Create**. A JSON key file will be downloaded to your computer.

## 2. Configure GitHub Secrets

You need to add the service account key to your GitHub repository's secrets so the workflow can authenticate.

1.  In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
2.  Click **New repository secret**.
3.  Name the secret `GCP_SA_KEY`.
4.  Paste the entire content of the downloaded JSON key file as the value for this secret.

## 3. GitHub Actions Workflow

The following workflow file (`.github/workflows/deploy.yml`) automates the build and deployment process. It has already been created for you.

### Workflow Configuration

You must update the placeholder values in `.github/workflows/deploy.yml`:

*   Open the `.github/workflows/deploy.yml` file in your repository.
*   Locate the `env` block and replace the following placeholder values with your actual GCP project details:
    *   `PROJECT_ID`: Your Google Cloud Project ID.
    *   `GAR_LOCATION`: The region for your Google Artifact Registry (e.g., `us-central1`).
    *   `BACKEND_SERVICE_NAME`: A unique name for your backend Cloud Run service (e.g., `my-app-backend`).
    *   `FRONTEND_SERVICE_NAME`: A unique name for your frontend Cloud Run service (e.g., `my-app-frontend`).

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

Once these steps are completed, any push to your `main` branch will automatically trigger the workflow and deploy your application to Google Cloud Run.
