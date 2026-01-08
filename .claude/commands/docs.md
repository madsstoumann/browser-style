---
description: Check changed files and update AGENTS.md documentation if needed
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(find:*), Read, Edit, Glob, Grep
---

# Update AGENTS.md Documentation

Check for uncommitted or unpushed changes and update relevant AGENTS.md files.

## Instructions

1. **Find changed files not yet pushed:**
   - Run `git status` to see uncommitted changes
   - Run `git log origin/main..HEAD --name-only` to see committed but unpushed files
   - Combine both lists to get all changed files

2. **For each changed file:**
   - Determine the component folder (the first directory under `ui/` if applicable, or root level)
   - Check if that folder has an `AGENTS.md` file
   - If no AGENTS.md exists, skip that file

3. **Analyze changes against documentation:**
   - Read the AGENTS.md file
   - Read the changed files to understand what changed
   - Determine if the changes affect:
     - Public API (new/changed attributes, properties, methods, events)
     - File structure (new/removed files)
     - Dependencies (new imports, removed dependencies)
     - Component behavior or lifecycle
     - CSS parts or custom properties

4. **Update AGENTS.md if needed:**
   - Only update sections that are affected by the changes
   - Keep the existing documentation style and format
   - Add new entries to existing tables/lists rather than rewriting sections
   - If a significant new feature was added, document it appropriately

5. **Report what was done:**
   - List which AGENTS.md files were checked
   - List which were updated and why
   - List which had no documentation updates needed

## Important Notes

- Do NOT create new AGENTS.md files - only update existing ones
- Do NOT update documentation for trivial changes (typo fixes, formatting, comments)
- Focus on user-facing API changes and architectural decisions
- Preserve the existing writing style in each AGENTS.md
