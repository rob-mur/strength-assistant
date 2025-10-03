terraform {
  required_version = ">= 1.0"
  
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }
}

provider "supabase" {
  access_token = var.supabase_access_token
}


# Supabase project settings
resource "supabase_settings" "main" {
  project_ref = var.supabase_project_ref
  
  api = jsonencode({
    db_schema            = "public,storage,graphql_public"
    db_extra_search_path = "public,extensions"
    max_rows            = 1000
  })
  
  auth = jsonencode({
    site_url = "https://${var.environment == "production" ? "app" : var.environment}.strengthassistant.com"
    additional_redirect_urls = [
      "https://${var.environment == "production" ? "app" : var.environment}.strengthassistant.com",
      "http://localhost:3000",
      "exp://localhost:19000"
    ]
    jwt_expiry = 3600
    enable_signup = true
    enable_email_confirmations = false
    enable_anonymous_sign_ins = true
  })
}

# Outputs
output "supabase_url" {
  description = "Supabase project URL"
  value       = "https://${var.supabase_project_ref}.supabase.co"
}

output "project_ref" {
  description = "Supabase project reference"
  value       = var.supabase_project_ref
}