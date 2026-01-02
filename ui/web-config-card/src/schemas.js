export const cardTypes = [
	'achievement', 'announcement', 'article', 'booking', 'business',
	'comparison', 'contact', 'course', 'event', 'faq', 'gallery',
	'job', 'location', 'membership', 'news', 'poll', 'product',
	'profile', 'quote', 'recipe', 'review', 'social', 'software',
	'statistic', 'timeline'
];

export const schemas = {
	achievement: {
		title: 'Achievement Details',
		properties: {
			achievement: {
				type: 'object',
				title: 'Achievement Data',
				properties: {
					achievementName: { type: 'string', title: 'Name', placeholder: 'AWS Certified Solutions Architect' },
					issuingOrganization: { type: 'string', title: 'Organization', placeholder: 'Amazon Web Services' },
					dateEarned: { type: 'string', format: 'date', title: 'Date Earned' },
					expirationDate: { type: 'string', format: 'date', title: 'Expiration Date' },
					verificationUrl: { type: 'string', title: 'Verification URL', placeholder: 'https://aws.amazon.com/verification/...' },
					skillLevel: { type: 'string', title: 'Skill Level', placeholder: 'Professional' },
					credentialId: { type: 'string', title: 'Credential ID', placeholder: 'AWS-SAP-2024-001234' }
				}
			}
		}
	},
	announcement: {
		title: 'Announcement Details',
		properties: {
			announcement: {
				type: 'object',
				title: 'Announcement Data',
				properties: {
					priority: { type: 'string', title: 'Priority', enum: ['low', 'medium', 'high'] },
					announcementType: { type: 'string', title: 'Type', placeholder: 'maintenance' },
					effectiveDate: {
						type: 'object',
						title: 'Effective Date',
						properties: {
							start: { type: 'string', format: 'date-time', title: 'Start' },
							end: { type: 'string', format: 'date-time', title: 'End' }
						}
					},
					targetAudience: { type: 'string', title: 'Target Audience', placeholder: 'All Users' },
					actionRequired: { type: 'string', title: 'Action Required', placeholder: 'None - services will resume automatically' },
					isDismissible: { type: 'boolean', title: 'Dismissible' }
				}
			}
		}
	},
	article: {
		title: 'Article Details',
		properties: {
			authors: {
				type: 'array',
				title: 'Authors',
				itemTitle: 'Author',
				items: {
					type: 'object',
					properties: {
						name: { type: 'string', title: 'Name', placeholder: 'John Smith' },
						role: { type: 'string', title: 'Role', placeholder: 'Senior Editor' }
					}
				}
			}
		}
	},
	booking: {
		title: 'Booking Details',
		properties: {
			booking: {
				type: 'object',
				title: 'Booking Data',
				properties: {
					serviceName: { type: 'string', title: 'Service Name', placeholder: 'Conference Room A Rental' },
					venue: { type: 'string', title: 'Venue', placeholder: 'TechHub Downtown' },
					capacity: { type: 'number', title: 'Capacity', placeholder: '12' },
					duration: { type: 'string', title: 'Duration', placeholder: '2 hours' },
					price: {
						type: 'object',
						title: 'Price',
						properties: {
							hourlyRate: { type: 'number', title: 'Hourly Rate', placeholder: '45' },
							currency: { type: 'string', title: 'Currency', placeholder: 'USD' }
						}
					},
					amenities: { type: 'array', title: 'Amenities', itemTitle: 'Amenity', items: { type: 'string', placeholder: 'Projector' } },
					cancellationPolicy: { type: 'string', title: 'Cancellation Policy', placeholder: 'Free cancellation up to 24 hours before' }
				}
			}
		}
	},
	business: {
		title: 'Business Details',
		properties: {
			business: {
				type: 'object',
				title: 'Business Data',
				properties: {
					telephone: { type: 'string', title: 'Telephone', placeholder: '+1-555-123-4567' },
					email: { type: 'string', title: 'Email', placeholder: 'contact@company.com' },
					website: { type: 'string', title: 'Website', placeholder: 'https://company.com' },
					address: {
						type: 'object',
						title: 'Address',
						properties: {
							streetAddress: { type: 'string', title: 'Street', placeholder: '123 Main Street' },
							addressLocality: { type: 'string', title: 'City', placeholder: 'San Francisco' },
							addressRegion: { type: 'string', title: 'Region', placeholder: 'CA' },
							postalCode: { type: 'string', title: 'Postal Code', placeholder: '94102' },
							addressCountry: { type: 'string', title: 'Country', placeholder: 'US' }
						}
					},
					openingHours: {
						type: 'array',
						title: 'Opening Hours',
						itemTitle: 'Hours',
						items: {
							type: 'object',
							properties: {
								display: { type: 'string', title: 'Display Text', placeholder: 'Mon-Fri: 9AM-6PM' },
								schema: { type: 'string', title: 'Schema Format', placeholder: 'Mo-Fr 09:00-18:00' }
							}
						}
					}
				}
			}
		}
	},
	comparison: {
		title: 'Comparison Details',
		properties: {
			comparison: {
				type: 'object',
				title: 'Comparison Data',
				properties: {
					items: {
						type: 'array',
						title: 'Items',
						itemTitle: 'Comparison Item',
						items: {
							type: 'object',
							properties: {
								name: { type: 'string', title: 'Name', placeholder: 'Product Name' },
								price: { type: 'string', title: 'Price', placeholder: '$199' },
								image: { type: 'string', title: 'Image URL', placeholder: 'https://...' }
							}
						}
					},
					recommendation: { type: 'string', title: 'Recommendation', placeholder: 'premium' },
					summary: { type: 'string', title: 'Summary', placeholder: 'Premium offers best value for most users' }
				}
			}
		}
	},
	contact: {
		title: 'Contact Details',
		properties: {
			contact: {
				type: 'object',
				title: 'Contact Data',
				properties: {
					contactType: { type: 'string', title: 'Type', placeholder: 'Technical Support' },
					availableHours: { type: 'string', title: 'Hours', placeholder: 'Monday - Friday, 9 AM - 6 PM PST' },
					responseTime: { type: 'string', title: 'Response Time', placeholder: 'Usually within 4 hours' },
					contactMethods: {
						type: 'array',
						title: 'Methods',
						itemTitle: 'Method',
						items: {
							type: 'object',
							properties: {
								type: { type: 'string', title: 'Type', enum: ['email', 'phone', 'chat'] },
								value: { type: 'string', title: 'Value', placeholder: 'support@company.com' },
								label: { type: 'string', title: 'Label', placeholder: 'Email Support' }
							}
						}
					}
				}
			}
		}
	},
	course: {
		title: 'Course Details',
		properties: {
			duration: { type: 'string', title: 'Duration', placeholder: '6 weeks' },
			difficultyLevel: {
				type: 'string',
				title: 'Difficulty Level',
				enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
			},
			instructor: {
				type: 'object',
				title: 'Instructor',
				properties: {
					name: { type: 'string', title: 'Name', placeholder: 'Mark Rodriguez' },
					title: { type: 'string', title: 'Title', placeholder: 'Senior Full-Stack Developer' }
				}
			},
			price: {
				type: 'object',
				title: 'Price',
				properties: {
					current: { type: 'string', title: 'Current Price', placeholder: '89.99' },
					original: { type: 'string', title: 'Original Price', placeholder: '149.99' },
					currency: { type: 'string', title: 'Currency', placeholder: 'USD' }
				}
			},
			prerequisites: { type: 'array', title: 'Prerequisites', itemTitle: 'Prerequisite', items: { type: 'string', placeholder: 'Basic computer skills' } }
		}
	},
	event: {
		title: 'Event Details',
		properties: {
			event: {
				type: 'object',
				title: 'Event Data',
				properties: {
					startDate: { type: 'string', format: 'date-time', title: 'Start Date' },
					endDate: { type: 'string', format: 'date-time', title: 'End Date' },
					status: { type: 'string', title: 'Status', placeholder: 'Scheduled' },
					location: {
						type: 'object',
						title: 'Location',
						properties: {
							name: { type: 'string', title: 'Name', placeholder: 'Convention Center' },
							address: { type: 'string', title: 'Address', placeholder: '123 Event Blvd, San Francisco' }
						}
					},
					organizer: {
						type: 'object',
						title: 'Organizer',
						properties: {
							name: { type: 'string', title: 'Name', placeholder: 'TechConf Inc.' }
						}
					}
				}
			}
		}
	},
	faq: {
		title: 'FAQ Details',
		properties: {
			content: {
				type: 'object',
				title: 'Content',
				properties: {
					text: {
						type: 'array',
						title: 'Questions & Answers',
						itemTitle: 'Q&A',
						items: {
							type: 'object',
							properties: {
								headline: { type: 'string', title: 'Question', placeholder: 'How do I reset my password?' },
								text: { type: 'string', title: 'Answer', placeholder: 'Click on "Forgot Password" on the login page...' }
							}
						}
					}
				}
			}
		}
	},
	gallery: {
		title: 'Gallery Details',
		properties: {
			gallery: {
				type: 'object',
				title: 'Gallery Data',
				properties: {
					totalCount: { type: 'number', title: 'Total Count', placeholder: '24' },
					albumName: { type: 'string', title: 'Album Name', placeholder: '2024 Portfolio' },
					categories: { type: 'array', title: 'Categories', itemTitle: 'Category', items: { type: 'string', placeholder: 'Web Design' } }
				}
			}
		}
	},
	job: {
		title: 'Job Details',
		properties: {
			company: { type: 'string', title: 'Company Name', placeholder: 'InnovateTech' },
			location: { type: 'string', title: 'Location', placeholder: 'Remote (US Timezone)' },
			employmentType: {
				type: 'string',
				title: 'Employment Type',
				enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']
			},
			salaryRange: {
				type: 'object',
				title: 'Salary Range',
				properties: {
					min: { type: 'number', title: 'Minimum', placeholder: '120000' },
					max: { type: 'number', title: 'Maximum', placeholder: '150000' },
					currency: { type: 'string', title: 'Currency', placeholder: 'USD' },
					period: { type: 'string', title: 'Period', enum: ['hourly', 'weekly', 'monthly', 'annually'] }
				}
			},
			applicationDeadline: { type: 'string', format: 'date', title: 'Application Deadline' },
			qualifications: { type: 'array', title: 'Qualifications', itemTitle: 'Qualification', items: { type: 'string', placeholder: '5+ years React experience' } },
			benefits: { type: 'array', title: 'Benefits', itemTitle: 'Benefit', items: { type: 'string', placeholder: 'Health Insurance' } }
		}
	},
	location: {
		title: 'Location Details',
		properties: {
			location: {
				type: 'object',
				title: 'Location Data',
				properties: {
					hours: { type: 'string', title: 'Hours', placeholder: 'Always open' },
					contact: { type: 'string', title: 'Contact', placeholder: '+1-415-921-5858' },
					address: {
						type: 'object',
						title: 'Address',
						properties: {
							streetAddress: { type: 'string', title: 'Street', placeholder: 'Golden Gate Bridge' },
							addressLocality: { type: 'string', title: 'City', placeholder: 'San Francisco' },
							addressRegion: { type: 'string', title: 'Region', placeholder: 'CA' },
							addressCountry: { type: 'string', title: 'Country', placeholder: 'US' }
						}
					},
					amenities: { type: 'array', title: 'Amenities', itemTitle: 'Amenity', items: { type: 'string', placeholder: 'Visitor Center' } }
				}
			}
		}
	},
	membership: {
		title: 'Membership Details',
		properties: {
			membership: {
				type: 'object',
				title: 'Membership Data',
				properties: {
					planName: { type: 'string', title: 'Plan Name', placeholder: 'Professional' },
					trialPeriod: { type: 'string', title: 'Trial Period', placeholder: '14 days free' },
					isPopular: { type: 'boolean', title: 'Popular' },
					price: {
						type: 'object',
						title: 'Price',
						properties: {
							monthly: { type: 'string', title: 'Monthly Price', placeholder: '29.99' },
							yearly: { type: 'string', title: 'Yearly Price', placeholder: '299.99' },
							currency: { type: 'string', title: 'Currency', placeholder: 'USD' }
						}
					},
					features: { type: 'array', title: 'Features', itemTitle: 'Feature', items: { type: 'string', placeholder: 'Unlimited projects' } },
					limitations: { type: 'array', title: 'Limitations', itemTitle: 'Limitation', items: { type: 'string', placeholder: '10 team members max' } }
				}
			}
		}
	},
	news: {
		title: 'News Details',
		properties: {
			authors: {
				type: 'array',
				title: 'Authors',
				itemTitle: 'Author',
				items: {
					type: 'object',
					properties: {
						name: { type: 'string', title: 'Name', placeholder: 'Jane Reporter' },
						role: { type: 'string', title: 'Role', placeholder: 'Staff Writer' }
					}
				}
			}
		}
	},
	poll: {
		title: 'Poll Details',
		properties: {
			content: {
				type: 'object',
				title: 'Content',
				properties: {
					text: {
						type: 'array',
						title: 'Options',
						itemTitle: 'Option',
						items: {
							type: 'object',
							properties: {
								id: { type: 'string', title: 'ID', placeholder: 'option-1' },
								headline: { type: 'string', title: 'Label', placeholder: 'Option A' },
								text: { type: 'string', title: 'Description', placeholder: 'Description of option A' }
							}
						}
					}
				}
			},
			poll: {
				type: 'object',
				title: 'Poll Settings',
				properties: {
					endpoint: { type: 'string', title: 'API Endpoint', placeholder: '/api/polls/vote' },
					allowMultiple: { type: 'boolean', title: 'Allow Multiple' },
					showResults: { type: 'string', title: 'Show Results', enum: ['always', 'afterVote', 'never'] },
					totalVotes: { type: 'number', title: 'Total Votes', placeholder: '0' }
				}
			}
		}
	},
	product: {
		title: 'Product Details',
		properties: {
			sku: { type: 'string', title: 'SKU', placeholder: 'PROD-001234' },
			product: {
				type: 'object',
				title: 'Product Data',
				properties: {
					availability: { type: 'string', title: 'Availability', placeholder: 'In Stock' },
					validUntil: { type: 'string', format: 'date', title: 'Valid Until' },
					price: {
						type: 'object',
						title: 'Price',
						properties: {
							current: { type: 'string', title: 'Current Price', placeholder: '299.00' },
							original: { type: 'string', title: 'Original Price', placeholder: '399.00' },
							currency: { type: 'string', title: 'Currency', placeholder: 'USD' },
							discountText: { type: 'string', title: 'Discount Text', placeholder: '25% off' }
						}
					}
				}
			}
		}
	},
	profile: {
		title: 'Profile Details',
		properties: {
			profile: {
				type: 'object',
				title: 'Profile Data',
				properties: {
					jobTitle: { type: 'string', title: 'Job Title', placeholder: 'Senior UX Engineer' },
					organization: { type: 'string', title: 'Organization', placeholder: 'TechCorp Solutions' },
					bio: { type: 'string', title: 'Bio', placeholder: 'Passionate about creating inclusive digital experiences...' },
					location: { type: 'string', title: 'Location', placeholder: 'San Francisco, CA' },
					skills: { type: 'array', title: 'Skills', itemTitle: 'Skill', items: { type: 'string', placeholder: 'React' } },
					contacts: {
						type: 'array',
						title: 'Contacts',
						itemTitle: 'Contact',
						items: {
							type: 'object',
							properties: {
								type: { type: 'string', title: 'Type', placeholder: 'email' },
								value: { type: 'string', title: 'Value', placeholder: 'name@company.com' },
								label: { type: 'string', title: 'Label', placeholder: 'Email' }
							}
						}
					}
				}
			}
		}
	},
	quote: {
		title: 'Quote Details',
		properties: {
			authors: {
				type: 'array',
				title: 'Authors',
				itemTitle: 'Author',
				items: {
					type: 'object',
					properties: {
						name: { type: 'string', title: 'Name', placeholder: 'Albert Einstein' },
						role: { type: 'string', title: 'Role', placeholder: 'Physicist' }
					}
				}
			}
		}
	},
	recipe: {
		title: 'Recipe Details',
		properties: {
			content: {
				type: 'object',
				title: 'Content',
				properties: {
					text: { type: 'array', title: 'Ingredients', itemTitle: 'Ingredient', items: { type: 'string', placeholder: '2 cups flour' } }
				}
			},
			recipe: {
				type: 'object',
				title: 'Recipe Data',
				properties: {
					prepTime: { type: 'string', title: 'Prep Time', placeholder: '15 minutes' },
					cookTime: { type: 'string', title: 'Cook Time', placeholder: '30 minutes' },
					servings: { type: 'string', title: 'Servings', placeholder: '4 servings' },
					instructions: { type: 'array', title: 'Instructions', itemTitle: 'Step', items: { type: 'string', placeholder: 'Preheat oven to 350°F' } }
				}
			},
			authors: {
				type: 'array',
				title: 'Chefs/Authors',
				itemTitle: 'Chef',
				items: {
					type: 'object',
					properties: {
						name: { type: 'string', title: 'Name', placeholder: 'Chef Julia' },
						role: { type: 'string', title: 'Role', placeholder: 'Executive Chef' }
					}
				}
			}
		}
	},
	review: {
		title: 'Review Details',
		properties: {
			review: {
				type: 'object',
				title: 'Review Data',
				properties: {
					productReviewed: { type: 'string', title: 'Product Reviewed', placeholder: 'AuraSound Pro Headphones' },
					reviewDate: { type: 'string', format: 'date', title: 'Review Date' },
					rating: {
						type: 'object',
						title: 'Rating',
						properties: {
							value: { type: 'number', title: 'Value', placeholder: '5' },
							max: { type: 'number', title: 'Max', placeholder: '5' }
						}
					},
					reviewer: {
						type: 'object',
						title: 'Reviewer',
						properties: {
							name: { type: 'string', title: 'Name', placeholder: 'Jennifer M.' },
							verified: { type: 'boolean', title: 'Verified' }
						}
					}
				}
			}
		}
	},
	social: {
		title: 'Social Details',
		properties: {
			social: {
				type: 'object',
				title: 'Social Data',
				properties: {
					platform: { type: 'string', title: 'Platform', placeholder: 'Twitter' },
					author: { type: 'string', title: 'Author Handle', placeholder: '@DesignTeam' },
					postContent: { type: 'string', title: 'Post Content', placeholder: 'Just shipped a major update!' },
					hashtags: { type: 'array', title: 'Hashtags', itemTitle: 'Hashtag', items: { type: 'string', placeholder: '#DesignSystems' } }
				}
			}
		}
	},
	software: {
		title: 'Software Details',
		properties: {
			software: {
				type: 'object',
				title: 'Software Data',
				properties: {
					version: { type: 'string', title: 'Version', placeholder: '3.2.1' },
					applicationCategory: { type: 'string', title: 'Category', placeholder: 'Development Environment' },
					operatingSystem: { type: 'array', title: 'OS', itemTitle: 'OS', items: { type: 'string', placeholder: 'Windows' } },
					price: {
						type: 'object',
						title: 'Price',
						properties: {
							current: { type: 'string', title: 'Price', placeholder: '49.99' },
							currency: { type: 'string', title: 'Currency', placeholder: 'USD' }
						}
					},
					developer: {
						type: 'object',
						title: 'Developer',
						properties: {
							name: { type: 'string', title: 'Name', placeholder: 'DevTools Inc' },
							website: { type: 'string', title: 'Website', placeholder: 'https://devtools.com' }
						}
					}
				}
			}
		}
	},
	statistic: {
		title: 'Statistic Details',
		properties: {
			statistic: {
				type: 'object',
				title: 'Statistic Data',
				properties: {
					metricName: { type: 'string', title: 'Metric Name', placeholder: 'Monthly Active Users' },
					currentValue: { type: 'number', title: 'Value', placeholder: '125340' },
					unit: { type: 'string', title: 'Unit', placeholder: 'users' },
					trend: { type: 'string', title: 'Trend', enum: ['up', 'down', 'flat'] },
					trendPercentage: { type: 'number', title: 'Trend %', placeholder: '23.5' }
				}
			}
		}
	},
	timeline: {
		title: 'Timeline Details',
		properties: {
			content: {
				type: 'object',
				title: 'Content',
				properties: {
					text: {
						type: 'array',
						title: 'Events',
						itemTitle: 'Event',
						items: {
							type: 'object',
							properties: {
								headline: { type: 'string', title: 'Year/Time', placeholder: '2024' },
								text: { type: 'string', title: 'Description', placeholder: 'Company founded' }
							}
						}
					}
				}
			}
		}
	}
};

