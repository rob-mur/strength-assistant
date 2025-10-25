# Web hosting configuration for React Native/Expo web deployment
# Manages Vercel project configuration and environment variables

# Import existing Vercel project (created manually during setup)
resource "vercel_project" "web_app" {
  name = "strength-assistant"
  
  # Import existing project using: terraform import vercel_project.web_app [project_id]
  # This connects to the manually created Vercel project
  
  framework         = "other"
  build_command     = "npx expo export -p web"
  output_directory  = "dist"
  install_command   = "npm ci"
  
  # Git repository configuration
  git_repository = {
    type = "github"
    repo = "strength-assistant"  # Update this to match your repo name
  }
  
  # Environment variables for all deployment environments
  environment = [
    {
      key    = "EXPO_PUBLIC_SUPABASE_URL"
      value  = "https://${var.supabase_project_ref}.supabase.co"
      target = ["production", "preview"]
    },
    {
      key    = "EXPO_PUBLIC_ENVIRONMENT"
      value  = var.environment == "dev" ? "preview" : var.environment
      target = ["production", "preview"]
    }
  ]
}

# Vercel project environment variables for Supabase integration
# Note: Supabase anon key will be added via GitHub Actions for security
resource "vercel_project_environment_variable" "supabase_anon_key" {
  project_id = vercel_project.web_app.id
  key        = "EXPO_PUBLIC_SUPABASE_ANON_KEY"
  value      = "will-be-set-by-github-actions"  # Placeholder - actual key set via CI/CD
  target     = ["production", "preview"]
  type       = "encrypted"
}

# Custom domain configuration (optional - uncomment if you have a domain)
# resource "vercel_project_domain" "web_app_domain" {
#   project_id = vercel_project.web_app.id
#   domain     = "app.strengthassistant.com"
# }

# Outputs for use in GitHub Actions
output "vercel_project_id" {
  description = "Vercel project ID for deployment"
  value       = vercel_project.web_app.id
}

output "vercel_project_name" {
  description = "Vercel project name"
  value       = vercel_project.web_app.name
}

output "web_deployment_url" {
  description = "Base URL for web deployments"
  value       = "https://${vercel_project.web_app.name}.vercel.app"
}

# Supabase outputs needed for web deployment environment variables
output "supabase_anon_key" {
  description = "Supabase anonymous key for web application"
  value       = "placeholder-will-be-set-in-github-actions"
  sensitive   = true
}