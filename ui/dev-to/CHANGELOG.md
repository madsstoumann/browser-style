# Changelog

All notable changes to the Load articles from dev.to component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2] - 2026-01-24

### Added
- URL parameter `?page=X` for pagination state - refreshing the page loads all articles up to that page
- URL parameter `?article=ID` for deep linking to specific articles
- Clickable cover images in list view - images now navigate to the article detail view
- Back button support with proper pagination restoration from URL

### Changed
- Popstate handler now reads state from URL parameters instead of history state
- Initial page load checks for both `?article` and `?page` URL parameters
- When viewing an article, `?page` is removed from URL and replaced with `?article=ID`
- URL only shows `?page=X` when X > 1 to keep URLs clean

### Fixed
- Refreshing page with `?article=ID` now correctly loads the article instead of the list
- Back button now correctly restores pagination state (shows all pages up to the saved page)
- Cover images in list view now have `cursor: pointer` style

### Styles
- Added `::slotted(*) { margin: 0; }` to list-header for cleaner slotted content
- Added `a:has(img) { display: contents; }` for clickable image wrappers
- Added `cursor: pointer` to list images

## [1.0] - 2025-12-01

### Changed
- Added claude.md to analog-clock and data-chart, fixed a minor issue in dev-to
- docs: auto-generate CHANGELOG.md for changed components
- docs: update CHANGELOG.md with recent fixes and improvements to CSS loading
- docs: auto-generate CHANGELOG.md for changed components
- chore: bump version to 1.0.5 in package.json
- Merge branch 'main' of https://github.com/madsstoumann/browser-style

## [1.1] - 2025-02-01

### Changed
- Add Dev.To component with article fetching and rendering functionality
- Fix title typo and update dev-to component attributes for article fetching
- Remove unused article attribute from Dev.To component in index.html
- Add styles for Dev.To component and remove unused attributes
- Add DevTo component with package.json and readme for article display
- Deleted manual article.json file
- Update Dev.To component in index.html to enhance article display and add usage examples
- Update package versions and add dev-to module in package-lock.json
- Refactor DevTo component styles and enhance article display with theme selection
- Refactor DevTo component styles and update documentation with usage examples
- Update DevTo documentation
- Export DevTo class as a module, update version to 1.0.3, and add documentation for the unofficial Dev.To embed web component
- Update Brutalist theme styles and increment version to 1.0.4

