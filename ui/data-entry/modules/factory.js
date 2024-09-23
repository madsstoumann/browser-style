import * as renderMethods from './render.js';
import * as customMethods from './custom.js';
import { dynamicFunctions, extendDynamicFunction } from './dynamic.js';

export function createDataEntryInstance(parent) {
	return {
		methods: {
			...renderMethods,
		},
		custom: {
			...customMethods,
		},
		extensions: {
			customMethods: {},
			renderMethods: {},
		},

		// Extend methods for custom and render methods
		extendRenderMethod(name, method) {
			this.extensions.renderMethods[name] = method;
		},

		extendCustomMethod(name, method) {
			this.extensions.customMethods[name] = method;
			this.custom[name] = method;
		},

		// Get methods for render and custom
		getRenderMethod(name) {
			return this.extensions.renderMethods[name] || this.methods[name];
		},

		getCustomMethod(name) {
			return this.extensions.customMethods[name] || this.custom[name];
		},

		// Use extendDynamicFunction from dynamic.js
		extendDynamicFunction,

		// Retrieve a dynamic function
		getDynamicFunction(name) {
			return dynamicFunctions[name] || null;
		},

		data: {},
		schema: {},
		parent,
	};
}
