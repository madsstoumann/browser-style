# Update CHANGELOG.md for Unpushed Changes

Analyze unpushed Git commits and update CHANGELOG.md files for affected ui/ components.

## Instructions

1. **Find unpushed commits and their changed files:**
   ```bash
   git log origin/main..HEAD --pretty=format:"%H|%s|%ad" --date=short --name-only
   ```
   Parse each commit to get: hash, message, date, and affected files.

2. **Group changes by ui/ component:**
   - Only process files under `ui/` directory
   - Group by the first subfolder (e.g., `ui/button/`, `ui/card/`)
   - Skip files not in a ui/ subfolder

3. **For each affected component, update its CHANGELOG.md:**

   **Check for existing entries:**
   - Read the component's CHANGELOG.md if it exists
   - Look for the commit hash in the file (stored as HTML comment: `<!-- commit: abc123 -->`)
   - Skip commits that are already documented

   **Categorize changes by commit message prefix:**
   - `feat:` or `add:` → **Added**
   - `fix:` → **Fixed**
   - `change:` or `update:` or `refactor:` → **Changed**
   - `remove:` or `delete:` → **Removed**
   - `deprecate:` → **Deprecated**
   - `security:` → **Security**
   - No prefix or other → **Changed** (default)

   **CHANGELOG.md format (Keep a Changelog standard):**
   ```markdown
   # Changelog

   All notable changes to this package will be documented in this file.

   The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

   ## [Unreleased]

   ### Added
   - Description of addition <!-- commit: abc1234 -->

   ### Changed
   - Description of change <!-- commit: def5678 -->

   ### Fixed
   - Description of fix <!-- commit: 901abcd -->
   ```

4. **Writing entries:**
   - Use the commit message (without the prefix) as the description
   - Append the commit hash as an HTML comment for duplicate detection
   - Add entries under the `## [Unreleased]` section
   - Create appropriate category headers (### Added, ### Fixed, etc.) if they don't exist
   - If CHANGELOG.md doesn't exist, create it with the standard header

5. **Report results:**
   - List which components had CHANGELOG.md updated
   - List which commits were added to each
   - List any commits that were skipped (already documented)

## Important Notes

- Only update CHANGELOG.md files in `ui/[component]/` directories
- Never duplicate entries - always check for commit hash before adding
- Preserve existing content and formatting in CHANGELOG.md files
- The `## [Unreleased]` section collects changes until the next version release
- Commit hashes in HTML comments are invisible when rendered but enable duplicate detection
