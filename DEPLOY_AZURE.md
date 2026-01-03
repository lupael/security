# Deployment Instructions for Microsoft Azure

This document provides the steps to configure a CI/CD pipeline using GitHub Actions to automatically deploy your application to Azure Container Apps.

## 1. Prerequisites on Azure

You will need the Azure CLI to perform the initial setup. You can install it from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).

1.  **Log in to Azure**:
    ```bash
    az login
    ```

2.  **Create a Resource Group**: A resource group is a container that holds related resources for an Azure solution.
    ```bash
    az group create --name YourResourceGroupName --location "East US" # You can choose a different location
    ```

3.  **Create an Azure Container Registry (ACR)**: This is where your Docker images will be stored.
    ```bash
    az acr create --resource-group YourResourceGroupName --name YourUniqueACRName --sku Basic --admin-enabled true
    ```
    *(Replace `YourUniqueACRName` with a globally unique name for your registry)*.

4.  **Create a Service Principal**: This will be used by GitHub Actions to authenticate with Azure. The command will output a JSON object. You will need this entire object for the GitHub secret.
    ```bash
    az ad sp create-for-rbac --name "GitHubActionsDeploy" --role contributor --scopes /subscriptions/YourSubscriptionID/resourceGroups/YourResourceGroupName --sdk-auth
    ```
    *(Replace `YourSubscriptionID` with your Azure Subscription ID)*.

## 2. Configure GitHub Secrets

1.  In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
2.  Click **New repository secret**.
3.  Name the secret `AZURE_CREDENTIALS`.
4.  Paste the entire JSON output from the service principal creation step as the value.

## 3. GitHub Actions Workflow for Azure

You need to create a new workflow file in your repository at `.github/workflows/deploy-azure.yml` with the content below. This workflow will build and deploy your frontend and backend services to Azure Container Apps.

### Create `deploy-azure.yml`

```yaml
# .github/workflows/deploy-azure.yml

name: Deploy to Azure Container Apps

on:
  push:
    branches:
      - main # Or your default branch

env:
  AZURE_RESOURCE_GROUP: "YourResourceGroupName"         # TODO: Replace with your resource group name
  AZURE_CONTAINER_REGISTRY: "YourUniqueACRName"          # TODO: Replace with your ACR name
  BACKEND_CONTAINER_APP_NAME: "your-backend-app-name"  # TODO: Replace with a unique name for the backend app
  FRONTEND_CONTAINER_APP_NAME: "your-frontend-app-name" # TODO: Replace with a unique name for the frontend app

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Log in to Azure Container Registry
        run: az acr login --name ${{ env.AZURE_CONTAINER_REGISTRY }}

      # --- Backend Deployment ---
      - name: Build and Push Backend Image
        run: |
          docker build -t ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/backend:${{ github.sha }} ./backend
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/backend:${{ github.sha }}

      - name: Deploy Backend to Azure Container Apps
        uses: azure/container-apps-deploy-ga@v1
        id: deploy_backend
        with:
          imageToDeploy: ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/backend:${{ github.sha }}
          appName: ${{ env.BACKEND_CONTAINER_APP_NAME }}
          resourceGroup: ${{ env.AZURE_RESOURCE_GROUP }}
          containerRegistry: ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io
          ingress: external
          targetPort: 8080 # Change this if your backend Dockerfile exposes a different port

      # --- Frontend Deployment ---
      - name: Get Backend URL
        id: get_backend_url
        run: |
          BACKEND_URL=$(az containerapp show --name ${{ env.BACKEND_CONTAINER_APP_NAME }} --resource-group ${{ env.AZURE_RESOURCE_GROUP }} --query "properties.configuration.ingress.fqdn" -o tsv)
          echo "BACKEND_URL=https://$BACKEND_URL" >> $GITHUB_ENV

      - name: Build and Push Frontend Image
        run: |
          docker build \
            --build-arg VITE_API_BASE_URL=${{ env.BACKEND_URL }} \
            -t ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/frontend:${{ github.sha }} \
            ./frontend
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/frontend:${{ github.sha }}

      - name: Deploy Frontend to Azure Container Apps
        uses: azure/container-apps-deploy-ga@v1
        with:
          imageToDeploy: ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io/frontend:${{ github.sha }}
          appName: ${{ env.FRONTEND_CONTAINER_APP_NAME }}
          resourceGroup: ${{ env.AZURE_RESOURCE_GROUP }}
          containerRegistry: ${{ env.AZURE_CONTAINER_REGISTRY }}.azurecr.io
          ingress: external
          targetPort: 80 # Standard port for Nginx in the frontend
```

### Update Workflow Configuration

*   After creating the file, open it and replace the placeholder values in the `env` block with your actual Azure resource names.

## 4. Verify Dockerfiles

This workflow assumes your backend container exposes port `8080` and your frontend exposes port `80`. If your `Dockerfile`s use different ports, you **must** update the `targetPort` value in the corresponding deployment step in the `deploy-azure.yml` file.

Once these steps are completed, any push to your `main` branch will automatically trigger the Azure deployment workflow.
