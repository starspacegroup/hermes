# Coverage Badge Setup Instructions

The coverage badge is automatically updated by GitHub Actions. To complete the setup:

## 1. Create a GitHub Gist

1. Go to https://gist.github.com
2. Create a new **public** gist with:
   - Filename: `hermes-coverage.json`
   - Content: `{"schemaVersion": 1, "label": "coverage", "message": "0%", "color": "red"}`
3. Save the Gist ID from the URL (e.g., if the URL is `https://gist.github.com/username/abc123def456`, the ID is `abc123def456`)

## 2. Create a Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Coverage Badge Token"
4. Select the **gist** scope (only this is needed)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

## 3. Add Secrets to Repository

1. Go to your repository settings: `https://github.com/starspacegroup/hermes/settings/secrets/actions`
2. Add two new secrets:
   - **GIST_SECRET**: Paste the Personal Access Token from step 2
   - **GIST_ID**: Paste the Gist ID from step 1

## 4. Update README Badge URL

1. Open `README.md`
2. Find the coverage badge line (line 3)
3. Replace `GIST_ID_HERE` with your actual Gist ID from step 1

Example:

```markdown
[![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/starspacegroup/abc123def456/raw/hermes-coverage.json)](./coverage/index.html)
```

## 5. Test the Action

1. Commit and push your changes
2. Go to the Actions tab in your repository
3. The "Code Coverage" workflow should run automatically
4. After it completes, check that the badge updates in your README

## How It Works

- Every push to `main` or PR triggers the coverage workflow
- Tests run with coverage enabled
- Coverage percentage is extracted from the HTML report
- The Gist is updated with the new coverage data
- The badge in README automatically reflects the latest coverage
- Badge color changes based on coverage:
  - 🟢 Green: > 80%
  - 🟡 Yellow: 60-80%
  - 🔴 Red: < 60%

## Troubleshooting

If the badge shows "invalid":

- Verify the Gist is **public**
- Check that both secrets are set correctly
- Ensure the Gist ID in README matches the GIST_ID secret
- Check the Actions logs for any error messages
