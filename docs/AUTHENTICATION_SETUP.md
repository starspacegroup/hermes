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
- **Password:** Set via environment variable (see below)
- **Role:** platform_engineer

## Platform Engineer Password Configuration

The platform engineer password is not hardcoded and must be set via an
environment variable for security reasons.

### Local Development

1. Create a `.dev.vars` file in the project root (copy from
   `.dev.vars.example`):
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Set your password in `.dev.vars`:
   ```
   PLATFORM_ENGINEER_PASSWORD=your_secure_password_here
   ```

3. The `.dev.vars` file is gitignored and will be automatically loaded by
   Wrangler during local development.

### Production/Preview Environment

For deployed environments, set the password as a Cloudflare secret:

```bash
# For production
wrangler secret put PLATFORM_ENGINEER_PASSWORD

# For preview
wrangler secret put PLATFORM_ENGINEER_PASSWORD --env preview
```

You'll be prompted to enter the password securely.

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
