# Changelog

All notable changes to the dev-to component will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Improved CSS loading with robust fallback pattern for Netlify and production deployments
- Added `import.meta.url` for proper CSS path resolution across different hosting environments
- Implemented three-tier fallback: CSS module import → CSSStyleSheet constructor → style tag injection
- Added browser compatibility checks for `adoptedStyleSheets` and `CSSStyleSheet`

## [1.0.4] - 2025-02-12

### Changed
- Updated Brutalist theme styles

## [1.0.3] - 2025-02-11

### Changed
- Exported DevTo class as a module
- Added comprehensive documentation for the unofficial Dev.To embed web component
- Updated component documentation with usage examples

## [1.0.2] - 2025-02-11

### Changed
- Refactored component styles
- Enhanced article display with theme selection

## [1.0.1] - 2025-02-11

### Changed
- Refactored DevTo component styles
- Updated documentation

## [1.0.0] - 2025-02-11

### Added
- Initial release of dev-to component
- Load and display articles from dev.to API
- Support for displaying user articles list
- Support for displaying single articles
- Pagination with "Load More" functionality
- Internationalization support
- Custom theme support
- Shadow DOM encapsulation
- Responsive design
- History API integration for navigation

### Features
- Display articles from any dev.to user
- Show article cover images
- Format publication dates
- Display reactions count
- Tag display
- External or internal link handling
- Customizable items per page
