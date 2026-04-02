import * as renderMethods from './render.js';
import * as customMethods from './custom.js';
import { dynamicFunctions, extendDynamicFunction } from './dynamic.js';

/**
 * Creates a new data entry instance with methods for rendering, custom actions, and dynamic functions.
 *
 * @param {Object} parent - The parent object to which this instance belongs.
 * @returns {Object} The data entry instance with various methods and properties.
 *
 * @property {Object} methods - Contains render methods.
 * @property {Object} custom - Contains custom methods.
 * @property {Object} extensions - Contains custom and render methods extensions.
 * @property {Function} extendRenderMethod - Extends the render methods with a new method.
 * @property {Function} extendCustomMethod - Extends the custom methods with a new method.
 * @property {Function} getRenderMethod - Retrieves a render method by name.
 * @property {Function} getCustomMethod - Retrieves a custom method by name.
 * @property {Function} extendDynamicFunction - Extends dynamic functions (imported from dynamic.js).
 * @property {Function} getDynamicFunction - Retrieves a dynamic function by name.
 * @property {Object} data - Contains data related to the instance.
 * @property {Object} schema - Contains schema related to the instance.
 * @property {Object} parent - The parent object.
 */
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

		constants: {},
		data: {},
		schema: {},
		parent,
	};
}
