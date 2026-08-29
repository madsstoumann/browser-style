/* GENERATED from ui/card/data/details.json by ui/card/details.build.js — do not edit.
 * The card editor's per-type form schemas: shapes inlined, control defaults applied,
 * lookup vocabularies materialized from render.js / icons.data.js / the manifest. */
export const SCHEMA_TYPE_GROUPS = [
	{
		"label": "Editorial & journalism",
		"options": [
			{
				"value": "content",
				"label": "Content (CreativeWork — fallback)"
			},
			{
				"value": "article",
				"label": "Article"
			},
			{
				"value": "news",
				"label": "News (NewsArticle)"
			},
			{
				"value": "quote",
				"label": "Quote (Quotation)"
			},
			{
				"value": "claim",
				"label": "Fact check (ClaimReview)"
			}
		]
	},
	{
		"label": "Commerce & offers",
		"options": [
			{
				"value": "product",
				"label": "Product"
			},
			{
				"value": "review",
				"label": "Review"
			},
			{
				"value": "booking",
				"label": "Booking (Reservation)"
			},
			{
				"value": "comparison",
				"label": "Comparison (ItemList)"
			},
			{
				"value": "membership",
				"label": "Membership (Offer)"
			},
			{
				"value": "software",
				"label": "Software (SoftwareApplication)"
			},
			{
				"value": "loyalty",
				"label": "Loyalty programme (MemberProgram)"
			}
		]
	},
	{
		"label": "Screen",
		"options": [
			{
				"value": "video",
				"label": "Video (VideoObject)"
			},
			{
				"value": "movie",
				"label": "Movie"
			},
			{
				"value": "tvseries",
				"label": "TV series (TVSeries)"
			},
			{
				"value": "tvepisode",
				"label": "TV episode (TVEpisode)"
			}
		]
	},
	{
		"label": "Audio",
		"options": [
			{
				"value": "podcast",
				"label": "Podcast (PodcastEpisode)"
			},
			{
				"value": "music",
				"label": "Album (MusicAlbum)"
			},
			{
				"value": "musicgroup",
				"label": "Band (MusicGroup)"
			},
			{
				"value": "podcastseries",
				"label": "Podcast series (PodcastSeries)"
			}
		]
	},
	{
		"label": "Page & picture",
		"options": [
			{
				"value": "gallery",
				"label": "Gallery (ImageGallery)"
			},
			{
				"value": "book",
				"label": "Book"
			},
			{
				"value": "comicseries",
				"label": "Comic series (ComicSeries)"
			},
			{
				"value": "comicissue",
				"label": "Comic issue (ComicIssue)"
			}
		]
	},
	{
		"label": "Learning & reference",
		"options": [
			{
				"value": "course",
				"label": "Course"
			},
			{
				"value": "achievement",
				"label": "Achievement (EducationalOccupationalCredential)"
			},
			{
				"value": "goal",
				"label": "Goal (AchieveAction)"
			},
			{
				"value": "howto",
				"label": "How-to (HowTo)"
			},
			{
				"value": "quiz",
				"label": "Quiz — flashcards"
			},
			{
				"value": "glossary",
				"label": "Glossary (DefinedTermSet)"
			}
		]
	},
	{
		"label": "People, work & history",
		"options": [
			{
				"value": "job",
				"label": "Job (JobPosting)"
			},
			{
				"value": "profile",
				"label": "Profile (Person)"
			},
			{
				"value": "timeline",
				"label": "Timeline (EventSeries)"
			},
			{
				"value": "organization",
				"label": "Organization (multi-office)"
			},
			{
				"value": "artist",
				"label": "Artist (Person)"
			}
		]
	},
	{
		"label": "Food & drink",
		"options": [
			{
				"value": "recipe",
				"label": "Recipe"
			},
			{
				"value": "business",
				"label": "Business (LocalBusiness)"
			},
			{
				"value": "menu",
				"label": "Menu"
			}
		]
	},
	{
		"label": "Places, events & property",
		"options": [
			{
				"value": "event",
				"label": "Event"
			},
			{
				"value": "location",
				"label": "Location (Place)"
			},
			{
				"value": "places",
				"label": "Places — a collection on one map (ItemList)"
			},
			{
				"value": "realestate",
				"label": "Real estate listing (RealEstateListing)"
			},
			{
				"value": "vacationrental",
				"label": "Vacation rental (VacationRental)"
			}
		]
	},
	{
		"label": "Community & support",
		"options": [
			{
				"value": "poll",
				"label": "Poll (Question)"
			},
			{
				"value": "faq",
				"label": "FAQ (FAQPage)"
			},
			{
				"value": "contact",
				"label": "Contact (ContactPoint)"
			},
			{
				"value": "social",
				"label": "Social (SocialMediaPosting)"
			},
			{
				"value": "qa",
				"label": "Q&A (QAPage)"
			}
		]
	},
	{
		"label": "Data, health & operations",
		"options": [
			{
				"value": "statistic",
				"label": "Statistic (Observation)"
			},
			{
				"value": "announcement",
				"label": "Announcement (SpecialAnnouncement)"
			},
			{
				"value": "filelist",
				"label": "File list — downloadable files (ItemList)"
			},
			{
				"value": "dataset",
				"label": "Dataset"
			},
			{
				"value": "service",
				"label": "Service"
			},
			{
				"value": "medical",
				"label": "Health article (MedicalWebPage)"
			}
		]
	}
];
export const DETAILS_SCHEMAS = {
	"content": {},
	"article": {
		"subtype": {
			"type": "select",
			"lookup": "SUBTYPES.article",
			"control": "select"
		}
	},
	"news": {
		"subtype": {
			"type": "select",
			"lookup": "SUBTYPES.news",
			"control": "select"
		}
	},
	"product": {
		"rating": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"value": {
					"type": "number",
					"label": "Rating",
					"control": "number"
				},
				"max": {
					"type": "number",
					"note": "default 5",
					"control": "number"
				},
				"count": {
					"type": "number",
					"control": "number"
				}
			}
		},
		"price": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"current": {
					"type": "number",
					"control": "number"
				},
				"original": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				},
				"discountText": {
					"type": "string",
					"control": "text"
				}
			}
		},
		"availability": {
			"type": "string",
			"control": "text"
		},
		"validUntil": {
			"type": "date",
			"control": "date"
		},
		"validUntilDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"sku": {
			"type": "string",
			"label": "SKU",
			"control": "text"
		},
		"brand": {
			"type": "string",
			"note": "→ Brand.name, rendered in the subheadline slot",
			"control": "text"
		},
		"brandUrl": {
			"type": "url",
			"note": "crawlable <a itemprop=\"url\"> around the brand name",
			"control": "url"
		},
		"subtype": {
			"type": "select",
			"lookup": "SUBTYPES.product",
			"control": "select"
		},
		"variants": {
			"type": "object",
			"note": "ProductGroup — emits only when subtype resolves to ProductGroup",
			"fields": {
				"variesBy": {
					"type": "array",
					"items": {
						"type": "select",
						"lookup": "VARIANT_AXES",
						"control": "select"
					},
					"control": "repeater"
				},
				"productGroupID": {
					"type": "string",
					"label": "Product group ID",
					"control": "text"
				},
				"control": {
					"type": "select",
					"lookup": "VARIANT_CONTROLS",
					"control": "select"
				},
				"tile": {
					"type": "string",
					"control": "text"
				},
				"layout": {
					"type": "string",
					"control": "text"
				},
				"items": {
					"type": "array",
					"items": {
						"fields": {
							"name": {
								"type": "string",
								"control": "text"
							},
							"sku": {
								"type": "string",
								"label": "SKU",
								"control": "text"
							},
							"color": {
								"type": "string",
								"control": "text"
							},
							"size": {
								"type": "string",
								"control": "text"
							},
							"material": {
								"type": "string",
								"control": "text"
							},
							"pattern": {
								"type": "string",
								"control": "text"
							},
							"label": {
								"type": "string",
								"note": "short picker label (variant control tile)",
								"control": "text"
							},
							"price": {
								"type": "number",
								"control": "number"
							},
							"currency": {
								"type": "string",
								"control": "text"
							},
							"availability": {
								"type": "string",
								"control": "text"
							},
							"url": {
								"type": "url",
								"control": "url"
							},
							"image": {
								"type": "url",
								"also": [
									"object"
								],
								"note": "url, or {src, alt} for the collage tile",
								"control": "url"
							}
						}
					},
					"control": "repeater"
				}
			},
			"control": "fieldset"
		},
		"reviews": {
			"type": "array",
			"items": {
				"fields": {
					"author": {
						"type": "string",
						"control": "text"
					},
					"rating": {
						"type": "number",
						"control": "number"
					},
					"max": {
						"type": "number",
						"control": "number"
					},
					"datePublished": {
						"type": "date",
						"control": "date"
					},
					"dateDisplay": {
						"type": "string",
						"display": true,
						"noBase": true,
						"control": "text"
					},
					"context": {
						"type": "string",
						"control": "text"
					},
					"headline": {
						"type": "string",
						"control": "text"
					},
					"body": {
						"type": "text",
						"control": "textarea"
					}
				}
			},
			"note": "detail pages only, never the teaser",
			"control": "repeater"
		}
	},
	"event": {
		"startDate": {
			"type": "datetime",
			"control": "datetime"
		},
		"endDate": {
			"type": "datetime",
			"control": "datetime"
		},
		"dateDisplay": {
			"type": "string",
			"display": true,
			"noBase": true,
			"control": "text"
		},
		"attendanceMode": {
			"type": "select",
			"lookup": "ATTENDANCE_MODES",
			"control": "select"
		},
		"status": {
			"type": "string",
			"control": "text"
		},
		"subtype": {
			"type": "select",
			"lookup": "SUBTYPES.event",
			"control": "select"
		},
		"location": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"address": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"organizer": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"offers": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"price": {
						"type": "number",
						"control": "number"
					},
					"currency": {
						"type": "string",
						"control": "text"
					},
					"availability": {
						"type": "string",
						"control": "text"
					},
					"validThrough": {
						"type": "datetime",
						"control": "datetime"
					}
				}
			},
			"control": "repeater"
		}
	},
	"recipe": {
		"prepTime": {
			"type": "string",
			"note": "ISO 8601 duration, e.g. PT15M",
			"control": "text"
		},
		"cookTime": {
			"type": "string",
			"note": "ISO 8601 duration",
			"control": "text"
		},
		"servings": {
			"type": "number",
			"control": "number"
		},
		"ingredients": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"instructions": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"note": "→ HowToStep accordion",
			"control": "repeater"
		}
	},
	"review": {
		"rating": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"value": {
					"type": "number",
					"label": "Rating",
					"control": "number"
				},
				"max": {
					"type": "number",
					"note": "default 5",
					"control": "number"
				},
				"count": {
					"type": "number",
					"control": "number"
				}
			}
		},
		"aggregateRating": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"value": {
					"type": "number",
					"label": "Rating",
					"control": "number"
				},
				"max": {
					"type": "number",
					"note": "default 5",
					"control": "number"
				},
				"count": {
					"type": "number",
					"control": "number"
				}
			}
		},
		"reviewer": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"title": {
					"type": "string",
					"control": "text"
				},
				"avatar": {
					"type": "url",
					"control": "url"
				},
				"verified": {
					"type": "boolean",
					"control": "toggle"
				}
			},
			"control": "fieldset"
		},
		"reviewDate": {
			"type": "date",
			"control": "date"
		},
		"reviewDateDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"reviewerVerifiedText": {
			"type": "string",
			"note": "override for the \"Verified purchase\" badge",
			"control": "text"
		},
		"reviewedType": {
			"type": "select",
			"lookup": "REVIEWED_TYPES",
			"control": "select"
		},
		"productReviewed": {
			"type": "string",
			"control": "text"
		},
		"productImage": {
			"type": "url",
			"control": "url"
		},
		"productPrice": {
			"type": "object",
			"fields": {
				"amount": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				},
				"current": {
					"type": "number",
					"control": "number"
				}
			},
			"control": "fieldset"
		}
	},
	"job": {
		"company": {
			"type": "string",
			"control": "text"
		},
		"industry": {
			"type": "string",
			"note": "suppressed when the envelope owns it",
			"control": "text"
		},
		"employmentType": {
			"type": "string",
			"note": "e.g. FULL_TIME",
			"control": "text"
		},
		"employmentTypeDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"location": {
			"type": "string",
			"control": "text"
		},
		"locationCountry": {
			"type": "string",
			"note": "ISO country code",
			"control": "text"
		},
		"salaryRange": {
			"type": "object",
			"fields": {
				"min": {
					"type": "number",
					"control": "number"
				},
				"max": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				},
				"period": {
					"type": "string",
					"note": "e.g. YEAR",
					"control": "text"
				},
				"periodDisplay": {
					"type": "string",
					"display": true,
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"applicationDeadline": {
			"type": "date",
			"control": "date"
		},
		"applicationDeadlineDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"employerRating": {
			"type": "object",
			"note": "a 2nd top-level item (EmployerAggregateRating)",
			"fields": {
				"value": {
					"type": "number",
					"control": "number"
				},
				"count": {
					"type": "number",
					"control": "number"
				},
				"max": {
					"type": "number",
					"control": "number"
				},
				"organization": {
					"type": "string",
					"control": "text"
				},
				"sameAs": {
					"type": "url",
					"control": "url"
				}
			},
			"control": "fieldset"
		},
		"qualifications": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"benefits": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		}
	},
	"course": {
		"duration": {
			"type": "string",
			"control": "text"
		},
		"courseWorkload": {
			"type": "string",
			"control": "text"
		},
		"difficultyLevel": {
			"type": "string",
			"control": "text"
		},
		"instructor": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"title": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"provider": {
			"type": "string",
			"control": "text"
		},
		"price": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"current": {
					"type": "number",
					"control": "number"
				},
				"original": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				},
				"discountText": {
					"type": "string",
					"control": "text"
				}
			}
		},
		"prerequisites": {
			"type": "array",
			"items": {
				"fields": {
					"text": {
						"type": "string",
						"control": "text"
					},
					"icon": {
						"type": "select",
						"lookup": "ICON_NAMES",
						"control": "select"
					},
					"href": {
						"type": "url",
						"control": "url"
					},
					"itemprop": {
						"type": "string",
						"control": "text"
					}
				},
				"scalar": "text"
			},
			"control": "repeater"
		},
		"learningOutcomes": {
			"type": "array",
			"items": {
				"fields": {
					"text": {
						"type": "string",
						"control": "text"
					},
					"icon": {
						"type": "select",
						"lookup": "ICON_NAMES",
						"control": "select"
					},
					"href": {
						"type": "url",
						"control": "url"
					},
					"itemprop": {
						"type": "string",
						"control": "text"
					}
				},
				"scalar": "text"
			},
			"control": "repeater"
		}
	},
	"booking": {
		"serviceName": {
			"type": "string",
			"control": "text"
		},
		"venue": {
			"type": "string",
			"control": "text"
		},
		"capacity": {
			"type": "number",
			"control": "number"
		},
		"duration": {
			"type": "string",
			"control": "text"
		},
		"price": {
			"type": "object",
			"fields": {
				"hourlyRate": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"amenities": {
			"type": "array",
			"items": {
				"fields": {
					"text": {
						"type": "string",
						"control": "text"
					},
					"icon": {
						"type": "select",
						"lookup": "ICON_NAMES",
						"control": "select"
					},
					"href": {
						"type": "url",
						"control": "url"
					},
					"itemprop": {
						"type": "string",
						"control": "text"
					}
				},
				"scalar": "text"
			},
			"control": "repeater"
		},
		"cancellationPolicy": {
			"type": "text",
			"control": "textarea"
		},
		"specialRequests": {
			"type": "text",
			"control": "textarea"
		}
	},
	"poll": {
		"options": {
			"type": "array",
			"items": {
				"fields": {
					"headline": {
						"type": "string",
						"control": "text"
					},
					"votes": {
						"type": "number",
						"control": "number"
					}
				}
			},
			"control": "repeater"
		},
		"totalVotes": {
			"type": "number",
			"control": "number"
		},
		"closes": {
			"type": "date",
			"control": "date"
		},
		"closesDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		}
	},
	"profile": {
		"jobTitle": {
			"type": "string",
			"note": "subheadline slot",
			"control": "text"
		},
		"organization": {
			"type": "string",
			"note": "subheadline slot",
			"control": "text"
		},
		"location": {
			"type": "string",
			"control": "text"
		},
		"contacts": {
			"type": "array",
			"items": {
				"fields": {
					"type": {
						"type": "select",
						"lookup": "CONTACT_KINDS",
						"control": "select"
					},
					"value": {
						"type": "string",
						"control": "text"
					},
					"label": {
						"type": "string",
						"control": "text"
					}
				}
			},
			"control": "repeater"
		}
	},
	"faq": {
		"items": {
			"type": "array",
			"items": {
				"fields": {
					"question": {
						"type": "string",
						"control": "text"
					},
					"answer": {
						"type": "text",
						"control": "textarea"
					}
				}
			},
			"note": "→ accordion",
			"control": "repeater"
		}
	},
	"quote": {},
	"timeline": {
		"items": {
			"type": "array",
			"items": {
				"fields": {
					"date": {
						"type": "date",
						"control": "date"
					},
					"endDate": {
						"type": "date",
						"control": "date"
					},
					"headline": {
						"type": "string",
						"control": "text"
					},
					"location": {
						"type": "string",
						"control": "text"
					},
					"locationUrl": {
						"type": "url",
						"control": "url"
					},
					"text": {
						"type": "text",
						"control": "textarea"
					},
					"theme": {
						"type": "select",
						"lookup": "HUES",
						"control": "select"
					}
				}
			},
			"control": "repeater"
		},
		"locationUrl": {
			"type": "url",
			"note": "emits a VirtualLocation",
			"control": "url"
		}
	},
	"gallery": {
		"albumName": {
			"type": "string",
			"control": "text"
		},
		"totalCount": {
			"type": "number",
			"control": "number"
		},
		"license": {
			"type": "url",
			"control": "url"
		},
		"acquireLicensePage": {
			"type": "url",
			"control": "url"
		},
		"creator": {
			"type": "string",
			"control": "text"
		},
		"creditText": {
			"type": "string",
			"control": "text"
		},
		"copyrightNotice": {
			"type": "string",
			"control": "text"
		}
	},
	"statistic": {
		"metricName": {
			"type": "string",
			"control": "text"
		},
		"currentValue": {
			"type": "number",
			"control": "number"
		},
		"displayValue": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"unit": {
			"type": "string",
			"control": "text"
		},
		"trend": {
			"type": "string",
			"control": "text"
		},
		"trendPercentage": {
			"type": "number",
			"control": "number"
		},
		"comparisonPeriod": {
			"type": "string",
			"control": "text"
		},
		"note": {
			"type": "text",
			"control": "textarea"
		}
	},
	"achievement": {
		"status": {
			"type": "string",
			"control": "text"
		},
		"issuingOrganization": {
			"type": "string",
			"control": "text"
		},
		"dateEarned": {
			"type": "date",
			"control": "date"
		},
		"dateEarnedDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"expirationDate": {
			"type": "date",
			"control": "date"
		},
		"expirationDateDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"skillLevel": {
			"type": "string",
			"control": "text"
		},
		"credentialId": {
			"type": "string",
			"label": "Credential ID",
			"control": "text"
		},
		"verificationUrl": {
			"type": "url",
			"control": "url"
		}
	},
	"goal": {
		"status": {
			"type": "select",
			"lookup": "GOAL_STATUS",
			"note": "mapped to ActionStatusType URLs; anything else emits no actionStatus",
			"control": "select"
		},
		"startDate": {
			"type": "date",
			"control": "date"
		},
		"endDate": {
			"type": "date",
			"control": "date"
		},
		"dateRangeDisplay": {
			"type": "string",
			"display": true,
			"noBase": true,
			"control": "text"
		},
		"agentName": {
			"type": "string",
			"note": "agent → Person",
			"control": "text"
		},
		"target": {
			"type": "object",
			"note": "→ QuantitativeValue (the goal)",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"value": {
					"type": "number",
					"control": "number"
				},
				"unitText": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"current": {
			"type": "object",
			"note": "→ QuantitativeValue (progress so far)",
			"fields": {
				"value": {
					"type": "number",
					"control": "number"
				},
				"unitText": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"progressLabel": {
			"type": "string",
			"note": "the ring's small caption",
			"control": "text"
		},
		"progressDisplay": {
			"type": "string",
			"display": true,
			"noBase": true,
			"note": "human line, e.g. \"6 of 10 minutes\"",
			"control": "text"
		},
		"hue": {
			"type": "select",
			"lookup": "HUES",
			"note": "ring theme; unknown values drop the attribute",
			"control": "select"
		}
	},
	"announcement": {
		"announcementType": {
			"type": "string",
			"control": "text"
		},
		"priority": {
			"type": "string",
			"control": "text"
		},
		"priorityDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"effectiveDate": {
			"type": "object",
			"fields": {
				"start": {
					"type": "date",
					"control": "date"
				},
				"startDisplay": {
					"type": "string",
					"display": true,
					"control": "text"
				},
				"end": {
					"type": "date",
					"control": "date"
				},
				"endDisplay": {
					"type": "string",
					"display": true,
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"targetAudience": {
			"type": "string",
			"control": "text"
		},
		"actionRequired": {
			"type": "text",
			"control": "textarea"
		}
	},
	"business": {
		"subtype": {
			"type": "select",
			"lookup": "SUBTYPES.business",
			"control": "select"
		},
		"businessType": {
			"type": "string",
			"note": "legacy alias — subtype wins; new content should not write it",
			"control": "text"
		},
		"address": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"streetAddress": {
					"type": "string",
					"control": "text"
				},
				"postalCode": {
					"type": "string",
					"control": "text"
				},
				"addressLocality": {
					"type": "string",
					"control": "text"
				},
				"addressRegion": {
					"type": "string",
					"control": "text"
				},
				"addressCountry": {
					"type": "string",
					"control": "text"
				}
			}
		},
		"geo": {
			"type": "object",
			"control": "geopoint",
			"fields": {
				"latitude": {
					"type": "number",
					"control": "number"
				},
				"longitude": {
					"type": "number",
					"control": "number"
				},
				"url": {
					"type": "url",
					"control": "url"
				},
				"links": {
					"type": "array",
					"open": true,
					"note": "external-map row: provider ids (google · apple · osm) or {provider, label?, url?}",
					"control": "repeater"
				}
			}
		},
		"telephone": {
			"type": "string",
			"control": "tel"
		},
		"email": {
			"type": "string",
			"control": "email"
		},
		"website": {
			"type": "url",
			"control": "url"
		},
		"priceRange": {
			"type": "string",
			"control": "text"
		},
		"rating": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"value": {
					"type": "number",
					"label": "Rating",
					"control": "number"
				},
				"max": {
					"type": "number",
					"note": "default 5",
					"control": "number"
				},
				"count": {
					"type": "number",
					"control": "number"
				}
			}
		},
		"sameAs": {
			"type": "array",
			"items": {
				"type": "url",
				"control": "url"
			},
			"control": "repeater"
		},
		"foundingDate": {
			"type": "date",
			"control": "date"
		},
		"openingHours": {
			"type": "array",
			"items": {
				"fields": {
					"schema": {
						"type": "string",
						"note": "e.g. Mo-Fr 09:00-17:00",
						"control": "text"
					},
					"days": {
						"type": "string",
						"control": "text"
					},
					"time": {
						"type": "string",
						"control": "text"
					},
					"display": {
						"type": "string",
						"display": true,
						"control": "text"
					}
				}
			},
			"control": "repeater"
		}
	},
	"comparison": {
		"items": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"price": {
						"type": "string",
						"control": "text"
					},
					"image": {
						"type": "url",
						"control": "url"
					},
					"score": {
						"type": "number",
						"control": "number"
					},
					"scoreDisplay": {
						"type": "string",
						"display": true,
						"control": "text"
					}
				}
			},
			"control": "repeater"
		},
		"recommendation": {
			"type": "string",
			"control": "text"
		},
		"summary": {
			"type": "text",
			"control": "textarea"
		}
	},
	"contact": {
		"contactType": {
			"type": "string",
			"control": "text"
		},
		"department": {
			"type": "string",
			"control": "text"
		},
		"availableHours": {
			"type": "string",
			"control": "text"
		},
		"availableHoursDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"responseTime": {
			"type": "string",
			"control": "text"
		},
		"languages": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"also": [
				"string"
			],
			"note": "array OR comma-separated string",
			"control": "repeater"
		},
		"contactMethods": {
			"type": "array",
			"items": {
				"fields": {
					"type": {
						"type": "select",
						"lookup": "CONTACT_KINDS",
						"control": "select"
					},
					"value": {
						"type": "string",
						"control": "text"
					},
					"label": {
						"type": "string",
						"control": "text"
					}
				}
			},
			"control": "repeater"
		}
	},
	"location": {
		"subtype": {
			"type": "select",
			"lookup": "SUBTYPES.location",
			"control": "select"
		},
		"address": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"streetAddress": {
					"type": "string",
					"control": "text"
				},
				"postalCode": {
					"type": "string",
					"control": "text"
				},
				"addressLocality": {
					"type": "string",
					"control": "text"
				},
				"addressRegion": {
					"type": "string",
					"control": "text"
				},
				"addressCountry": {
					"type": "string",
					"control": "text"
				}
			}
		},
		"geo": {
			"type": "object",
			"control": "geopoint",
			"note": "also feeds the map frame and the external-map link row",
			"fields": {
				"latitude": {
					"type": "number",
					"control": "number"
				},
				"longitude": {
					"type": "number",
					"control": "number"
				},
				"url": {
					"type": "url",
					"control": "url"
				},
				"links": {
					"type": "array",
					"open": true,
					"note": "external-map row: provider ids (google · apple · osm) or {provider, label?, url?}",
					"control": "repeater"
				}
			}
		},
		"openingHours": {
			"type": "array",
			"items": {
				"fields": {
					"schema": {
						"type": "string",
						"note": "e.g. Mo-Fr 09:00-17:00",
						"control": "text"
					},
					"days": {
						"type": "string",
						"control": "text"
					},
					"time": {
						"type": "string",
						"control": "text"
					},
					"display": {
						"type": "string",
						"display": true,
						"control": "text"
					}
				}
			},
			"control": "repeater"
		},
		"hours": {
			"type": "string",
			"note": "plain-string alternative to openingHours",
			"control": "text"
		},
		"contact": {
			"type": "string",
			"control": "text"
		},
		"amenities": {
			"type": "array",
			"items": {
				"fields": {
					"text": {
						"type": "string",
						"control": "text"
					},
					"icon": {
						"type": "select",
						"lookup": "ICON_NAMES",
						"control": "select"
					},
					"href": {
						"type": "url",
						"control": "url"
					},
					"itemprop": {
						"type": "string",
						"control": "text"
					}
				},
				"scalar": "text"
			},
			"control": "repeater"
		}
	},
	"places": {
		"kind": {
			"type": "select",
			"lookup": "PLACE_KINDS",
			"control": "select"
		},
		"items": {
			"type": "array",
			"open": true,
			"note": "shape depends on kind — LocalBusiness rows (name, url, branchCode, geo, address, telephone, openingHours[]) or residence rows (type ∈ RESIDENCE_TYPES, name, url, image, imageAlt, datePosted, price{amount,currency}, geo, address, floorSize, numberOfBedrooms, numberOfRooms, yearBuilt)",
			"control": "repeater"
		},
		"center": {
			"type": "object",
			"control": "geopoint",
			"note": "map centre — NOT details.geo",
			"fields": {
				"latitude": {
					"type": "number",
					"control": "number"
				},
				"longitude": {
					"type": "number",
					"control": "number"
				},
				"url": {
					"type": "url",
					"control": "url"
				}
			}
		},
		"regionDisplay": {
			"type": "string",
			"display": true,
			"noBase": true,
			"control": "text"
		},
		"order": {
			"type": "select",
			"lookup": "ITEM_LIST_ORDERS",
			"control": "select"
		},
		"ordered": {
			"type": "boolean",
			"control": "toggle"
		},
		"description": {
			"type": "text",
			"control": "textarea"
		},
		"list": {
			"type": "string",
			"note": "\"sr\" renders the list screen-reader-only",
			"control": "text"
		},
		"slides": {
			"type": "boolean",
			"note": "turns the frame into a carousel",
			"control": "toggle"
		},
		"slide": {
			"type": "object",
			"requires": "slides",
			"fields": {
				"variant": {
					"type": "string",
					"control": "text"
				},
				"media": {
					"type": "string",
					"control": "text"
				},
				"content": {
					"type": "string",
					"control": "text"
				},
				"cta": {
					"type": "string",
					"label": "CTA",
					"control": "text"
				}
			},
			"control": "fieldset"
		}
	},
	"filelist": {
		"files": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"type": {
						"type": "select",
						"lookup": "FILE_TYPES",
						"control": "select"
					},
					"size": {
						"type": "string",
						"note": "human string, e.g. 2.4 MB",
						"control": "text"
					},
					"url": {
						"type": "url",
						"control": "url"
					},
					"download": {
						"type": "string",
						"note": "download filename; empty = bare download attribute",
						"control": "text"
					}
				}
			},
			"control": "repeater"
		},
		"description": {
			"type": "text",
			"note": "fallback only — the envelope summary owns description when filled",
			"control": "textarea"
		},
		"note": {
			"type": "text",
			"control": "textarea"
		}
	},
	"membership": {
		"price": {
			"type": "object",
			"fields": {
				"monthly": {
					"type": "number",
					"control": "number"
				},
				"yearly": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				},
				"savings": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"trialPeriod": {
			"type": "string",
			"control": "text"
		},
		"trialText": {
			"type": "string",
			"control": "text"
		},
		"features": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"limitations": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"isPopular": {
			"type": "boolean",
			"control": "toggle"
		},
		"popularText": {
			"type": "string",
			"control": "text"
		}
	},
	"social": {
		"subtype": {
			"type": "select",
			"lookup": "SUBTYPES.social",
			"control": "select"
		},
		"platform": {
			"type": "string",
			"control": "text"
		},
		"author": {
			"type": "string",
			"note": "suppressed when the envelope owns it",
			"control": "text"
		}
	},
	"software": {
		"subtype": {
			"type": "select",
			"lookup": "SUBTYPES.software",
			"control": "select"
		},
		"version": {
			"type": "string",
			"control": "text"
		},
		"applicationCategory": {
			"type": "string",
			"control": "text"
		},
		"operatingSystem": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"developer": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"website": {
					"type": "url",
					"control": "url"
				}
			},
			"control": "fieldset"
		},
		"price": {
			"type": "object",
			"fields": {
				"current": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				},
				"note": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"fileSize": {
			"type": "string",
			"control": "text"
		},
		"systemRequirements": {
			"type": "object",
			"also": [
				"string"
			],
			"note": "one readable line, or {processor, ram, storage}",
			"fields": {
				"processor": {
					"type": "string",
					"control": "text"
				},
				"ram": {
					"type": "string",
					"label": "RAM",
					"control": "text"
				},
				"storage": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		}
	},
	"organization": {
		"subtype": {
			"type": "select",
			"lookup": "SUBTYPES.organization",
			"control": "select"
		},
		"foundingDate": {
			"type": "date",
			"control": "date"
		},
		"foundingDateDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"numberOfEmployees": {
			"type": "number",
			"control": "number"
		},
		"sameAs": {
			"type": "array",
			"items": {
				"type": "url",
				"control": "url"
			},
			"control": "repeater"
		},
		"email": {
			"type": "string",
			"control": "email"
		},
		"headquarters": {
			"type": "object",
			"fields": {
				"address": {
					"type": "object",
					"control": "fieldset",
					"fields": {
						"streetAddress": {
							"type": "string",
							"control": "text"
						},
						"postalCode": {
							"type": "string",
							"control": "text"
						},
						"addressLocality": {
							"type": "string",
							"control": "text"
						},
						"addressRegion": {
							"type": "string",
							"control": "text"
						},
						"addressCountry": {
							"type": "string",
							"control": "text"
						}
					}
				},
				"geo": {
					"type": "object",
					"control": "geopoint",
					"fields": {
						"latitude": {
							"type": "number",
							"control": "number"
						},
						"longitude": {
							"type": "number",
							"control": "number"
						},
						"url": {
							"type": "url",
							"control": "url"
						},
						"links": {
							"type": "array",
							"open": true,
							"note": "external-map row: provider ids (google · apple · osm) or {provider, label?, url?}",
							"control": "repeater"
						}
					}
				}
			},
			"control": "fieldset"
		},
		"offices": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"address": {
						"type": "object",
						"control": "fieldset",
						"fields": {
							"streetAddress": {
								"type": "string",
								"control": "text"
							},
							"postalCode": {
								"type": "string",
								"control": "text"
							},
							"addressLocality": {
								"type": "string",
								"control": "text"
							},
							"addressRegion": {
								"type": "string",
								"control": "text"
							},
							"addressCountry": {
								"type": "string",
								"control": "text"
							}
						}
					},
					"geo": {
						"type": "object",
						"control": "geopoint",
						"fields": {
							"latitude": {
								"type": "number",
								"control": "number"
							},
							"longitude": {
								"type": "number",
								"control": "number"
							},
							"url": {
								"type": "url",
								"control": "url"
							},
							"links": {
								"type": "array",
								"open": true,
								"note": "external-map row: provider ids (google · apple · osm) or {provider, label?, url?}",
								"control": "repeater"
							}
						}
					},
					"telephone": {
						"type": "string",
						"control": "tel"
					},
					"email": {
						"type": "string",
						"control": "email"
					},
					"openingHours": {
						"type": "array",
						"items": {
							"fields": {
								"schema": {
									"type": "string",
									"note": "e.g. Mo-Fr 09:00-17:00",
									"control": "text"
								},
								"days": {
									"type": "string",
									"control": "text"
								},
								"time": {
									"type": "string",
									"control": "text"
								},
								"display": {
									"type": "string",
									"display": true,
									"control": "text"
								}
							}
						},
						"control": "repeater"
					}
				}
			},
			"control": "repeater"
		}
	},
	"video": {
		"durationDisplay": {
			"type": "string",
			"display": true,
			"noBase": true,
			"note": "the machine duration lives on the media item",
			"control": "text"
		},
		"viewsDisplay": {
			"type": "string",
			"display": true,
			"noBase": true,
			"control": "text"
		},
		"creator": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		}
	},
	"howto": {
		"totalTime": {
			"type": "string",
			"note": "ISO 8601 duration",
			"control": "text"
		},
		"estimatedCost": {
			"type": "object",
			"fields": {
				"value": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"difficulty": {
			"type": "string",
			"control": "text"
		},
		"supplies": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"tools": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"steps": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"text": {
						"type": "text",
						"control": "textarea"
					}
				}
			},
			"note": "→ accordion",
			"control": "repeater"
		}
	},
	"qa": {
		"question": {
			"type": "text",
			"control": "textarea"
		},
		"upvotes": {
			"type": "number",
			"control": "number"
		},
		"answers": {
			"type": "array",
			"items": {
				"fields": {
					"text": {
						"type": "text",
						"control": "textarea"
					},
					"author": {
						"type": "string",
						"control": "text"
					},
					"upvotes": {
						"type": "number",
						"control": "number"
					},
					"accepted": {
						"type": "boolean",
						"control": "toggle"
					}
				}
			},
			"control": "repeater"
		}
	},
	"podcast": {
		"seriesName": {
			"type": "string",
			"control": "text"
		},
		"episodeNumber": {
			"type": "number",
			"control": "number"
		},
		"duration": {
			"type": "string",
			"note": "ISO 8601 duration",
			"control": "text"
		},
		"durationDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"audioUrl": {
			"type": "url",
			"control": "url"
		}
	},
	"movie": {
		"dateReleased": {
			"type": "date",
			"control": "date"
		},
		"dateReleasedDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"duration": {
			"type": "string",
			"note": "ISO 8601 duration",
			"control": "text"
		},
		"durationDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"contentRating": {
			"type": "string",
			"control": "text"
		},
		"rating": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"value": {
					"type": "number",
					"label": "Rating",
					"control": "number"
				},
				"max": {
					"type": "number",
					"note": "default 5",
					"control": "number"
				},
				"count": {
					"type": "number",
					"control": "number"
				}
			}
		},
		"director": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"label": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"actors": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		}
	},
	"book": {
		"isbn": {
			"type": "string",
			"label": "ISBN",
			"note": "shown raw — the page carries the format-detection meta (schema.md § Book)",
			"control": "text"
		},
		"numberOfPages": {
			"type": "number",
			"control": "number"
		},
		"bookFormat": {
			"type": "select",
			"lookup": "BOOK_FORMATS",
			"control": "select"
		},
		"bookFormatDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"publisher": {
			"type": "string",
			"control": "text"
		},
		"rating": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"value": {
					"type": "number",
					"label": "Rating",
					"control": "number"
				},
				"max": {
					"type": "number",
					"note": "default 5",
					"control": "number"
				},
				"count": {
					"type": "number",
					"control": "number"
				}
			}
		},
		"price": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"current": {
					"type": "number",
					"control": "number"
				},
				"original": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				},
				"discountText": {
					"type": "string",
					"control": "text"
				}
			}
		}
	},
	"dataset": {
		"license": {
			"type": "url",
			"control": "url"
		},
		"licenseDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"temporalCoverage": {
			"type": "string",
			"note": "ISO 8601 interval",
			"control": "text"
		},
		"temporalCoverageDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"spatialCoverage": {
			"type": "string",
			"control": "text"
		},
		"variableMeasured": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"distribution": {
			"type": "array",
			"items": {
				"fields": {
					"format": {
						"type": "string",
						"control": "text"
					},
					"url": {
						"type": "url",
						"control": "url"
					},
					"size": {
						"type": "string",
						"control": "text"
					}
				}
			},
			"control": "repeater"
		}
	},
	"claim": {
		"claim": {
			"type": "text",
			"control": "textarea"
		},
		"claimant": {
			"type": "string",
			"control": "text"
		},
		"reviewDate": {
			"type": "date",
			"control": "date"
		},
		"verdict": {
			"type": "object",
			"fields": {
				"value": {
					"type": "number",
					"control": "number"
				},
				"max": {
					"type": "number",
					"control": "number"
				},
				"label": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		}
	},
	"loyalty": {
		"hostingOrganization": {
			"type": "string",
			"control": "text"
		},
		"joinUrl": {
			"type": "url",
			"control": "url"
		},
		"joinText": {
			"type": "string",
			"control": "text"
		},
		"joinIcon": {
			"type": "select",
			"lookup": "ICON_NAMES",
			"control": "select"
		},
		"tiers": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"pointsEarned": {
						"type": "number",
						"control": "number"
					},
					"url": {
						"type": "url",
						"control": "url"
					},
					"requirement": {
						"type": "string",
						"control": "text"
					},
					"requirementAmount": {
						"type": "object",
						"fields": {
							"currency": {
								"type": "string",
								"control": "text"
							},
							"value": {
								"type": "number",
								"control": "number"
							}
						},
						"control": "fieldset"
					},
					"requirementNote": {
						"type": "string",
						"control": "text"
					},
					"benefits": {
						"type": "array",
						"items": {
							"fields": {
								"type": {
									"type": "select",
									"lookup": "TIER_BENEFITS",
									"control": "select"
								},
								"text": {
									"type": "string",
									"control": "text"
								}
							}
						},
						"control": "repeater"
					}
				}
			},
			"control": "repeater"
		}
	},
	"quiz": {
		"format": {
			"type": "select",
			"lookup": "QUIZ_FORMATS",
			"note": "falls back to flashcard",
			"control": "select"
		},
		"subject": {
			"type": "string",
			"control": "text"
		},
		"pace": {
			"type": "string",
			"control": "text"
		},
		"cards": {
			"type": "array",
			"items": {
				"fields": {
					"question": {
						"type": "text",
						"control": "textarea"
					},
					"answer": {
						"type": "text",
						"control": "textarea"
					},
					"options": {
						"type": "array",
						"items": {
							"fields": {
								"text": {
									"type": "string",
									"control": "text"
								},
								"correct": {
									"type": "boolean",
									"control": "toggle"
								}
							}
						},
						"control": "repeater"
					}
				}
			},
			"control": "repeater"
		}
	},
	"service": {
		"serviceType": {
			"type": "string",
			"control": "text"
		},
		"provider": {
			"type": "string",
			"control": "text"
		},
		"areaServed": {
			"type": "string",
			"control": "text"
		},
		"catalog": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"period": {
					"type": "string",
					"control": "text"
				},
				"items": {
					"type": "array",
					"items": {
						"fields": {
							"name": {
								"type": "string",
								"control": "text"
							},
							"price": {
								"type": "number",
								"control": "number"
							},
							"currency": {
								"type": "string",
								"control": "text"
							},
							"icon": {
								"type": "select",
								"lookup": "ICON_NAMES",
								"control": "select"
							}
						}
					},
					"control": "repeater"
				}
			},
			"control": "fieldset"
		},
		"channel": {
			"type": "object",
			"fields": {
				"languages": {
					"type": "array",
					"items": {
						"type": "string",
						"control": "text"
					},
					"control": "repeater"
				},
				"processingTime": {
					"type": "string",
					"control": "text"
				},
				"url": {
					"type": "url",
					"control": "url"
				},
				"urlText": {
					"type": "string",
					"control": "text"
				},
				"urlIcon": {
					"type": "select",
					"lookup": "ICON_NAMES",
					"control": "select"
				},
				"telephone": {
					"type": "string",
					"control": "tel"
				},
				"contactType": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		}
	},
	"realestate": {
		"property": {
			"type": "object",
			"fields": {
				"type": {
					"type": "select",
					"lookup": "RESIDENCE_TYPES",
					"control": "select"
				},
				"name": {
					"type": "string",
					"control": "text"
				},
				"floorLevel": {
					"type": "string",
					"control": "text"
				},
				"petsAllowed": {
					"type": "boolean",
					"control": "toggle"
				},
				"floorSize": {
					"type": "number",
					"control": "number"
				},
				"floorSizeUnit": {
					"type": "string",
					"note": "UN/CEFACT code, e.g. MTK",
					"control": "text"
				},
				"floorSizeLabel": {
					"type": "string",
					"note": "e.g. m²",
					"control": "text"
				},
				"bedrooms": {
					"type": "number",
					"control": "number"
				},
				"bathrooms": {
					"type": "number",
					"control": "number"
				},
				"rooms": {
					"type": "number",
					"control": "number"
				},
				"yearBuilt": {
					"type": "number",
					"control": "number"
				},
				"address": {
					"type": "object",
					"control": "fieldset",
					"fields": {
						"streetAddress": {
							"type": "string",
							"control": "text"
						},
						"postalCode": {
							"type": "string",
							"control": "text"
						},
						"addressLocality": {
							"type": "string",
							"control": "text"
						},
						"addressRegion": {
							"type": "string",
							"control": "text"
						},
						"addressCountry": {
							"type": "string",
							"control": "text"
						}
					}
				},
				"geo": {
					"type": "object",
					"control": "geopoint",
					"fields": {
						"latitude": {
							"type": "number",
							"control": "number"
						},
						"longitude": {
							"type": "number",
							"control": "number"
						},
						"url": {
							"type": "url",
							"control": "url"
						},
						"links": {
							"type": "array",
							"open": true,
							"note": "external-map row: provider ids (google · apple · osm) or {provider, label?, url?}",
							"control": "repeater"
						}
					}
				},
				"amenities": {
					"type": "array",
					"items": {
						"fields": {
							"text": {
								"type": "string",
								"control": "text"
							},
							"icon": {
								"type": "select",
								"lookup": "ICON_NAMES",
								"control": "select"
							},
							"href": {
								"type": "url",
								"control": "url"
							},
							"itemprop": {
								"type": "string",
								"control": "text"
							}
						},
						"scalar": "text"
					},
					"control": "repeater"
				}
			},
			"control": "fieldset"
		},
		"price": {
			"type": "object",
			"fields": {
				"amount": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				},
				"note": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"datePosted": {
			"type": "date",
			"control": "date"
		},
		"datePostedDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"agent": {
			"type": "string",
			"control": "text"
		},
		"viewings": {
			"type": "string",
			"control": "text"
		},
		"availability": {
			"type": "string",
			"control": "text"
		},
		"map": {
			"type": "object",
			"open": true,
			"note": "map provider options, e.g. {key}",
			"control": "fieldset"
		},
		"mapMedia": {
			"type": "object",
			"open": true,
			"note": "the map frame's media item",
			"control": "fieldset"
		}
	},
	"vacationrental": {
		"additionalType": {
			"type": "string",
			"control": "text"
		},
		"identifier": {
			"type": "string",
			"control": "text"
		},
		"brand": {
			"type": "string",
			"control": "text"
		},
		"priceRange": {
			"type": "string",
			"control": "text"
		},
		"checkin": {
			"type": "string",
			"control": "time"
		},
		"checkout": {
			"type": "string",
			"control": "time"
		},
		"checkinDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"checkoutDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"languages": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"note": "BCP 47 tags",
			"control": "repeater"
		},
		"rating": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"value": {
					"type": "number",
					"label": "Rating",
					"control": "number"
				},
				"max": {
					"type": "number",
					"note": "default 5",
					"control": "number"
				},
				"count": {
					"type": "number",
					"control": "number"
				}
			}
		},
		"geo": {
			"type": "object",
			"control": "geopoint",
			"note": "rides the ROOT — this type IS a Place",
			"fields": {
				"latitude": {
					"type": "number",
					"control": "number"
				},
				"longitude": {
					"type": "number",
					"control": "number"
				},
				"url": {
					"type": "url",
					"control": "url"
				},
				"links": {
					"type": "array",
					"open": true,
					"note": "external-map row: provider ids (google · apple · osm) or {provider, label?, url?}",
					"control": "repeater"
				}
			}
		},
		"address": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"streetAddress": {
					"type": "string",
					"control": "text"
				},
				"postalCode": {
					"type": "string",
					"control": "text"
				},
				"addressLocality": {
					"type": "string",
					"control": "text"
				},
				"addressRegion": {
					"type": "string",
					"control": "text"
				},
				"addressCountry": {
					"type": "string",
					"control": "text"
				}
			}
		},
		"property": {
			"type": "object",
			"note": "→ containsPlace",
			"fields": {
				"additionalType": {
					"type": "string",
					"control": "text"
				},
				"name": {
					"type": "string",
					"control": "text"
				},
				"petsAllowed": {
					"type": "boolean",
					"control": "toggle"
				},
				"floorSize": {
					"type": "number",
					"control": "number"
				},
				"floorSizeUnit": {
					"type": "string",
					"control": "text"
				},
				"floorSizeLabel": {
					"type": "string",
					"control": "text"
				},
				"bedrooms": {
					"type": "number",
					"control": "number"
				},
				"bathrooms": {
					"type": "number",
					"control": "number"
				},
				"rooms": {
					"type": "number",
					"control": "number"
				},
				"sleeps": {
					"type": "number",
					"control": "number"
				},
				"beds": {
					"type": "array",
					"items": {
						"fields": {
							"count": {
								"type": "number",
								"control": "number"
							},
							"type": {
								"type": "string",
								"control": "text"
							},
							"icon": {
								"type": "select",
								"lookup": "ICON_NAMES",
								"control": "select"
							}
						}
					},
					"control": "repeater"
				},
				"amenities": {
					"type": "array",
					"items": {
						"fields": {
							"text": {
								"type": "string",
								"control": "text"
							},
							"icon": {
								"type": "select",
								"lookup": "ICON_NAMES",
								"control": "select"
							},
							"href": {
								"type": "url",
								"control": "url"
							},
							"itemprop": {
								"type": "string",
								"control": "text"
							}
						},
						"scalar": "text"
					},
					"control": "repeater"
				}
			},
			"control": "fieldset"
		},
		"map": {
			"type": "object",
			"open": true,
			"note": "map provider options, e.g. {key}",
			"control": "fieldset"
		},
		"mapMedia": {
			"type": "object",
			"open": true,
			"note": "the map frame's media item",
			"control": "fieldset"
		},
		"reviews": {
			"type": "array",
			"items": {
				"fields": {
					"author": {
						"type": "string",
						"control": "text"
					},
					"rating": {
						"type": "number",
						"control": "number"
					},
					"max": {
						"type": "number",
						"control": "number"
					},
					"datePublished": {
						"type": "date",
						"control": "date"
					},
					"dateDisplay": {
						"type": "string",
						"display": true,
						"noBase": true,
						"control": "text"
					},
					"context": {
						"type": "string",
						"control": "text"
					},
					"headline": {
						"type": "string",
						"control": "text"
					},
					"body": {
						"type": "text",
						"control": "textarea"
					}
				}
			},
			"note": "detail pages only",
			"control": "repeater"
		}
	},
	"menu": {
		"note": {
			"type": "text",
			"control": "textarea"
		},
		"sections": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"items": {
						"type": "array",
						"items": {
							"fields": {
								"name": {
									"type": "string",
									"control": "text"
								},
								"price": {
									"type": "number",
									"control": "number"
								},
								"currency": {
									"type": "string",
									"control": "text"
								},
								"label": {
									"type": "string",
									"control": "text"
								},
								"labelTheme": {
									"type": "select",
									"lookup": "HUES",
									"control": "select"
								},
								"labelSize": {
									"type": "string",
									"control": "text"
								},
								"description": {
									"type": "text",
									"control": "textarea"
								},
								"diets": {
									"type": "array",
									"items": {
										"type": "select",
										"lookup": "RESTRICTED_DIETS",
										"control": "select"
									},
									"control": "repeater"
								},
								"nutrition": {
									"type": "object",
									"fields": {
										"calories": {
											"type": "string",
											"note": "an Energy — unit-bearing string, e.g. \"650 calories\"",
											"control": "text"
										},
										"proteinContent": {
											"type": "string",
											"control": "text"
										},
										"servingSize": {
											"type": "string",
											"control": "text"
										}
									},
									"control": "fieldset"
								}
							}
						},
						"control": "repeater"
					}
				}
			},
			"control": "repeater"
		}
	},
	"tvseries": {
		"numberOfSeasons": {
			"type": "number",
			"control": "number"
		},
		"numberOfEpisodes": {
			"type": "number",
			"control": "number"
		},
		"startDate": {
			"type": "date",
			"control": "date"
		},
		"contentRating": {
			"type": "string",
			"control": "text"
		},
		"rating": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"value": {
					"type": "number",
					"label": "Rating",
					"control": "number"
				},
				"max": {
					"type": "number",
					"note": "default 5",
					"control": "number"
				},
				"count": {
					"type": "number",
					"control": "number"
				}
			}
		},
		"ordered": {
			"type": "boolean",
			"control": "toggle"
		},
		"seasons": {
			"type": "array",
			"items": {
				"fields": {
					"seasonNumber": {
						"type": "number",
						"control": "number"
					},
					"numberOfEpisodes": {
						"type": "number",
						"control": "number"
					},
					"name": {
						"type": "string",
						"control": "text"
					},
					"display": {
						"type": "string",
						"display": true,
						"control": "text"
					}
				}
			},
			"control": "repeater"
		},
		"director": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"label": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"actors": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		}
	},
	"tvepisode": {
		"episodeNumber": {
			"type": "number",
			"control": "number"
		},
		"duration": {
			"type": "string",
			"note": "ISO 8601 duration",
			"control": "text"
		},
		"durationDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"datePublished": {
			"type": "date",
			"control": "date"
		},
		"datePublishedDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"seriesName": {
			"type": "string",
			"control": "text"
		},
		"season": {
			"type": "object",
			"fields": {
				"seasonNumber": {
					"type": "number",
					"control": "number"
				},
				"name": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"director": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"label": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"actors": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		}
	},
	"medical": {
		"specialty": {
			"type": "select",
			"lookup": "MEDICAL_SPECIALTIES",
			"control": "select"
		},
		"lastReviewed": {
			"type": "date",
			"control": "date"
		},
		"lastReviewedDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"reviewedLabel": {
			"type": "string",
			"control": "text"
		},
		"audience": {
			"type": "object",
			"fields": {
				"type": {
					"type": "select",
					"lookup": "MEDICAL_AUDIENCES",
					"control": "select"
				},
				"name": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"about": {
			"type": "object",
			"fields": {
				"type": {
					"type": "select",
					"lookup": "MEDICAL_ABOUT_TYPES",
					"control": "select"
				},
				"name": {
					"type": "string",
					"control": "text"
				},
				"aspects": {
					"type": "array",
					"items": {
						"fields": {
							"type": {
								"type": "select",
								"lookup": "MEDICAL_ASPECTS",
								"control": "select"
							},
							"text": {
								"type": "text",
								"control": "textarea"
							}
						}
					},
					"control": "repeater"
				}
			},
			"control": "fieldset"
		},
		"reviewedBy": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"role": {
					"type": "string",
					"control": "text"
				},
				"avatar": {
					"type": "url",
					"control": "url"
				}
			}
		},
		"disclaimer": {
			"type": "text",
			"control": "textarea"
		}
	},
	"music": {
		"artist": {
			"type": "string",
			"note": "subheadline slot",
			"control": "text"
		},
		"artistUrl": {
			"type": "url",
			"note": "subheadline slot",
			"control": "url"
		},
		"numTracks": {
			"type": "number",
			"control": "number"
		},
		"datePublished": {
			"type": "date",
			"control": "date"
		},
		"datePublishedDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"durationDisplay": {
			"type": "string",
			"display": true,
			"noBase": true,
			"control": "text"
		},
		"productionType": {
			"type": "select",
			"lookup": "ALBUM_PRODUCTION_TYPES",
			"control": "select"
		},
		"releaseType": {
			"type": "select",
			"lookup": "ALBUM_RELEASE_TYPES",
			"control": "select"
		},
		"ordered": {
			"type": "boolean",
			"control": "toggle"
		},
		"tracks": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"position": {
						"type": "number",
						"control": "number"
					},
					"duration": {
						"type": "string",
						"control": "text"
					},
					"durationDisplay": {
						"type": "string",
						"display": true,
						"control": "text"
					},
					"artist": {
						"type": "string",
						"control": "text"
					}
				}
			},
			"control": "repeater"
		},
		"note": {
			"type": "text",
			"control": "textarea"
		}
	},
	"musicgroup": {
		"genres": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"foundingDate": {
			"type": "date",
			"control": "date"
		},
		"foundingDateDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"foundingLocation": {
			"type": "string",
			"control": "text"
		},
		"members": {
			"type": "array",
			"items": {
				"fields": {
					"role": {
						"type": "string",
						"control": "text"
					},
					"name": {
						"type": "string",
						"control": "text"
					}
				}
			},
			"control": "repeater"
		},
		"albums": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"datePublished": {
						"type": "date",
						"control": "date"
					},
					"numTracks": {
						"type": "number",
						"control": "number"
					},
					"url": {
						"type": "url",
						"control": "url"
					},
					"display": {
						"type": "string",
						"display": true,
						"control": "text"
					}
				}
			},
			"control": "repeater"
		},
		"ordered": {
			"type": "boolean",
			"note": "defaults FALSE here",
			"control": "toggle"
		},
		"sameAs": {
			"type": "array",
			"items": {
				"type": "url",
				"control": "url"
			},
			"control": "repeater"
		},
		"note": {
			"type": "text",
			"control": "textarea"
		}
	},
	"glossary": {
		"about": {
			"type": "string",
			"control": "text"
		},
		"note": {
			"type": "text",
			"control": "textarea"
		},
		"terms": {
			"type": "array",
			"items": {
				"fields": {
					"name": {
						"type": "string",
						"control": "text"
					},
					"termCode": {
						"type": "string",
						"control": "text"
					},
					"description": {
						"type": "text",
						"control": "textarea"
					}
				}
			},
			"note": "→ accordion",
			"control": "repeater"
		}
	},
	"podcastseries": {
		"startDate": {
			"type": "date",
			"control": "date"
		},
		"cadence": {
			"type": "string",
			"control": "text"
		},
		"episodeCount": {
			"type": "number",
			"control": "number"
		},
		"feed": {
			"type": "object",
			"fields": {
				"url": {
					"type": "url",
					"control": "url"
				},
				"text": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"host": {
			"type": "object",
			"control": "fieldset",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"role": {
					"type": "string",
					"control": "text"
				},
				"avatar": {
					"type": "url",
					"control": "url"
				}
			}
		},
		"ordered": {
			"type": "boolean",
			"note": "defaults FALSE",
			"control": "toggle"
		},
		"episodes": {
			"type": "array",
			"items": {
				"fields": {
					"episodeNumber": {
						"type": "number",
						"control": "number"
					},
					"name": {
						"type": "string",
						"control": "text"
					},
					"duration": {
						"type": "string",
						"control": "text"
					},
					"durationDisplay": {
						"type": "string",
						"display": true,
						"control": "text"
					}
				}
			},
			"control": "repeater"
		},
		"note": {
			"type": "text",
			"control": "textarea"
		}
	},
	"comicseries": {
		"startDate": {
			"type": "date",
			"control": "date"
		},
		"endDate": {
			"type": "date",
			"control": "date"
		},
		"cadence": {
			"type": "string",
			"control": "text"
		},
		"issn": {
			"type": "string",
			"label": "ISSN",
			"note": "shown raw — the page carries the format-detection meta",
			"control": "text"
		},
		"issueCount": {
			"type": "number",
			"control": "number"
		},
		"publisher": {
			"type": "string",
			"control": "text"
		}
	},
	"comicissue": {
		"issueNumber": {
			"type": "number",
			"control": "number"
		},
		"datePublished": {
			"type": "date",
			"control": "date"
		},
		"datePublishedDisplay": {
			"type": "string",
			"display": true,
			"control": "text"
		},
		"pagination": {
			"type": "string",
			"control": "text"
		},
		"variantCover": {
			"type": "string",
			"control": "text"
		},
		"coverPrice": {
			"type": "string",
			"control": "text"
		},
		"price": {
			"type": "object",
			"fields": {
				"current": {
					"type": "number",
					"control": "number"
				},
				"currency": {
					"type": "string",
					"control": "text"
				},
				"availability": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"series": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"url": {
					"type": "url",
					"control": "url"
				},
				"issn": {
					"type": "string",
					"label": "ISSN",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"artist": {
			"type": "string",
			"note": "COMIC_ROLES: labelled Art",
			"control": "text"
		},
		"penciler": {
			"type": "string",
			"note": "COMIC_ROLES: labelled Pencils",
			"control": "text"
		},
		"inker": {
			"type": "string",
			"note": "COMIC_ROLES: labelled Inks",
			"control": "text"
		},
		"letterer": {
			"type": "string",
			"note": "COMIC_ROLES: labelled Letters",
			"control": "text"
		},
		"colorist": {
			"type": "string",
			"note": "COMIC_ROLES: labelled Colours",
			"control": "text"
		}
	},
	"artist": {
		"jobTitle": {
			"type": "string",
			"note": "subheadline slot",
			"control": "text"
		},
		"organization": {
			"type": "string",
			"note": "subheadline slot",
			"control": "text"
		},
		"location": {
			"type": "string",
			"control": "text"
		},
		"occupation": {
			"type": "object",
			"fields": {
				"name": {
					"type": "string",
					"control": "text"
				},
				"category": {
					"type": "string",
					"control": "text"
				},
				"since": {
					"type": "string",
					"control": "text"
				}
			},
			"control": "fieldset"
		},
		"awards": {
			"type": "array",
			"items": {
				"type": "string",
				"control": "text"
			},
			"control": "repeater"
		},
		"sameAs": {
			"type": "array",
			"items": {
				"type": "url",
				"control": "url"
			},
			"control": "repeater"
		}
	}
};
export const LOOKUPS = {
	"CONTACT_KINDS": [
		{
			"value": "email",
			"label": "email"
		},
		{
			"value": "phone",
			"label": "phone"
		},
		{
			"value": "url",
			"label": "url"
		}
	],
	"ICON_NAMES": [
		{
			"value": "call",
			"label": "call"
		},
		{
			"value": "mail",
			"label": "mail"
		},
		{
			"value": "location-on",
			"label": "location-on"
		},
		{
			"value": "schedule",
			"label": "schedule"
		},
		{
			"value": "language",
			"label": "language"
		},
		{
			"value": "public",
			"label": "public"
		},
		{
			"value": "bed",
			"label": "bed"
		},
		{
			"value": "king-bed",
			"label": "king-bed"
		},
		{
			"value": "bathtub",
			"label": "bathtub"
		},
		{
			"value": "square-foot",
			"label": "square-foot"
		},
		{
			"value": "meeting-room",
			"label": "meeting-room"
		},
		{
			"value": "groups",
			"label": "groups"
		},
		{
			"value": "pets",
			"label": "pets"
		},
		{
			"value": "pool",
			"label": "pool"
		},
		{
			"value": "wifi",
			"label": "wifi"
		},
		{
			"value": "ac-unit",
			"label": "ac-unit"
		},
		{
			"value": "local-parking",
			"label": "local-parking"
		},
		{
			"value": "kitchen",
			"label": "kitchen"
		},
		{
			"value": "elevator",
			"label": "elevator"
		},
		{
			"value": "balcony",
			"label": "balcony"
		},
		{
			"value": "outdoor-grill",
			"label": "outdoor-grill"
		},
		{
			"value": "local-laundry-service",
			"label": "local-laundry-service"
		},
		{
			"value": "calendar-month",
			"label": "calendar-month"
		},
		{
			"value": "directions-car",
			"label": "directions-car"
		},
		{
			"value": "accessible",
			"label": "accessible"
		},
		{
			"value": "smoke-free",
			"label": "smoke-free"
		},
		{
			"value": "check",
			"label": "check"
		},
		{
			"value": "close",
			"label": "close"
		},
		{
			"value": "star",
			"label": "star"
		},
		{
			"value": "favorite",
			"label": "favorite"
		},
		{
			"value": "tour",
			"label": "tour"
		},
		{
			"value": "landscape",
			"label": "landscape"
		},
		{
			"value": "monitor",
			"label": "monitor"
		},
		{
			"value": "draw",
			"label": "draw"
		},
		{
			"value": "local-cafe",
			"label": "local-cafe"
		},
		{
			"value": "self-improvement",
			"label": "self-improvement"
		},
		{
			"value": "timer",
			"label": "timer"
		},
		{
			"value": "thermostat",
			"label": "thermostat"
		},
		{
			"value": "crib",
			"label": "crib"
		},
		{
			"value": "podcasts",
			"label": "podcasts"
		},
		{
			"value": "deployed-code",
			"label": "deployed-code"
		},
		{
			"value": "backup",
			"label": "backup"
		},
		{
			"value": "support-agent",
			"label": "support-agent"
		},
		{
			"value": "album",
			"label": "album"
		},
		{
			"value": "visibility",
			"label": "visibility"
		},
		{
			"value": "share",
			"label": "share"
		},
		{
			"value": "mode-comment",
			"label": "mode-comment"
		},
		{
			"value": "picture-as-pdf",
			"label": "picture-as-pdf"
		},
		{
			"value": "table-view",
			"label": "table-view"
		},
		{
			"value": "description",
			"label": "description"
		},
		{
			"value": "text-snippet",
			"label": "text-snippet"
		},
		{
			"value": "folder-zip",
			"label": "folder-zip"
		},
		{
			"value": "draft",
			"label": "draft"
		},
		{
			"value": "chevron-left",
			"label": "chevron-left"
		},
		{
			"value": "chevron-right",
			"label": "chevron-right"
		},
		{
			"value": "light-mode",
			"label": "light-mode"
		},
		{
			"value": "mic",
			"label": "mic"
		},
		{
			"value": "content-copy",
			"label": "content-copy"
		},
		{
			"value": "shopping-cart",
			"label": "shopping-cart"
		},
		{
			"value": "play-arrow",
			"label": "play-arrow"
		},
		{
			"value": "rocket-launch",
			"label": "rocket-launch"
		},
		{
			"value": "loyalty",
			"label": "loyalty"
		},
		{
			"value": "event-available",
			"label": "event-available"
		},
		{
			"value": "play-circle",
			"label": "play-circle"
		},
		{
			"value": "rss-feed",
			"label": "rss-feed"
		},
		{
			"value": "school",
			"label": "school"
		},
		{
			"value": "verified",
			"label": "verified"
		},
		{
			"value": "send",
			"label": "send"
		},
		{
			"value": "skillet",
			"label": "skillet"
		},
		{
			"value": "how-to-reg",
			"label": "how-to-reg"
		},
		{
			"value": "request-quote",
			"label": "request-quote"
		},
		{
			"value": "data-object",
			"label": "data-object"
		}
	],
	"SUBTYPES.article": [
		{
			"value": "BlogPosting",
			"label": "Blog posting"
		},
		{
			"value": "TechArticle",
			"label": "Tech article"
		},
		{
			"value": "APIReference",
			"label": "Apireference"
		},
		{
			"value": "ScholarlyArticle",
			"label": "Scholarly article"
		},
		{
			"value": "Report",
			"label": "Report"
		},
		{
			"value": "SatiricalArticle",
			"label": "Satirical article"
		},
		{
			"value": "AdvertiserContentArticle",
			"label": "Advertiser content article"
		}
	],
	"SUBTYPES.news": [
		{
			"value": "ReportageNewsArticle",
			"label": "Reportage news article"
		},
		{
			"value": "OpinionNewsArticle",
			"label": "Opinion news article"
		},
		{
			"value": "AnalysisNewsArticle",
			"label": "Analysis news article"
		},
		{
			"value": "BackgroundNewsArticle",
			"label": "Background news article"
		},
		{
			"value": "ReviewNewsArticle",
			"label": "Review news article"
		}
	],
	"SUBTYPES.product": [
		{
			"value": "ProductGroup",
			"label": "Product group"
		},
		{
			"value": "ProductModel",
			"label": "Product model"
		},
		{
			"value": "IndividualProduct",
			"label": "Individual product"
		},
		{
			"value": "Vehicle",
			"label": "Vehicle"
		},
		{
			"value": "Car",
			"label": "Car"
		},
		{
			"value": "Motorcycle",
			"label": "Motorcycle"
		},
		{
			"value": "Drug",
			"label": "Drug"
		},
		{
			"value": "DietarySupplement",
			"label": "Dietary supplement"
		}
	],
	"VARIANT_AXES": [
		{
			"value": "color",
			"label": "color"
		},
		{
			"value": "size",
			"label": "size"
		},
		{
			"value": "material",
			"label": "material"
		},
		{
			"value": "pattern",
			"label": "pattern"
		}
	],
	"VARIANT_CONTROLS": [
		{
			"value": "list",
			"label": "list"
		},
		{
			"value": "buttons",
			"label": "buttons"
		},
		{
			"value": "collage",
			"label": "collage"
		}
	],
	"ATTENDANCE_MODES": [
		{
			"value": "Offline",
			"label": "Offline"
		},
		{
			"value": "Online",
			"label": "Online"
		},
		{
			"value": "Mixed",
			"label": "Mixed"
		}
	],
	"SUBTYPES.event": [
		{
			"value": "SportsEvent",
			"label": "Sports event"
		},
		{
			"value": "MusicEvent",
			"label": "Music event"
		},
		{
			"value": "TheaterEvent",
			"label": "Theater event"
		},
		{
			"value": "ScreeningEvent",
			"label": "Screening event"
		},
		{
			"value": "ComedyEvent",
			"label": "Comedy event"
		},
		{
			"value": "DanceEvent",
			"label": "Dance event"
		},
		{
			"value": "ExhibitionEvent",
			"label": "Exhibition event"
		},
		{
			"value": "FoodEvent",
			"label": "Food event"
		},
		{
			"value": "LiteraryEvent",
			"label": "Literary event"
		},
		{
			"value": "BusinessEvent",
			"label": "Business event"
		},
		{
			"value": "EducationEvent",
			"label": "Education event"
		},
		{
			"value": "ChildrensEvent",
			"label": "Childrens event"
		},
		{
			"value": "SocialEvent",
			"label": "Social event"
		},
		{
			"value": "SaleEvent",
			"label": "Sale event"
		},
		{
			"value": "Festival",
			"label": "Festival"
		},
		{
			"value": "Hackathon",
			"label": "Hackathon"
		},
		{
			"value": "PublicationEvent",
			"label": "Publication event"
		},
		{
			"value": "CourseInstance",
			"label": "Course instance"
		},
		{
			"value": "BroadcastEvent",
			"label": "Broadcast event"
		}
	],
	"REVIEWED_TYPES": [
		{
			"value": "Product",
			"label": "Product"
		},
		{
			"value": "Organization",
			"label": "Organization"
		},
		{
			"value": "Service",
			"label": "Service"
		}
	],
	"HUES": [
		{
			"value": "red",
			"label": "red"
		},
		{
			"value": "orange",
			"label": "orange"
		},
		{
			"value": "green",
			"label": "green"
		},
		{
			"value": "blue",
			"label": "blue"
		},
		{
			"value": "accent",
			"label": "accent"
		},
		{
			"value": "black",
			"label": "black"
		},
		{
			"value": "white",
			"label": "white"
		},
		{
			"value": "gray",
			"label": "gray"
		},
		{
			"value": "slate",
			"label": "slate"
		}
	],
	"GOAL_STATUS": [
		{
			"value": "active",
			"label": "active"
		},
		{
			"value": "completed",
			"label": "completed"
		},
		{
			"value": "failed",
			"label": "failed"
		},
		{
			"value": "potential",
			"label": "potential"
		}
	],
	"SUBTYPES.business": [
		{
			"value": "Restaurant",
			"label": "Restaurant"
		},
		{
			"value": "CafeOrCoffeeShop",
			"label": "Cafe or coffee shop"
		},
		{
			"value": "Bakery",
			"label": "Bakery"
		},
		{
			"value": "BarOrPub",
			"label": "Bar or pub"
		},
		{
			"value": "FastFoodRestaurant",
			"label": "Fast food restaurant"
		},
		{
			"value": "IceCreamShop",
			"label": "Ice cream shop"
		},
		{
			"value": "Winery",
			"label": "Winery"
		},
		{
			"value": "Brewery",
			"label": "Brewery"
		},
		{
			"value": "Distillery",
			"label": "Distillery"
		},
		{
			"value": "Store",
			"label": "Store"
		},
		{
			"value": "Hotel",
			"label": "Hotel"
		},
		{
			"value": "Resort",
			"label": "Resort"
		},
		{
			"value": "BedAndBreakfast",
			"label": "Bed and breakfast"
		},
		{
			"value": "Motel",
			"label": "Motel"
		},
		{
			"value": "Hostel",
			"label": "Hostel"
		},
		{
			"value": "Campground",
			"label": "Campground"
		},
		{
			"value": "BeautySalon",
			"label": "Beauty salon"
		},
		{
			"value": "DaySpa",
			"label": "Day spa"
		},
		{
			"value": "HealthClub",
			"label": "Health club"
		},
		{
			"value": "AutoRepair",
			"label": "Auto repair"
		},
		{
			"value": "AutoDealer",
			"label": "Auto dealer"
		},
		{
			"value": "AutoRental",
			"label": "Auto rental"
		},
		{
			"value": "GasStation",
			"label": "Gas station"
		},
		{
			"value": "Dentist",
			"label": "Dentist"
		},
		{
			"value": "MedicalClinic",
			"label": "Medical clinic"
		},
		{
			"value": "Pharmacy",
			"label": "Pharmacy"
		},
		{
			"value": "Physician",
			"label": "Physician"
		},
		{
			"value": "RealEstateAgent",
			"label": "Real estate agent"
		},
		{
			"value": "TravelAgency",
			"label": "Travel agency"
		},
		{
			"value": "Library",
			"label": "Library"
		},
		{
			"value": "GovernmentOffice",
			"label": "Government office"
		},
		{
			"value": "ProfessionalService",
			"label": "Professional service"
		},
		{
			"value": "LegalService",
			"label": "Legal service"
		},
		{
			"value": "Attorney",
			"label": "Attorney"
		},
		{
			"value": "FinancialService",
			"label": "Financial service"
		},
		{
			"value": "AccountingService",
			"label": "Accounting service"
		},
		{
			"value": "InsuranceAgency",
			"label": "Insurance agency"
		},
		{
			"value": "HomeAndConstructionBusiness",
			"label": "Home and construction business"
		},
		{
			"value": "GeneralContractor",
			"label": "General contractor"
		},
		{
			"value": "Plumber",
			"label": "Plumber"
		},
		{
			"value": "Electrician",
			"label": "Electrician"
		},
		{
			"value": "RoofingContractor",
			"label": "Roofing contractor"
		},
		{
			"value": "HVACBusiness",
			"label": "Hvacbusiness"
		},
		{
			"value": "MovingCompany",
			"label": "Moving company"
		},
		{
			"value": "Locksmith",
			"label": "Locksmith"
		},
		{
			"value": "MedicalBusiness",
			"label": "Medical business"
		},
		{
			"value": "Hospital",
			"label": "Hospital"
		},
		{
			"value": "HealthAndBeautyBusiness",
			"label": "Health and beauty business"
		},
		{
			"value": "HairSalon",
			"label": "Hair salon"
		},
		{
			"value": "FoodEstablishment",
			"label": "Food establishment"
		},
		{
			"value": "LodgingBusiness",
			"label": "Lodging business"
		},
		{
			"value": "AutomotiveBusiness",
			"label": "Automotive business"
		},
		{
			"value": "ClothingStore",
			"label": "Clothing store"
		},
		{
			"value": "FurnitureStore",
			"label": "Furniture store"
		},
		{
			"value": "JewelryStore",
			"label": "Jewelry store"
		},
		{
			"value": "Florist",
			"label": "Florist"
		},
		{
			"value": "SelfStorage",
			"label": "Self storage"
		},
		{
			"value": "EntertainmentBusiness",
			"label": "Entertainment business"
		},
		{
			"value": "SportsActivityLocation",
			"label": "Sports activity location"
		},
		{
			"value": "ShoppingCenter",
			"label": "Shopping center"
		}
	],
	"SUBTYPES.location": [
		{
			"value": "TouristAttraction",
			"label": "Tourist attraction"
		},
		{
			"value": "TouristDestination",
			"label": "Tourist destination"
		},
		{
			"value": "LandmarksOrHistoricalBuildings",
			"label": "Landmarks or historical buildings"
		},
		{
			"value": "Accommodation",
			"label": "Accommodation"
		},
		{
			"value": "Apartment",
			"label": "Apartment"
		},
		{
			"value": "House",
			"label": "House"
		},
		{
			"value": "SingleFamilyResidence",
			"label": "Single family residence"
		},
		{
			"value": "Room",
			"label": "Room"
		},
		{
			"value": "Suite",
			"label": "Suite"
		},
		{
			"value": "Residence",
			"label": "Residence"
		},
		{
			"value": "ApartmentComplex",
			"label": "Apartment complex"
		},
		{
			"value": "GatedResidenceCommunity",
			"label": "Gated residence community"
		},
		{
			"value": "CivicStructure",
			"label": "Civic structure"
		},
		{
			"value": "Park",
			"label": "Park"
		},
		{
			"value": "Beach",
			"label": "Beach"
		},
		{
			"value": "Campground",
			"label": "Campground"
		},
		{
			"value": "Church",
			"label": "Church"
		},
		{
			"value": "Museum",
			"label": "Museum"
		},
		{
			"value": "Airport",
			"label": "Airport"
		},
		{
			"value": "TrainStation",
			"label": "Train station"
		},
		{
			"value": "Mountain",
			"label": "Mountain"
		},
		{
			"value": "EventVenue",
			"label": "Event venue"
		},
		{
			"value": "StadiumOrArena",
			"label": "Stadium or arena"
		}
	],
	"PLACE_KINDS": [
		{
			"value": "business",
			"label": "business"
		},
		{
			"value": "residence",
			"label": "residence"
		}
	],
	"ITEM_LIST_ORDERS": [
		{
			"value": "ItemListOrderAscending",
			"label": "Ascending"
		},
		{
			"value": "ItemListOrderDescending",
			"label": "Descending"
		},
		{
			"value": "ItemListUnordered",
			"label": "Unordered"
		}
	],
	"FILE_TYPES": [
		{
			"value": "pdf",
			"label": "PDF"
		},
		{
			"value": "excel",
			"label": "Excel"
		},
		{
			"value": "word",
			"label": "Word"
		},
		{
			"value": "txt",
			"label": "Text"
		},
		{
			"value": "zip",
			"label": "ZIP"
		}
	],
	"SUBTYPES.social": [
		{
			"value": "DiscussionForumPosting",
			"label": "Discussion forum posting"
		},
		{
			"value": "BlogPosting",
			"label": "Blog posting"
		},
		{
			"value": "LiveBlogPosting",
			"label": "Live blog posting"
		}
	],
	"SUBTYPES.software": [
		{
			"value": "MobileApplication",
			"label": "Mobile application"
		},
		{
			"value": "WebApplication",
			"label": "Web application"
		},
		{
			"value": "VideoGame",
			"label": "Video game"
		}
	],
	"SUBTYPES.organization": [
		{
			"value": "NGO",
			"label": "Ngo"
		},
		{
			"value": "Corporation",
			"label": "Corporation"
		},
		{
			"value": "OnlineStore",
			"label": "Online store"
		},
		{
			"value": "OnlineBusiness",
			"label": "Online business"
		},
		{
			"value": "EducationalOrganization",
			"label": "Educational organization"
		},
		{
			"value": "School",
			"label": "School"
		},
		{
			"value": "CollegeOrUniversity",
			"label": "College or university"
		},
		{
			"value": "GovernmentOrganization",
			"label": "Government organization"
		},
		{
			"value": "NewsMediaOrganization",
			"label": "News media organization"
		},
		{
			"value": "MedicalOrganization",
			"label": "Medical organization"
		},
		{
			"value": "ResearchOrganization",
			"label": "Research organization"
		},
		{
			"value": "PerformingGroup",
			"label": "Performing group"
		},
		{
			"value": "MusicGroup",
			"label": "Music group"
		},
		{
			"value": "SportsOrganization",
			"label": "Sports organization"
		},
		{
			"value": "SportsTeam",
			"label": "Sports team"
		},
		{
			"value": "Airline",
			"label": "Airline"
		},
		{
			"value": "LibrarySystem",
			"label": "Library system"
		},
		{
			"value": "WorkersUnion",
			"label": "Workers union"
		},
		{
			"value": "PoliticalParty",
			"label": "Political party"
		},
		{
			"value": "FundingScheme",
			"label": "Funding scheme"
		},
		{
			"value": "Consortium",
			"label": "Consortium"
		},
		{
			"value": "Project",
			"label": "Project"
		}
	],
	"BOOK_FORMATS": [
		{
			"value": "Hardcover",
			"label": "Hardcover"
		},
		{
			"value": "Paperback",
			"label": "Paperback"
		},
		{
			"value": "EBook",
			"label": "E-book"
		},
		{
			"value": "AudiobookFormat",
			"label": "Audiobook"
		},
		{
			"value": "GraphicNovel",
			"label": "Graphic novel"
		}
	],
	"TIER_BENEFITS": [
		{
			"value": "TierBenefitLoyaltyPoints",
			"label": "Loyalty points"
		},
		{
			"value": "TierBenefitLoyaltyPrice",
			"label": "Member price"
		},
		{
			"value": "TierBenefitLoyaltyReturns",
			"label": "Free returns"
		},
		{
			"value": "TierBenefitLoyaltyShipping",
			"label": "Free shipping"
		}
	],
	"QUIZ_FORMATS": [
		{
			"value": "flashcard",
			"label": "flashcard"
		},
		{
			"value": "multiple-choice",
			"label": "multiple-choice"
		}
	],
	"RESIDENCE_TYPES": [
		{
			"value": "Accommodation",
			"label": "Accommodation"
		},
		{
			"value": "Apartment",
			"label": "Apartment"
		},
		{
			"value": "House",
			"label": "House"
		},
		{
			"value": "SingleFamilyResidence",
			"label": "Single family residence"
		},
		{
			"value": "Suite",
			"label": "Suite"
		},
		{
			"value": "Room",
			"label": "Room"
		}
	],
	"RESTRICTED_DIETS": [
		{
			"value": "DiabeticDiet",
			"label": "Diabetic"
		},
		{
			"value": "GlutenFreeDiet",
			"label": "Gluten free"
		},
		{
			"value": "HalalDiet",
			"label": "Halal"
		},
		{
			"value": "HinduDiet",
			"label": "Hindu"
		},
		{
			"value": "KosherDiet",
			"label": "Kosher"
		},
		{
			"value": "LowCalorieDiet",
			"label": "Low calorie"
		},
		{
			"value": "LowFatDiet",
			"label": "Low fat"
		},
		{
			"value": "LowLactoseDiet",
			"label": "Low lactose"
		},
		{
			"value": "LowSaltDiet",
			"label": "Low salt"
		},
		{
			"value": "VeganDiet",
			"label": "Vegan"
		},
		{
			"value": "VegetarianDiet",
			"label": "Vegetarian"
		}
	],
	"MEDICAL_SPECIALTIES": [
		{
			"value": "Anesthesia",
			"label": "Anesthesia"
		},
		{
			"value": "Cardiovascular",
			"label": "Cardiovascular"
		},
		{
			"value": "CommunityHealth",
			"label": "Community health"
		},
		{
			"value": "Dentistry",
			"label": "Dentistry"
		},
		{
			"value": "Dermatologic",
			"label": "Dermatologic"
		},
		{
			"value": "DietNutrition",
			"label": "Diet nutrition"
		},
		{
			"value": "Emergency",
			"label": "Emergency"
		},
		{
			"value": "Endocrine",
			"label": "Endocrine"
		},
		{
			"value": "Gastroenterologic",
			"label": "Gastroenterologic"
		},
		{
			"value": "Genetic",
			"label": "Genetic"
		},
		{
			"value": "Geriatric",
			"label": "Geriatric"
		},
		{
			"value": "Gynecologic",
			"label": "Gynecologic"
		},
		{
			"value": "Hematologic",
			"label": "Hematologic"
		},
		{
			"value": "Infectious",
			"label": "Infectious"
		},
		{
			"value": "LaboratoryScience",
			"label": "Laboratory science"
		},
		{
			"value": "Midwifery",
			"label": "Midwifery"
		},
		{
			"value": "Musculoskeletal",
			"label": "Musculoskeletal"
		},
		{
			"value": "Neurologic",
			"label": "Neurologic"
		},
		{
			"value": "Nursing",
			"label": "Nursing"
		},
		{
			"value": "Obstetric",
			"label": "Obstetric"
		},
		{
			"value": "Oncologic",
			"label": "Oncologic"
		},
		{
			"value": "Optometric",
			"label": "Optometric"
		},
		{
			"value": "Otolaryngologic",
			"label": "Otolaryngologic"
		},
		{
			"value": "Pathology",
			"label": "Pathology"
		},
		{
			"value": "Pediatric",
			"label": "Pediatric"
		},
		{
			"value": "PharmacySpecialty",
			"label": "Pharmacy specialty"
		},
		{
			"value": "Physiotherapy",
			"label": "Physiotherapy"
		},
		{
			"value": "PlasticSurgery",
			"label": "Plastic surgery"
		},
		{
			"value": "Podiatric",
			"label": "Podiatric"
		},
		{
			"value": "PrimaryCare",
			"label": "Primary care"
		},
		{
			"value": "Psychiatric",
			"label": "Psychiatric"
		},
		{
			"value": "PublicHealth",
			"label": "Public health"
		},
		{
			"value": "Pulmonary",
			"label": "Pulmonary"
		},
		{
			"value": "Radiography",
			"label": "Radiography"
		},
		{
			"value": "Renal",
			"label": "Renal"
		},
		{
			"value": "RespiratoryTherapy",
			"label": "Respiratory therapy"
		},
		{
			"value": "Rheumatologic",
			"label": "Rheumatologic"
		},
		{
			"value": "SpeechPathology",
			"label": "Speech pathology"
		},
		{
			"value": "Surgical",
			"label": "Surgical"
		},
		{
			"value": "Toxicologic",
			"label": "Toxicologic"
		},
		{
			"value": "Urologic",
			"label": "Urologic"
		}
	],
	"MEDICAL_AUDIENCES": [
		{
			"value": "MedicalAudience",
			"label": "Medical audience"
		},
		{
			"value": "Patient",
			"label": "Patient"
		}
	],
	"MEDICAL_ABOUT_TYPES": [
		{
			"value": "MedicalCondition",
			"label": "Medical condition"
		},
		{
			"value": "Drug",
			"label": "Drug"
		},
		{
			"value": "MedicalProcedure",
			"label": "Medical procedure"
		}
	],
	"MEDICAL_ASPECTS": [
		{
			"value": "signOrSymptom",
			"label": "sign Or Symptom"
		},
		{
			"value": "riskFactor",
			"label": "risk Factor"
		},
		{
			"value": "possibleTreatment",
			"label": "possible Treatment"
		}
	],
	"ALBUM_PRODUCTION_TYPES": [
		{
			"value": "CompilationAlbum",
			"label": "Compilation"
		},
		{
			"value": "DJMixAlbum",
			"label": "DJ mix"
		},
		{
			"value": "DemoAlbum",
			"label": "Demo"
		},
		{
			"value": "LiveAlbum",
			"label": "Live"
		},
		{
			"value": "MixtapeAlbum",
			"label": "Mixtape"
		},
		{
			"value": "RemixAlbum",
			"label": "Remix"
		},
		{
			"value": "SoundtrackAlbum",
			"label": "Soundtrack"
		},
		{
			"value": "SpokenWordAlbum",
			"label": "Spoken word"
		},
		{
			"value": "StudioAlbum",
			"label": "Studio"
		}
	],
	"ALBUM_RELEASE_TYPES": [
		{
			"value": "AlbumRelease",
			"label": "Album"
		},
		{
			"value": "BroadcastRelease",
			"label": "Broadcast"
		},
		{
			"value": "EPRelease",
			"label": "EP"
		},
		{
			"value": "SingleRelease",
			"label": "Single"
		}
	]
};
export const TYPE_FLAGS = {
	"paywalled": [
		"content",
		"article",
		"news",
		"event",
		"recipe",
		"review",
		"course",
		"poll",
		"faq",
		"quote",
		"timeline",
		"gallery",
		"achievement",
		"announcement",
		"business",
		"location",
		"social",
		"software",
		"video",
		"howto",
		"qa",
		"podcast",
		"movie",
		"book",
		"dataset",
		"claim",
		"quiz",
		"realestate",
		"vacationrental",
		"menu",
		"tvseries",
		"tvepisode",
		"medical",
		"music",
		"glossary",
		"podcastseries",
		"comicseries",
		"comicissue"
	],
	"subtype": {
		"article": "SUBTYPES.article",
		"business": "SUBTYPES.business",
		"event": "SUBTYPES.event",
		"location": "SUBTYPES.location",
		"news": "SUBTYPES.news",
		"organization": "SUBTYPES.organization",
		"product": "SUBTYPES.product",
		"social": "SUBTYPES.social",
		"software": "SUBTYPES.software"
	},
	"subheadline": [
		"product",
		"profile",
		"music",
		"artist"
	],
	"envelopeOnly": [
		"content",
		"article",
		"news",
		"quote"
	]
};
export const INJECTED = {
	"paywalled": {
		"type": "boolean",
		"label": "Paywalled",
		"note": "emits isAccessibleForFree: False on CreativeWork / Event / Place itemtypes",
		"control": "toggle",
		"appliesTo": "PAYWALL_TYPES"
	}
};
