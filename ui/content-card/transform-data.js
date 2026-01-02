/**
 * Transform card data to Contentful-compatible structure
 *
 * Converts flat card JSON to the universal content model format:
 * - internal_name: Card identifier
 * - headline, subheadline, summary, category: Top-level CMS fields
 * - tags: Array of tag strings
 * - data: JSON containing type + all other card data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Transform a flat card object to Contentful structure
 */
function transformCard(card) {
  const { id, type, content, tags, media, ...rest } = card;

  // Extract top-level CMS fields from content
  const headline = content?.headline || '';
  const subheadline = content?.subheadline || '';
  const summary = content?.summary || '';
  const category = content?.category || '';

  // Normalize tags to string array
  let normalizedTags = [];
  if (Array.isArray(tags)) {
    normalizedTags = tags.map(tag => typeof tag === 'string' ? tag : tag.name);
  }

  // Build the data object with type and remaining properties
  // Keep content object but without the fields we extracted to top level
  const contentRemainder = { ...content };
  delete contentRemainder.headline;
  delete contentRemainder.subheadline;
  delete contentRemainder.summary;
  delete contentRemainder.category;

  const data = {
    type,
    ...rest,
    // Only include content if there's remaining data
    ...(Object.keys(contentRemainder).length > 0 ? { content: contentRemainder } : {})
  };

  // Also include tags in data if they have URLs (for rendering)
  if (Array.isArray(tags) && tags.some(t => typeof t === 'object' && t.url)) {
    data.tags = tags;
  }

  return {
    id,
    headline,
    subheadline,
    summary,
    category,
    tags: normalizedTags,
    // Media at root level (common across all card types)
    ...(media && { media }),
    data
  };
}

/**
 * Transform all cards from source files
 */
function transformAllCards() {
  const dataPath = path.join(__dirname, 'public/static/data/data.json');
  const cardsPath = path.join(__dirname, 'public/static/data/cards.json');
  const outputPath = path.join(__dirname, 'public/static/data/all-cards.json');

  let allCards = [];

  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    allCards = allCards.concat(data);
  }

  if (fs.existsSync(cardsPath)) {
    const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
    allCards = allCards.concat(cards);
  }

  console.log(`Found ${allCards.length} cards to transform`);

  const transformed = allCards.map(transformCard);

  fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));
  console.log(`Transformed data written to: public/static/data/all-cards.json`);

  // Show example of transformation
  console.log('\nExample transformation:');
  console.log('Before:', JSON.stringify(allCards[0], null, 2).slice(0, 500) + '...');
  console.log('\nAfter:', JSON.stringify(transformed[0], null, 2).slice(0, 500) + '...');
}

transformAllCards();
