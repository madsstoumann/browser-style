# DataEntry

DataEntry is an advanced Web Component that renders a UI from an endpoint (data) and a schema

How to use:
	<data-entry
		data="data/product.json"
		lookup="data/lookup.json"
		messages="data/messages.json"
		schema="data/schema.json"
		lang="en"
		novalidate
		debug>
	</data-entry>

	data, lookup, messages and schema are endpoints

## Data

## Schema
- What is a JSON Schema?
- Extending the schema
	- navigation
  - headline
  - title
  - form
  - messages
- Render
	- How to extend the schema with render methods
	- Methods
		- Array
		- Auosuggest etc.

## Custom Methods
- Extending / adding

## Dynamic Methods
- Extending / adding

## Messages
- Endpoint
- Extending from schema

## Components
- Built in
- How to extend

## Validate
- On by default, bypass with `novalidate`

## Translations
- the `lang` attribute
- translations.js