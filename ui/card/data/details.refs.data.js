/* GENERATED from ui/card/data/details.json by ui/card/details.build.js — do not edit.
 * Ref-projection table for expandRefs in render.js: type → details array path →
 * { types: allowed target schemaTypes, project: rowKey → dot-path into the target's fields }. */
export default {
	"product": {
		"variants.items": {
			"types": [
				"product"
			],
			"project": {
				"name": "headline",
				"sku": "details.variants.productGroupID",
				"price": "details.price.current",
				"currency": "details.price.currency"
			}
		}
	},
	"faq": {
		"items": {
			"types": [
				"content"
			],
			"project": {
				"question": "headline",
				"answer": "summary"
			}
		}
	},
	"places": {
		"items": {
			"types": [
				"realestate"
			],
			"project": {
				"type": "details.property.type",
				"price": "details.price",
				"floorSize": "details.property.floorSize",
				"numberOfBedrooms": "details.property.bedrooms",
				"numberOfRooms": "details.property.rooms",
				"yearBuilt": "details.property.yearBuilt"
			}
		}
	},
	"podcastseries": {
		"episodes": {
			"types": [
				"podcast"
			],
			"project": {
				"name": "headline",
				"episodeNumber": "details.episodeNumber",
				"duration": "details.duration",
				"durationDisplay": "details.durationDisplay"
			}
		}
	}
};
