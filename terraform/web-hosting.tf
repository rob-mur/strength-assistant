# Web hosting configuration for React Native/Expo web deployment
# Manages Vercel project configuration and environment variables

# Use existing Vercel project (assumes project already exists)
data "vercel_project" "web_app" {
  name = "strength-assistant"
}

# Vercel project environment variables for Supabase integration
resource "vercel_project_environment_variable" "supabase_url" {
  project_id = data.vercel_project.web_app.id
  key        = "EXPO_PUBLIC_SUPABASE_URL"
  value      = "https://${var.supabase_project_ref}.supabase.co"
  target     = ["production", "preview"]
}

# Note: Supabase anon key will be added via GitHub Actions for security
resource "vercel_project_environment_variable" "supabase_anon_key" {
  project_id = data.vercel_project.web_app.id
  key        = "EXPO_PUBLIC_SUPABASE_ANON_KEY"
  value      = var.supabase_anon_key
  target     = ["production", "preview"]
}



# Outputs for use in GitHub Actions
output "vercel_project_id" {
  description = "Vercel project ID for deployment"
  value       = data.vercel_project.web_app.id
}

output "vercel_project_name" {
  description = "Vercel project name"
  value       = data.vercel_project.web_app.name
}

output "web_deployment_url" {
  description = "Base URL for web deployments"
  value       = "https://${data.vercel_project.web_app.name}.vercel.app"
}

