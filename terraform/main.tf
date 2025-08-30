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
  project_ref  = var.supabase_project_ref
}

# Variables
variable "supabase_access_token" {
  description = "Supabase access token"
  type        = string
  sensitive   = true
}

variable "supabase_project_ref" {
  description = "Supabase project reference ID"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"
}

# Exercises table
resource "supabase_table" "exercises" {
  name = "exercises"

  column {
    name = "id"
    type = "uuid"
    default = "gen_random_uuid()"
    primary_key = true
  }

  column {
    name = "name"
    type = "text"
    nullable = false
  }

  column {
    name = "user_id"
    type = "uuid"
    nullable = false
    references = {
      table  = "auth.users"
      column = "id"
      on_delete = "CASCADE"
    }
  }

  column {
    name = "created_at"
    type = "timestamptz"
    default = "now()"
  }

  rls_enabled = true
}

# RLS Policy for exercises table
resource "supabase_policy" "exercises_user_policy" {
  table_name = supabase_table.exercises.name
  name       = "Users can manage their own exercises"
  command    = "ALL"
  expression = "auth.uid() = user_id"
}

# Indexes for performance
resource "supabase_index" "exercises_user_id_idx" {
  table_name = supabase_table.exercises.name
  name       = "exercises_user_id_idx"
  columns    = ["user_id"]
}

resource "supabase_index" "exercises_created_at_idx" {
  table_name = supabase_table.exercises.name
  name       = "exercises_created_at_idx"
  columns    = ["created_at"]
  order      = "DESC"
}

# Outputs
output "supabase_url" {
  description = "Supabase project URL"
  value       = "https://${var.supabase_project_ref}.supabase.co"
}

output "exercises_table_name" {
  description = "Name of the exercises table"
  value       = supabase_table.exercises.name
}