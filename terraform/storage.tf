provider "google" {
  project = "strengthassistant"
  region  = "eu-west-3" 
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "google_storage_bucket" "terraform_state_bucket" {
  name      = "vercel-tf-state-${random_id.bucket_suffix.hex}"
  location  = "EUROPE-WEST3"
  versioning {
    enabled = true
  }

  uniform_bucket_level_access = true

  force_destroy = false 

  public_access_prevention = "enforced"

  storage_class = "REGIONAL"
}

output "gcs_state_bucket_name" {
  value = google_storage_bucket.terraform_state_bucket.name
  description = "The name of the GCS bucket used for Terraform remote state."
}
