# --- Configuration ---
# Replace 'your-gcp-project-id' with your actual Google Cloud project ID.
export PROJECT_ID="metal-being-482316-d7"

# Set the desired name for your service account.
export SA_NAME="github-actions-deployer"

# --- Script ---

# Set the active project
gcloud config set project $PROJECT_ID

# Create the service account
echo "Creating service account '$SA_NAME'..."
gcloud iam service-accounts create $SA_NAME --display-name="GitHub Actions Deployer"

# Get the full email address of the newly created service account
export SA_EMAIL=$(gcloud iam service-accounts list --filter="displayName:GitHub Actions Deployer" --format="value(email)")

# Grant the required IAM roles to the service account
echo "Granting roles to $SA_EMAIL..."
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/storage.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/artifactregistry.admin"

# Create a JSON key for the service account and save it to a file
echo "Creating and downloading JSON key..."
gcloud iam service-accounts keys create "gcp-sa-key.json" --iam-account=$SA_EMAIL

echo "Service account setup complete. Your key is saved as 'gcp-sa-key.json'."
echo "Copy the contents of this file and add it as a GitHub secret named 'GCP_SA_KEY'."
