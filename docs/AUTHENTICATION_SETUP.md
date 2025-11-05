# Authentication Setup Guide

## Default User Credentials

For development and demo purposes, the following user accounts are available:

### Regular User

- **Email:** `user@hermes.local`
- **Password:** `TfppPEsXnfZluUi52ne538O`
- **Role:** user

### Site Owner (Admin)

- **Email:** `owner@hermes.local`
- **Password:** `4a6lJebYdNkr2zjq5j59rTt`
- **Role:** admin

### Platform Engineer

- **Email:** `engineer@hermes.local`
- **Password:** `engineer123` (demo/development only - **CHANGE IN PRODUCTION**)
- **Role:** platform_engineer

## Important Security Notes

- **Demo passwords are for development/testing only**
- **Change all default passwords immediately in production environments**
- The platform engineer account has full system access - secure it properly

## Security Notes

- The regular user and admin passwords are 23-character random alphanumeric
  strings
- The platform engineer password must be set externally via environment secrets
- These demo credentials should only be used in development/preview environments
- In production, implement proper authentication with bcrypt password hashing
- Never commit `.dev.vars` to version control

## Password Requirements

When setting the platform engineer password:

- Use a strong, unique password
- Minimum 12 characters recommended
- Include a mix of uppercase, lowercase, numbers, and special characters
- Store securely using a password manager
