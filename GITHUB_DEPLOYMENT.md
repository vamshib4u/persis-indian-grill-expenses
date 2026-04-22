# GitHub Backup Setup

GitHub is optional in the current app.

It is used only for backup/export through the in-app `Save to GitHub` action.

## Required Variables

```env
GITHUB_TOKEN=ghp_your_token
GITHUB_REPO=your_username/persis-indian-grill-expenses
GITHUB_BRANCH=main
```

## Token Scope

Create a GitHub personal access token with repository write access for the target repository.

## Notes

- GitHub is not the primary database.
- Neon Postgres remains the source of truth.
- If GitHub backup is not configured, the main app still works normally.