export const commonSchema = {
	media: {
		title: 'Media',
		type: 'object',
		properties: {
			caption: { type: 'string', title: 'Caption', placeholder: 'Image description' },
			sources: {
				type: 'array',
				title: 'Sources',
				itemTitle: 'Source',
				items: {
					type: 'object',
					properties: {
						src: { type: 'string', title: 'Source URL', placeholder: 'https://images.unsplash.com/...' },
						alt: { type: 'string', title: 'Alt Text', placeholder: 'Descriptive alt text' },
						type: { type: 'string', title: 'Type', enum: ['image', 'video'], default: 'image' }
					}
				}
			}
		}
	},
	actions: {
		title: 'Actions',
		type: 'array',
		itemTitle: 'Action',
		items: {
			type: 'object',
			properties: {
				text: { type: 'string', title: 'Label', placeholder: 'Learn More' },
				url: { type: 'string', title: 'URL', placeholder: 'https://...' },
				icon: { type: 'string', title: 'Icon', placeholder: 'arrow_forward' },
				type: { type: 'string', title: 'Button Type', enum: ['primary', 'secondary', 'tertiary'] }
			}
		}
	},
	ribbon: {
		title: 'Ribbon',
		type: 'object',
		properties: {
			text: { type: 'string', title: 'Text', placeholder: 'Bestseller' },
			style: { type: 'string', title: 'Style', placeholder: 'popular' }
		}
	},
	sticker: {
		title: 'Sticker',
		type: 'object',
		properties: {
			text: { type: 'string', title: 'Text', placeholder: 'NEW' },
			style: { type: 'string', title: 'Style', placeholder: 'badge' },
			position: { type: 'string', title: 'Position', enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] }
		}
	}
};
