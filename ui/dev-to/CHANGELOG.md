# Changelog

All notable changes to the Load articles from dev.to component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Improved CSS loading with robust fallback pattern for Netlify and production deployments
- Added `import.meta.url` for proper CSS path resolution across different hosting environments
- Implemented three-tier fallback: CSS module import → CSSStyleSheet constructor → style tag injection
- Added browser compatibility checks for `adoptedStyleSheets` and `CSSStyleSheet`

## [1.0] - 2025-12-01

### Changed
- Added claude.md to analog-clock and data-chart, fixed a minor issue in dev-to

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

