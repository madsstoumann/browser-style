# Commit and Push to Git

Commit staged changes and push to the remote repository, with optional pre-commit documentation updates.

## Instructions

1. **Ask about running documentation commands first:**

   Use the AskUserQuestion tool to ask TWO questions:

   **Question 1:**
   - Header: "Changelogs"
   - Question: "Run /logs to update CHANGELOG.md files before committing?"
   - Options:
     - "No" (Recommended) - Skip changelog updates
     - "Yes" - Run /logs first to update changelogs for ui/ components

   **Question 2:**
   - Header: "AGENTS.md"
   - Question: "Run /docs to update AGENTS.md files before committing?"
   - Options:
     - "No" (Recommended) - Skip AGENTS.md updates
     - "Yes" - Run /docs first to update documentation

2. **Execute pre-commit commands if requested:**
   - If user selected "Yes" for changelogs: Run the `/logs` skill first
   - If user selected "Yes" for AGENTS.md: Run the `/docs` skill first
   - Wait for each to complete before proceeding

3. **Check git status and analyze changes:**
   ```bash
   git status
   git diff --staged --stat
   git diff --stat
   ```
   - Show the user what will be committed
   - If there are no changes to commit, inform the user and stop

4. **Generate commit message suggestion:**

   Analyze the changes to auto-generate a commit message:
   - Run `git diff --staged` and `git diff` to see actual changes
   - Identify affected components/areas (e.g., ui/button, ui/card, scripts/)
   - Determine the type of change:
     - New files → "Add [component/feature]"
     - Modified files → "Update [component/feature]"
     - Deleted files → "Remove [component/feature]"
     - Mixed → summarize the primary change
   - Keep message concise (50 chars for subject line if possible)

   **Examples of generated messages:**
   - "Add /git command for streamlined commits"
   - "Update button component styles and hover states"
   - "Fix color-picker value parsing"
   - "Add weather-widget and weather-forecast components"

5. **Stage and commit:**
   - If there are unstaged changes, ask the user if they want to stage all changes
   - Present the auto-generated commit message using AskUserQuestion:
     - Header: "Commit"
     - Question: "Use this commit message? '[generated message]'"
     - Options:
       - "Yes" (Recommended) - Use the suggested message
       - "Edit" - Let me provide a different message
   - If user selects "Edit", ask them to provide their commit message
   - Create the commit:
     ```bash
     git add . && git commit -m "$(cat <<'EOF'
     Commit message here.

     Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
     EOF
     )"
     ```

6. **Push to remote:**
   ```bash
   git push
   ```
   - If push fails (e.g., remote has new commits), inform the user and suggest pulling first

7. **Report results:**
   - Confirm successful commit with the commit hash
   - Confirm successful push
   - Show any warnings or errors encountered

## Important Notes

- Always show git status before committing so the user knows what's being committed
- Never force push unless explicitly requested
- Include the Co-Authored-By line for Claude contributions
- If pre-commit commands (/logs or /docs) make changes, those changes will be included in the commit
