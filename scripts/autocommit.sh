#!/bin/bash

# Auto-commit and sync script
# This script runs in the background and automatically commits and pushes changes

while true; do
    # Check if there are any changes
    if git diff --quiet && git diff --staged --quiet; then
        echo "$(date): No changes to commit"
    else
        echo "$(date): Changes detected, committing..."

        # Add all changes
        git add .

        # Create commit message with timestamp
        COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"

        # Commit
        if git commit -m "$COMMIT_MSG"; then
            echo "$(date): Committed changes"

            # Push to remote
            if git push origin main; then
                echo "$(date): Successfully pushed to remote"
            else
                echo "$(date): Failed to push to remote"
            fi
        else
            echo "$(date): No changes to commit or commit failed"
        fi
    fi

    # Wait for 30 seconds before checking again
    sleep 30
done