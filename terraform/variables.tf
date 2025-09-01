variable "supabase_access_token" {
  description = "Supabase access token for API authentication"
  type        = string
  sensitive   = true
}

variable "supabase_project_ref" {
  description = "Supabase project reference ID"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9]{20}$", var.supabase_project_ref))
    error_message = "Project reference must be a 20-character alphanumeric string."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}