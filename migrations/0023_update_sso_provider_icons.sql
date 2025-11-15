-- Migration: 0019_update_sso_provider_icons
-- Description: Update SSO provider icons from emojis to lucide icon names
-- Rollback: Update the icons back to emojis if needed

-- Update existing provider icons to use lucide icon names instead of emojis
-- This migration is safe to run multiple times (idempotent)

-- Google: 🔍 -> Chrome
UPDATE sso_providers SET icon = 'Chrome' WHERE provider = 'google' AND icon = '🔍';

-- LinkedIn: 💼 -> Linkedin
UPDATE sso_providers SET icon = 'Linkedin' WHERE provider = 'linkedin' AND icon = '💼';

-- Apple: 🍎 -> Apple
UPDATE sso_providers SET icon = 'Apple' WHERE provider = 'apple' AND icon = '🍎';

-- Facebook: 📘 -> Facebook
UPDATE sso_providers SET icon = 'Facebook' WHERE provider = 'facebook' AND icon = '📘';

-- GitHub: 🐙 -> Github
UPDATE sso_providers SET icon = 'Github' WHERE provider = 'github' AND icon = '🐙';

-- Twitter: 𝕏 -> Twitter
UPDATE sso_providers SET icon = 'Twitter' WHERE provider = 'twitter' AND (icon = '𝕏' OR icon = '𝕏');

-- Microsoft: 🪟 -> Building
UPDATE sso_providers SET icon = 'Building' WHERE provider = 'microsoft' AND icon = '🪟';
