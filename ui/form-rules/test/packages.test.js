import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { defineTypes } from '../index.js';
import formats from '../../form-types/formats/functions.js';
import postcodes, { FORMATS } from '../../form-types/postcodes/functions.js';
import eu from '../../form-types/eu/functions.js';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

test('the format, postcode and EU packages load next to core, and every check they name exists', () => {
	const docs = ['formats', 'postcodes', 'eu'].map(name => load(`../../form-types/${name}/types.json`));
	const registry = defineTypes(load('../types/core.json'), ...docs);
	assert.deepEqual(registry.errors, []);
	const functions = { ...formats, ...postcodes, ...eu };
	for (const type of registry.types) [].concat(type.template.validation?.check ?? []).forEach(name => assert.equal(typeof functions[name], 'function', `${type.kind}: ${name}`));
	assert.equal(docs[1].types.length, Object.keys(FORMATS).length);
});

test('format checks verify check digits', () => {
	assert.equal(formats.isbn('0-306-40615-2'), null);
	assert.equal(formats.isbn('978-0-306-40615-7'), null);
	assert.equal(formats.isbn('978-0-306-40615-6').code, 'isbn');
	assert.equal(formats.gtin('4006381333931'), null);
	assert.equal(formats.gtin('4006381333932').code, 'gtin');
	assert.equal(formats.ipv4('192.168.0.1'), null);
	assert.equal(formats.ipv4('256.1.1.1').code, 'ipv4');
	assert.equal(formats.ipv4('01.1.1.1').code, 'ipv4');
});

test('postcodes and VAT numbers follow each country', () => {
	assert.equal(postcodes.postcodeDk('2100'), null);
	assert.equal(postcodes.postcodeUk('SW1A 1AA'), null);
	assert.equal(postcodes.postcodeUs('20500-0001'), null);
	assert.equal(postcodes.postcodeNl('1011AB'), null);
	assert.equal(postcodes.postcodeSe('11455'), null);
	assert.equal(postcodes.postcodeDk('210').code, 'postcode-dk');
	assert.match(postcodes.postcodeUk('12345').message, /SW1A 1AA/);
	assert.equal(eu.euVat('DK 12 34 56 78'), null);
	assert.equal(eu.euVat('DE123456789'), null);
	assert.equal(eu.euVat('DE12345678').code, 'eu-vat');
	assert.equal(eu.euVat('US123').code, 'eu-vat');
});
