
# DataGrid Component Documentation

## Table of Contents

1. [Introduction to DataGrid](#introduction-to-datagrid)
   - Overview of DataGrid and its purpose
   - Main features and capabilities
   - Usage scenarios

2. [Basic Setup](#basic-setup)
   - Adding DataGrid to your HTML
   - Minimal HTML structure requirements
   - Default behavior and initial rendering

3. [Configuration Options](#configuration-options)
   - List of attributes and properties available for customization
   - Explanation of `data` and `i18n` attributes
     - Loading data from URL or JSON
     - Internationalization (i18n) settings and JSON format
   - Attribute reference:
     - `itemsperpage`, `page`, `lang`, `searchable`, `selectable`, `pagination`, `external-navigation`
     - Explanation of each attribute’s usage and default values

4. [Data and Schema Loading](#data-and-schema-loading)
   - Using the `data` attribute to load static JSON or URLs
   - Setting the `schema` attribute for data structure configuration
   - Example schema format and field definitions
   - Loading i18n settings via the `i18n` attribute (URL or JSON)

5. [Internationalization (i18n)](#internationalization-i18n)
   - Setting default language (`lang` attribute)
   - Providing translations via JSON
   - Customizing text labels for UI elements in multiple languages

6. [Customizing Appearance and Behavior](#customizing-appearance-and-behavior)
   - Overview of customizable settings:
     - `density`, `densityOptions`, `colWidths`, `wrapperClasses`, `tableClasses`, `textwrap`, etc.
   - Examples of configuring `density` (e.g., compact vs. large layouts)
   - Configuring text wrapping (`textwrap` attribute)
   - Setting sticky columns (`stickyCols` attribute) and overflow handling
   - Adding custom table classes for appearance control

7. [Interactivity and Events](#interactivity-and-events)
   - List of dispatchable events:
     - `dg:loaded`, `dg:requestpagechange`, `dg:itemsperpage`, etc.
   - Setting up event listeners to handle user interactions
   - Dispatching events from the grid and capturing events externally
   - Example: Handling page navigation with `dg:requestpagechange`
   - Using `dg:loaded` for custom initialization

8. [Sorting, Searching, and Filtering](#sorting-searching-and-filtering)
   - Enabling sorting (`sortable` attribute) and customizing sort behavior
   - Using the `searchable` attribute and setting up search functionality
   - Filtering columns based on user input

9. [Pagination Controls](#pagination-controls)
   - Setting `itemsperpage` for page size control
   - Using the `pagination` attribute to enable or disable pagination
   - Navigating pages programmatically or through user interaction
   - Handling `external-navigation` for server-side pagination

10. [Data Export and Printing](#data-export-and-printing)
   - Enabling data export options (`exportCSV`, `exportJSON`)
   - Example: Exporting data to CSV or JSON format
   - Using the `printable` attribute to enable table printing

11. [Custom Selection and Row Management](#custom-selection-and-row-management)
   - Enabling row selection (`selectable` attribute)
   - Handling row selection and multi-selection logic
   - Using the `selected` event to capture selected rows
   - Example: Handling selected rows programmatically

12. [Column Resizing and Layout Control](#column-resizing-and-layout-control)
   - Enabling column resizing with `colWidths`
   - Adjusting column widths dynamically
   - Setting initial column widths programmatically

13. [Performance and Debugging Tools](#performance-and-debugging-tools)
   - Enabling debug mode (`debug` attribute) for troubleshooting
   - Performance considerations for large datasets
   - Optimizing DataGrid settings for fast rendering and minimal latency

14. [Customization Examples](#customization-examples)
   - Example configurations for different use cases (e.g., product tables, employee lists)
   - Sample code snippets for common configurations
   - Tips for combining attributes to achieve specific behaviors

15. [API Reference for Implementers](#api-reference-for-implementers)
   - List of public methods (e.g., `setPage`, `setItemsPerPage`, `navigatePage`)
   - Example: Calling API methods to dynamically update the DataGrid
   - Custom functions: Using `setLoading` to show a loading spinner

---

Each section includes practical examples, configuration snippets, and clear descriptions to help users implement and customize the DataGrid component effectively.
