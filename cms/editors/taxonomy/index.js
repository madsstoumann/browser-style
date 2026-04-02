/**
 * @file Re-exports the factory, parser functions, and web component for the editor-taxonomy package.
 * @author Mads Stoumann
 * @version 2.1.0
 * @summary 06-01-2026
 */
export { createTaxonomySelector } from './factory.js';
export { googleTaxonomyParser, facebookTaxonomyParser } from './parsers.js';
export { EditorTaxonomy } from './src/index.js';
