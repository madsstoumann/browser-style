import * as renderMethods from './render.js';
import * as utilityMethods from './utility.js';

const dataEntry = {
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
		dataEntry.extensions.renderMethods[name] = method;
	},

	extendUtilityMethod(name, method) {
		dataEntry.extensions.utilityMethods[name] = method;
		dataEntry.utils[name] = method; 
	},

	getRenderMethod(name) {
		return dataEntry.extensions.renderMethods[name] || dataEntry.methods[name];
	},

	getUtilityMethod(name) {
		return dataEntry.extensions.utilityMethods[name] || dataEntry.utils[name];
	},

	data: {},
	schema: {},
};

export { dataEntry };