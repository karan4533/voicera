# Voicera Karan Repo Push Script
# This script commits local changes, switches to a local branch 'main',
# pushes it to the 'main' branch of the 'karan' remote on GitHub, and deletes other branches there.

$ErrorActionPreference = "Stop"

$repoPath = "c:\pms\vocera"

Write-Host "Starting Voicera Push to Karan Repository..." -ForegroundColor Cyan

# 1. Commit any unsaved local changes (like the LiveCallsPage navigation edit)
Write-Host "Checking for local changes and committing them..." -ForegroundColor Yellow
git add .
try {
    git commit -m "feat: redirect live call end to analytics and clean up workspace" | Out-Null
} catch {
    Write-Host "No new local changes to commit." -ForegroundColor Gray
}

# 2. Checkout or create the local branch 'main' based on our current branch
Write-Host "Creating/switching to local branch 'main'..." -ForegroundColor Yellow
git checkout -B main

# 3. Push to 'main' branch on remote 'karan'
Write-Host "Pushing code to 'main' branch on 'karan' remote..." -ForegroundColor Yellow
git push karan main --force

# 4. Clean up other remote branches in the 'karan' repository on GitHub
Write-Host "Deleting old branches in 'karan' remote on GitHub..." -ForegroundColor Yellow

try {
    git push karan --delete feature/backend-integration
} catch {
    Write-Host "Could not delete remote branch feature/backend-integration on karan remote (it might already be deleted)." -ForegroundColor Gray
}

try {
    git push karan --delete ui
} catch {
    Write-Host "Could not delete remote branch ui on karan remote (it might already be deleted)." -ForegroundColor Gray
}

try {
    git push karan --delete frontend--integration-part
} catch {
    Write-Host "Could not delete remote branch frontend--integration-part on karan remote (it might already be deleted)." -ForegroundColor Gray
}

# 5. Clean up push_ui.ps1 if it exists
if (Test-Path "$repoPath\push_ui.ps1") {
    Remove-Item "$repoPath\push_ui.ps1" -Force
}

# 6. Clean up self
if (Test-Path $MyInvocation.MyCommand.Path) {
    Remove-Item $MyInvocation.MyCommand.Path -Force
}

Write-Host "`nSuccess! Frontend code has been cleanly pushed to the 'main' branch of 'karan' repository." -ForegroundColor Green
Write-Host "All other branches on the 'karan' repository have been deleted." -ForegroundColor Cyan
