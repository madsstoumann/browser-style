import * as renderMethods from './render.js';
import * as utilityMethods from './utility.js';

export function createDataEntryInstance(parent) {
	return {
		methods: {
			...renderMethods,
		},

		utils: {
			...utilityMethods,
		},

		extensions: {
			renderMethods: {},
			utilityMethods: {},
		},

		extendRenderMethod(name, method) {
			this.extensions.renderMethods[name] = method;
		},

		extendUtilityMethod(name, method) {
			this.extensions.utilityMethods[name] = method;
			this.utils[name] = method;
		},

		getRenderMethod(name) {
			return this.extensions.renderMethods[name] || this.methods[name];
		},

		getUtilityMethod(name) {
			return this.extensions.utilityMethods[name] || this.utils[name];
		},

		data: {},
		schema: {},
		parent,
	};
}