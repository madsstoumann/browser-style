/**
 * ui/card/render.js
 * @version 1.0.0
 * @author Mads Stoumann
 *
 * Rendering engine for the universal card model (cms/baseline/models/card.schema.json).
 * Takes a UCF content instance (or its `fields` object) and returns a fully
 * composed <ui-card> — or <ui-reveal> for presentationHint "flip" — with inline
 * schema.org microdata matching ui/card/schema.html.
 *
 * All nodes are built with createElement/textContent — no innerHTML, no XSS surface.
 *
 * Usage:
 *   import { renderCard } from './render.js';
 *   const ucf = await (await fetch('data/product.json')).json();
 *   document.querySelector('.grid').append(renderCard(ucf));
 */

const SCHEMA = 'https://schema.org/';

/* schemaType → schema.org itemtype */
export const SCHEMA_TYPES = {
	content: 'CreativeWork',
	article: 'Article',
	news: 'NewsArticle',
	product: 'Product',
	event: 'Event',
	recipe: 'Recipe',
	review: 'Review',
	job: 'JobPosting',
	course: 'Course',
	booking: 'Reservation',
	poll: 'Question',
	profile: 'Person',
	faq: 'FAQPage',
	quote: 'Quotation',
	timeline: 'EventSeries',
	gallery: 'ImageGallery',
	statistic: 'Observation',
	achievement: 'EducationalOccupationalCredential',
	announcement: 'SpecialAnnouncement',
	business: 'LocalBusiness',
	comparison: 'ItemList',
	contact: 'ContactPoint',
	location: 'Place',
	membership: 'Offer',
	social: 'SocialMediaPosting',
	software: 'SoftwareApplication'
};

/* Fallback when a card references no preset (or an unknown one).
   Real presets live in data/card.presets.json — instances of the
   card-preset model (cms/baseline/models/card-preset.schema.json). */
const DEFAULT_PRESET = { element: 'ui-card', variant: 'col', media: 'asr(16/9)' };

/* headline itemprop: job → title, article/news → headline, rest → name */
const HEADLINE_PROP = { job: 'title', article: 'headline', news: 'headline' };
/* summary itemprop: review → reviewBody, quote/announcement/social → text, rest → description */
const SUMMARY_PROP = { review: 'reviewBody', quote: 'text', announcement: 'text', social: 'text' };
/* eyebrow itemprop (only where a sensible property exists) */
const EYEBROW_PROP = { article: 'articleSection', news: 'articleSection', product: 'category', recipe: 'recipeCategory', course: 'about', job: 'industry' };
/* published itemprop: JobPosting/SpecialAnnouncement use datePosted */
const PUBLISHED_PROP = { job: 'datePosted', announcement: 'datePosted' };
/* types where summary renders as a pull-quote part */
const QUOTE_SUMMARY = new Set(['quote', 'review', 'social']);
/* types where the image belongs to another scope — skip itemprop="image" */
const NO_IMAGE_PROP = new Set(['review', 'contact']);

/* ── element helpers (no innerHTML anywhere) ── */

const el = (tag, attrs = {}, children = []) => {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (value == null || value === false) continue;
		node.setAttribute(key, value === true ? '' : value);
	}
	for (const child of [].concat(children)) {
		if (child == null) continue;
		node.append(child instanceof Node ? child : String(child));
	}
	return node;
};

const meta = (prop, content) =>
	content == null || content === '' ? null : el('meta', { itemprop: prop, content });

const scoped = (tag, prop, type, attrs = {}, children = []) =>
	el(tag, { itemprop: prop, itemscope: true, itemtype: SCHEMA + type, ...attrs }, children);

const part = (tag, name, attrs = {}, children = []) =>
	el(tag, { 'data-part': name, ...attrs }, children);

const num = (value) => (typeof value === 'number' ? value.toLocaleString('en-US') : value);

/* preset.styles → style attribute value. Only CSS custom properties pass. */
const styleAttr = (styles) => {
	const rules = Object.entries(styles || {})
		.filter(([key]) => key.startsWith('--'))
		.map(([key, value]) => `${key}: ${value}`);
	return rules.length ? rules.join('; ') : null;
};

const stars = (value, max = 5) => '★'.repeat(Math.round(value)) + '☆'.repeat(max - Math.round(value));

/* "PT15M" → "15 min", "P6W" → "6 weeks", "P14D" → "14 days" */
const duration = (iso) => {
	const match = /^PT?(\d+)([MHWDY])$/.exec(iso || '');
	if (!match) return iso;
	const [, count, unit] = match;
	const units = { M: 'min', H: 'hr', W: 'week', D: 'day', Y: 'year' };
	const label = units[unit] || unit;
	const plural = label === 'min' || label === 'hr' ? label : Number(count) === 1 ? label : label + 's';
	return `${count} ${plural}`;
};

/* star rating row — proposed part "rating" */
const ratingPart = (prop, ratingType, rating) => {
	if (!rating?.value) return null;
	const max = rating.max ?? 5;
	const node = scoped('div', prop, ratingType, {
		'data-part': 'rating',
		role: 'img',
		'aria-label': `Rated ${rating.value} out of ${max} stars${rating.count ? ` from ${num(rating.count)} ratings` : ''}`
	}, [
		meta('ratingValue', rating.value),
		rating.count != null ? meta('ratingCount', rating.count) : null,
		meta('bestRating', max),
		meta('worstRating', 1),
		el('span', { 'aria-hidden': 'true' }, stars(rating.value, max)),
		el('span', {}, ` ${rating.value} / ${max}${rating.count ? ` (${num(rating.count)} ratings)` : ''}`)
	]);
	return node;
};

/* check/ordered list — proposed part "list" */
const listPart = (items, { ordered = false, itemprop } = {}) =>
	items?.length
		? part(ordered ? 'ol' : 'ul', 'list', itemprop ? { itemprop } : {}, items.map((item) => el('li', {}, item)))
		: null;

/* byline row from authors[] */
const byline = (authors, prop = 'author') =>
	(authors || []).map((author) =>
		scoped('address', prop, 'Person', { 'data-part': 'byline' }, [
			author.avatar ? el('img', { src: author.avatar, alt: '' }) : null,
			el('span', {}, [
				el('span', { itemprop: 'name' }, author.name),
				author.role ? ' · ' : null,
				author.role ? el('span', { itemprop: 'jobTitle' }, author.role) : null
			])
		])
	);

/* nested <ui-accordion> (CSS-only form) */
const accordion = (group, items) =>
	el('ui-accordion', { group }, items.map(({ summary, body, attrs = {} }) =>
		el('details', { class: 'ui-accordion', name: group, ...attrs }, [
			el('summary', {}, [...[].concat(summary), el('ui-icon', { type: 'plus-minus' })]),
			body
		])
	));

/* ── envelope ── */

const buildMedia = (fields, type, tokens, preset = {}) => {
	if (!fields.media?.length) return null;
	const frames = [];
	let embed = null;
	for (const item of fields.media) {
		const src = item.asset?.$asset ? item.asset.$asset : item.src;
		if (item.mediaType === 'youtube' || item.mediaType === 'vimeo') {
			/* lite embed — provider/video attributes on the frame itself (index.js wires it) */
			embed = { provider: item.mediaType, video: src };
			continue;
		}
		if (item.mediaType === 'video') {
			frames.push(el('video', {
				src,
				playsinline: true,
				controls: item.controls !== false && !item.autoplay,
				autoplay: !!item.autoplay,
				muted: !!(item.muted ?? item.autoplay),
				loop: !!item.loop,
				poster: item.poster || null,
				preload: item.autoplay ? 'auto' : 'metadata',
				'aria-label': item.alt || null
			}));
			continue;
		}
		frames.push(el('img', {
			src,
			alt: item.alt || '',
			loading: 'lazy',
			itemprop: NO_IMAGE_PROP.has(type) ? null : 'image'
		}));
	}
	const media = el('ui-media', {
		/* dual-attribute carousel form from the preset (self-only, groupable) */
		nav: preset.nav || null,
		arrow: preset.arrow || null,
		dot: preset.dot || null,
		...(embed || {})
	}, frames);
	if (fields.play) {
		media.append(el('ui-play', {}, [
			el('button', { type: 'button', 'aria-label': 'Play', command: '--toggle-play' }, [
				el('ui-icon', { type: 'play-pause' })
			])
		]));
		tokens.media.push(`play(${fields.play.position || 'cc'})`);
		if (fields.play.hue) tokens.media.push(`play(${fields.play.hue})`);
		if (fields.play.size) tokens.media.push(`ply(${fields.play.size})`);
	}
	if (fields.chip?.text) {
		media.append(el('ui-chip', {}, fields.chip.text));
		tokens.media.push(`chip(${fields.chip.position || 'ts'})`);
		if (fields.chip.hue) tokens.media.push(`chip(${fields.chip.hue})`);
	}
	if (fields.sticker?.text) {
		media.append(el('ui-sticker', fields.sticker.burst ? { variant: 'burst' } : {}, [el('strong', {}, fields.sticker.text)]));
		tokens.media.push(`sticker(${fields.sticker.position || 'te'})`);
		if (fields.sticker.hue) tokens.media.push(`sticker(${fields.sticker.hue})`);
	}
	if (fields.saveable) {
		media.append(el('ui-save', {}, [el('input', { type: 'checkbox', 'aria-label': `Save ${fields.headline || 'card'} to favorites` })]));
		tokens.media.push('save(ts)');
	}
	return media;
};

const buildContent = (fields, type, overlay) => {
	const content = el('ui-content');
	const headlineTag = overlay ? 'strong' : 'h3';
	const textTag = overlay ? 'span' : 'p';

	if (fields.eyebrow) {
		content.append(part('small', 'eyebrow', EYEBROW_PROP[type] ? { itemprop: EYEBROW_PROP[type] } : {}, fields.eyebrow));
		/* hidden machine value when the visible eyebrow carries no itemprop */
	}
	if (fields.headline && type !== 'quote') {
		content.append(part(headlineTag, 'headline', { itemprop: HEADLINE_PROP[type] || 'name' }, fields.headline));
	}
	if (fields.subheadline) content.append(part(textTag, 'subheadline', {}, fields.subheadline));
	if (fields.summary) {
		const prop = SUMMARY_PROP[type] || 'description';
		content.append(QUOTE_SUMMARY.has(type)
			? part('blockquote', 'quote', { itemprop: prop }, fields.summary)
			: part(textTag, 'summary', { itemprop: prop }, fields.summary));
	}
	appendBody(fields, content, textTag);
	if (fields.published) content.append(meta(PUBLISHED_PROP[type] || 'datePublished', fields.published));
	if (fields.modified) content.append(meta('dateModified', fields.modified));
	return content;
};

/* Long-form body: plain string or UCF richtext ({$richtext, content, format}).
   Rendered as one element per blank-line-separated paragraph via textContent —
   html-format richtext is NOT rendered (no innerHTML in this engine). */
const appendBody = (fields, content, textTag = 'p') => {
	const body = fields.body;
	const text = typeof body === 'string'
		? body
		: body?.$richtext && body.format !== 'html' ? body.content : null;
	if (!text) return;
	for (const paragraph of String(text).split(/\n{2,}/)) {
		const trimmed = paragraph.trim();
		if (trimmed) content.append(el(textTag, {}, trimmed));
	}
};

const buildTail = (fields, content) => {
	/* byline, tags, actions, engagement — envelope trailers, appended after details */
	if (fields.authors?.length) content.append(...byline(fields.authors, fields.schemaType === 'quote' ? 'creator' : 'author'));
	if (fields.readingTime || fields.published) {
		const bits = [];
		if (fields.published) bits.push(el('time', { datetime: fields.published }, new Date(fields.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })));
		if (fields.readingTime) bits.push(` · ${fields.readingTime}`);
		content.append(part('p', 'meta', {}, bits));
	}
	if (fields.tags?.length) {
		content.append(part('ul', 'tags', {}, fields.tags.map((tag) =>
			el('li', {}, [el('a', { href: '#' }, tag)])
		)));
	}
	if (fields.actions?.length) {
		content.append(part('nav', 'actions', {}, fields.actions.map((action) =>
			el('a', {
				class: action.style === 'primary' ? 'ui-button' : 'ui-button --ghost',
				href: action.link?.url || '#'
			}, action.link?.text || '')
		)));
	}
	const eng = fields.engagement;
	if (eng && Object.keys(eng).length) {
		const counters = [
			['likeCount', 'LikeAction'],
			['shareCount', 'ShareAction'],
			['commentCount', 'CommentAction'],
			['viewCount', 'WatchAction']
		];
		for (const [key, action] of counters) {
			if (eng[key] == null) continue;
			content.append(scoped('div', 'interactionStatistic', 'InteractionCounter', { hidden: true }, [
				meta('interactionType', SCHEMA + action),
				meta('userInteractionCount', eng[key])
			]));
		}
		const summary = [
			eng.viewCount != null ? `${num(eng.viewCount)} views` : null,
			eng.likeCount != null ? `${num(eng.likeCount)} likes` : null,
			eng.shareCount != null ? `${num(eng.shareCount)} shares` : null,
			eng.commentCount != null ? `${num(eng.commentCount)} comments` : null
		].filter(Boolean).join(' · ');
		if (summary) content.append(part('footer', 'footer', {}, summary));
	}
};

/* ── type-specific detail renderers — append parts to <ui-content> ── */

const DETAILS = {
	product(d, content) {
		if (d.price) {
			content.append(part('p', 'price', { itemprop: 'offers', itemscope: true, itemtype: SCHEMA + 'Offer' }, [
				meta('priceCurrency', d.price.currency),
				meta('availability', SCHEMA + (/(in)/i.test(d.availability || '') ? 'InStock' : /(low|limited)/i.test(d.availability || '') ? 'LimitedAvailability' : 'OutOfStock')),
				meta('itemCondition', SCHEMA + 'NewCondition'),
				d.validUntil ? meta('priceValidUntil', d.validUntil) : null,
				el('data', { itemprop: 'price', value: d.price.current }, `${d.price.currency || ''} ${d.price.current}`),
				d.price.original ? el('del', {}, ` ${d.price.currency || ''} ${d.price.original}`) : null,
				d.price.discountText ? el('small', {}, ` ${d.price.discountText}`) : null
			]));
		}
		content.append(ratingPart('aggregateRating', 'AggregateRating', d.rating));
		const bits = [d.availability, d.sku ? `SKU ${d.sku}` : null].filter(Boolean).join(' · ');
		if (bits) content.append(part('p', 'meta', {}, bits));
		if (d.sku) content.append(meta('sku', d.sku));
	},

	event(d, content) {
		content.append(
			meta('eventStatus', d.status ? SCHEMA + 'Event' + d.status : null),
			meta('eventAttendanceMode', SCHEMA + 'OfflineEventAttendanceMode'),
			meta('startDate', d.startDate),
			meta('endDate', d.endDate)
		);
		const location = d.location?.name
			? scoped('span', 'location', 'Place', {}, [
				el('span', { itemprop: 'name' }, d.location.name),
				d.location.address ? scoped('span', 'address', 'PostalAddress', {}, [', ', el('span', { itemprop: 'addressLocality' }, d.location.address)]) : null
			])
			: null;
		content.append(part('span', 'meta', {}, [d.dateDisplay || d.startDate, location ? ' · ' : null, location]));
		if (d.organizer?.name) {
			content.append(part('span', 'meta', { itemprop: 'organizer', itemscope: true, itemtype: SCHEMA + 'Organization' }, [
				'Organizer: ', el('span', { itemprop: 'name' }, d.organizer.name)
			]));
		}
	},

	recipe(d, content) {
		content.append(meta('prepTime', d.prepTime), meta('cookTime', d.cookTime), meta('recipeYield', d.servings));
		content.append(part('p', 'meta', {}, `Prep ${duration(d.prepTime)} · Cook ${duration(d.cookTime)} · Serves ${d.servings}`));
		if (d.ingredients?.length) {
			content.append(part('ul', 'list', {}, d.ingredients.map((ingredient) =>
				el('li', { itemprop: 'recipeIngredient' }, ingredient)
			)));
		}
		if (d.instructions?.length) {
			content.append(accordion('recipe-acc', [{
				summary: 'Instructions',
				body: scoped('div', 'recipeInstructions', 'ItemList', {}, [
					el('ol', {}, d.instructions.map((step, index) =>
						scoped('li', 'itemListElement', 'HowToStep', {}, [
							meta('position', index + 1),
							el('span', { itemprop: 'text' }, step)
						])
					))
				])
			}]));
		}
	},

	review(d, content) {
		/* rating renders before the quote — insert after headline */
		const quote = content.querySelector('[data-part="quote"]');
		const rating = ratingPart('reviewRating', 'Rating', d.rating);
		if (rating && quote) content.insertBefore(rating, quote);
		else if (rating) content.append(rating);
		if (d.reviewer?.name) {
			content.append(scoped('address', 'author', 'Person', { 'data-part': 'byline' }, [
				el('span', {}, [
					el('span', { itemprop: 'name' }, d.reviewer.name),
					d.reviewer.verified ? ' ✓ Verified purchase' : null
				])
			]));
		}
		if (d.reviewDate) {
			content.append(part('p', 'meta', {}, [el('time', { itemprop: 'datePublished', datetime: d.reviewDate }, d.reviewDateDisplay || d.reviewDate)]));
		}
		if (d.productReviewed) {
			content.append(scoped('div', 'itemReviewed', 'Product', { hidden: true }, [meta('name', d.productReviewed)]));
		}
	},

	job(d, content) {
		content.append(
			meta('industry', d.industry),
			meta('employmentType', d.employmentType),
			meta('validThrough', d.applicationDeadline)
		);
		content.append(part('p', 'meta', {}, [
			scoped('span', 'hiringOrganization', 'Organization', {}, [el('span', { itemprop: 'name' }, d.company)]),
			' · ',
			scoped('span', 'jobLocation', 'Place', {}, [el('span', { itemprop: 'name' }, d.location)]),
			d.employmentTypeDisplay ? ` · ${d.employmentTypeDisplay}` : null,
			d.applicationDeadlineDisplay ? ` · Apply by ${d.applicationDeadlineDisplay}` : null
		]));
		const salary = d.salaryRange;
		if (salary) {
			content.append(part('p', 'price', { itemprop: 'baseSalary', itemscope: true, itemtype: SCHEMA + 'MonetaryAmount' }, [
				meta('currency', salary.currency),
				scoped('span', 'value', 'QuantitativeValue', {}, [
					meta('minValue', salary.min),
					meta('maxValue', salary.max),
					meta('unitText', salary.period || 'YEAR'),
					`${salary.currency} ${num(salary.min)}–${num(salary.max)} `,
					el('small', {}, salary.periodDisplay || 'annually')
				])
			]));
		}
		const sections = [];
		if (d.qualifications?.length) sections.push({ summary: 'Requirements', body: el('div', {}, [listPart(d.qualifications, { itemprop: 'qualifications' })]) });
		if (d.benefits?.length) sections.push({ summary: 'Benefits', body: el('div', {}, [listPart(d.benefits, { itemprop: 'jobBenefits' })]) });
		if (sections.length) content.append(accordion('job-acc', sections));
	},

	course(d, content) {
		content.append(
			meta('timeRequired', d.duration),
			meta('educationalLevel', d.difficultyLevel),
			scoped('div', 'hasCourseInstance', 'CourseInstance', { hidden: true }, [meta('courseMode', 'Online')])
		);
		content.append(part('p', 'meta', {}, [
			`${duration(d.duration)} · ${d.difficultyLevel} · Instructor: `,
			scoped('span', 'provider', 'Organization', {}, [el('span', { itemprop: 'name' }, d.instructor?.name)])
		]));
		if (d.price) {
			content.append(part('p', 'price', { itemprop: 'offers', itemscope: true, itemtype: SCHEMA + 'Offer' }, [
				meta('priceCurrency', d.price.currency),
				meta('availability', SCHEMA + 'InStock'),
				el('data', { itemprop: 'price', value: d.price.current }, `${d.price.currency} ${d.price.current}`),
				d.price.original ? el('del', {}, ` ${d.price.currency} ${d.price.original}`) : null
			]));
		}
		content.append(listPart(d.prerequisites));
	},

	booking(d, content) {
		content.append(
			meta('totalPrice', d.price?.hourlyRate),
			meta('priceCurrency', d.price?.currency),
			d.serviceName ? scoped('div', 'reservationFor', 'Service', { hidden: true }, [meta('name', d.serviceName)]) : null
		);
		content.append(part('p', 'meta', {}, [
			scoped('span', 'provider', 'Organization', {}, [el('span', { itemprop: 'name' }, d.venue)]),
			d.capacity ? ` · Capacity ${d.capacity}` : null,
			d.duration ? ` · ${d.duration}` : null,
			d.cancellationPolicy ? ` · ${d.cancellationPolicy}` : null
		]));
		if (d.price?.hourlyRate != null) {
			content.append(part('p', 'price', {}, [
				el('data', { value: d.price.hourlyRate }, `${d.price.currency} ${d.price.hourlyRate}`), '/hour'
			]));
		}
		content.append(listPart(d.amenities));
	},

	poll(d, content) {
		content.append(meta('answerCount', d.options?.length));
		const total = d.totalVotes || d.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;
		if (d.options?.length) {
			content.append(part('ul', 'options', {}, d.options.map((option) => {
				const pct = total ? Math.round((option.votes / total) * 100) : 0;
				return scoped('li', 'suggestedAnswer', 'Answer', {}, [
					el('label', {}, [
						el('input', { type: 'radio', name: 'poll-render' }),
						' ',
						el('span', { itemprop: 'text' }, option.headline)
					]),
					el('progress', { max: 100, value: pct }),
					el('span', {}, ` ${pct}%`)
				]);
			})));
		}
		content.append(part('footer', 'footer', {}, [`${num(total)} votes`, d.closesDisplay ? ` · ${d.closesDisplay}` : null]));
	},

	profile(d, content) {
		const headline = content.querySelector('[data-part="headline"]');
		if (d.jobTitle && headline) {
			const sub = part('p', 'subheadline', {}, [
				el('span', { itemprop: 'jobTitle' }, d.jobTitle),
				d.organization ? ' · ' : null,
				d.organization ? scoped('span', 'worksFor', 'Organization', {}, [el('span', { itemprop: 'name' }, d.organization)]) : null
			]);
			headline.after(sub);
		}
		if (d.location) content.append(part('p', 'meta', { itemprop: 'address' }, d.location));
		if (d.contacts?.length) {
			content.append(part('nav', 'actions', {}, d.contacts.map((contact) => {
				const href = contact.type === 'email' ? `mailto:${contact.value}` : contact.type === 'phone' ? `tel:${contact.value}` : contact.value;
				const prop = contact.type === 'email' ? 'email' : contact.type === 'phone' ? 'telephone' : 'url';
				return el('a', { class: 'ui-button --ghost', itemprop: prop, href }, contact.label || contact.value);
			})));
		}
	},

	faq(d, content) {
		if (!d.items?.length) return;
		content.append(accordion('faq-render', d.items.map((item) => ({
			summary: el('span', { itemprop: 'name' }, item.question),
			body: scoped('div', 'acceptedAnswer', 'Answer', {}, [el('p', { itemprop: 'text' }, item.answer)]),
			attrs: { itemprop: 'mainEntity', itemscope: true, itemtype: SCHEMA + 'Question' }
		}))));
	},

	timeline(d, content) {
		if (!d.items?.length) return;
		content.append(part('ol', 'timeline', {}, d.items.map((item) =>
			scoped('li', 'subEvent', 'Event', {}, [
				el('time', { itemprop: 'name', datetime: item.date }, item.headline || item.date),
				' ',
				el('span', { itemprop: 'description' }, item.text)
			])
		)));
	},

	gallery(d, content) {
		const bits = [d.albumName, d.totalCount ? `${d.totalCount} photos` : null].filter(Boolean).join(' · ');
		if (bits) content.append(part('p', 'meta', {}, bits));
	},

	statistic(d, content) {
		content.append(part('p', 'stat', { itemprop: 'value', itemscope: true, itemtype: SCHEMA + 'QuantitativeValue' }, [
			meta('name', d.metricName),
			el('data', { itemprop: 'value', value: d.currentValue }, d.displayValue ?? String(d.currentValue)),
			d.unit ? el('small', { itemprop: 'unitText' }, d.unit) : null,
			d.trend ? el('span', {}, ` ${d.trend === 'up' ? '▲' : d.trend === 'down' ? '▼' : '►'} ${d.trendPercentage}%`) : null
		]));
		if (d.note) content.append(part('p', 'meta', {}, d.note));
	},

	achievement(d, content) {
		content.append(
			meta('dateCreated', d.dateEarned),
			meta('expires', d.expirationDate),
			meta('educationalLevel', d.skillLevel),
			meta('identifier', d.credentialId)
		);
		content.append(part('p', 'meta', {}, [
			'Issued by ',
			scoped('span', 'recognizedBy', 'Organization', {}, [el('span', { itemprop: 'name' }, d.issuingOrganization)]),
			d.dateEarnedDisplay ? ` · ${d.dateEarnedDisplay}` : null,
			d.expirationDateDisplay ? ` · Expires ${d.expirationDateDisplay}` : null,
			d.credentialId ? ` · ID ${d.credentialId}` : null
		]));
	},

	announcement(d, content) {
		content.append(
			meta('datePosted', d.effectiveDate?.start),
			meta('expires', d.effectiveDate?.end),
			meta('spatialCoverage', 'Global')
		);
		if (d.targetAudience) {
			content.append(part('p', 'meta', { itemprop: 'audience', itemscope: true, itemtype: SCHEMA + 'Audience' }, [
				'Audience: ', el('span', { itemprop: 'audienceType' }, d.targetAudience)
			]));
		}
		if (d.actionRequired) content.append(part('footer', 'footer', {}, `Action required: ${d.actionRequired}`));
	},

	business(d, content) {
		content.append(meta('url', d.website));
		if (d.geo) {
			content.append(scoped('div', 'geo', 'GeoCoordinates', { hidden: true }, [
				meta('latitude', d.geo.latitude), meta('longitude', d.geo.longitude)
			]));
		}
		if (d.address) {
			content.append(part('address', 'address', { itemprop: 'address', itemscope: true, itemtype: SCHEMA + 'PostalAddress' }, [
				d.address.streetAddress ? el('span', { itemprop: 'streetAddress' }, d.address.streetAddress) : null,
				d.address.streetAddress ? ', ' : null,
				d.address.postalCode ? el('span', { itemprop: 'postalCode' }, d.address.postalCode) : null,
				d.address.postalCode ? ' ' : null,
				d.address.addressLocality ? el('span', { itemprop: 'addressLocality' }, d.address.addressLocality) : null,
				meta('addressCountry', d.address.addressCountry)
			]));
		}
		if (d.openingHours?.length) {
			content.append(part('p', 'meta', {}, [
				...d.openingHours.map((hours) => meta('openingHours', hours.schema)),
				d.openingHours.map((hours) => hours.display).join(' · ')
			]));
		}
		const links = [];
		if (d.telephone) links.push(el('a', { class: 'ui-button --ghost', itemprop: 'telephone', href: `tel:${d.telephone.replace(/\s/g, '')}` }, d.telephone));
		if (d.email) links.push(el('a', { class: 'ui-button --ghost', itemprop: 'email', href: `mailto:${d.email}` }, 'Email'));
		if (links.length) content.append(part('nav', 'actions', {}, links));
	},

	comparison(d, content) {
		content.append(meta('numberOfItems', d.items?.length));
		if (d.items?.length) {
			content.append(part('ul', 'options', {}, d.items.map((item, index) =>
				scoped('li', 'itemListElement', 'ListItem', {}, [
					meta('position', index + 1),
					el('label', {}, [el('span', { itemprop: 'name' }, item.name), item.price ? ` — ${item.price}` : null]),
					item.score != null ? el('progress', { max: 100, value: item.score }) : null,
					item.scoreDisplay ? el('span', {}, ` ${item.scoreDisplay}`) : null
				])
			)));
		}
		if (d.recommendation) content.append(part('footer', 'footer', {}, `Recommended: ${d.recommendation}${d.summary ? ` — ${d.summary}` : ''}`));
	},

	contact(d, content) {
		content.append(meta('contactType', d.contactType), meta('hoursAvailable', d.availableHours));
		const bits = [d.availableHoursDisplay, d.languages].filter(Boolean).join(' · ');
		if (bits) content.append(part('p', 'meta', {}, bits));
		if (d.contactMethods?.length) {
			content.append(part('nav', 'actions', {}, d.contactMethods.map((method, index) => {
				const href = method.type === 'email' ? `mailto:${method.value}` : method.type === 'phone' ? `tel:${method.value}` : method.value;
				const prop = method.type === 'email' ? 'email' : method.type === 'phone' ? 'telephone' : 'url';
				return el('a', { class: index === 0 ? 'ui-button' : 'ui-button --ghost', itemprop: prop, href }, method.label || method.value);
			})));
		}
	},

	location(d, content) {
		if (d.geo) {
			content.append(scoped('div', 'geo', 'GeoCoordinates', { hidden: true }, [
				meta('latitude', d.geo.latitude), meta('longitude', d.geo.longitude)
			]));
		}
		if (d.address) {
			content.append(part('address', 'address', { itemprop: 'address', itemscope: true, itemtype: SCHEMA + 'PostalAddress' }, [
				d.address.addressLocality ? el('span', { itemprop: 'addressLocality' }, d.address.addressLocality) : null,
				d.address.addressCountry ? ', ' : null,
				d.address.addressCountry ? el('span', { itemprop: 'addressCountry' }, d.address.addressCountry) : null
			]));
		}
		if (d.hours) content.append(part('span', 'meta', {}, d.hours));
	},

	membership(d, content) {
		content.append(meta('eligibleDuration', d.trialPeriod));
		if (d.price) {
			content.append(part('p', 'price', { itemprop: 'priceSpecification', itemscope: true, itemtype: SCHEMA + 'PriceSpecification' }, [
				meta('priceCurrency', d.price.currency),
				el('data', { itemprop: 'price', value: d.price.monthly }, `${d.price.currency} ${d.price.monthly}`), '/mo ',
				d.price.yearly ? el('small', {}, `or ${d.price.currency} ${d.price.yearly}/yr${d.price.savings ? ` — ${d.price.savings}` : ''}`) : null
			]));
		}
		content.append(listPart(d.features, { itemprop: 'includesObject' }));
		if (d.trialText) content.append(part('p', 'meta', {}, d.trialText));
	},

	social(d, content) {
		if (d.platform) {
			content.append(scoped('div', 'publisher', 'Organization', { hidden: true }, [meta('name', d.platform)]));
		}
	},

	software(d, content) {
		content.append(meta('applicationCategory', d.applicationCategory));
		(d.operatingSystem || []).forEach((os) => content.append(meta('operatingSystem', os)));
		content.append(part('p', 'meta', {}, [
			(d.operatingSystem || []).join(' · '),
			d.fileSize ? ` · ${d.fileSize}` : null
		]));
		if (d.developer?.name) {
			content.append(part('p', 'meta', { itemprop: 'author', itemscope: true, itemtype: SCHEMA + 'Organization' }, [
				'Developer: ',
				el('span', { itemprop: 'name' }, d.developer.name),
				d.developer.website ? meta('url', d.developer.website) : null
			]));
		}
		if (d.price) {
			content.append(part('p', 'price', { itemprop: 'offers', itemscope: true, itemtype: SCHEMA + 'Offer' }, [
				meta('priceCurrency', d.price.currency),
				meta('availability', SCHEMA + 'InStock'),
				el('data', { itemprop: 'price', value: d.price.current }, `${d.price.currency} ${d.price.current}`),
				d.price.note ? el('small', {}, ` ${d.price.note}`) : null
			]));
		}
	}
};

/* ── reveal composition (<ui-reveal>) — used when preset.element is ui-reveal ── */

/* Back panel derived from the host card's own envelope + details. */
const buildDerivedBack = (fields, type) => {
	const back = el('ui-content', { tabindex: '0' }, [
		fields.eyebrow ? part('small', 'eyebrow', {}, fields.eyebrow) : null,
		part('h3', 'headline', {}, `${fields.headline}${fields.details?.version ? ` ${fields.details.version}` : ''}`),
		fields.summary ? part('p', 'summary', { itemprop: SUMMARY_PROP[type] || 'description' }, fields.summary) : null
	]);
	appendBody(fields, back);
	if (DETAILS[type] && fields.details) DETAILS[type](fields.details, back);
	buildTail({ ...fields, published: null, readingTime: null }, back);
	return back;
};

/* Back panel from a referenced flipside card. Rendered as a content column only —
   never another reveal — so flipside chains cannot recurse. Shares the host's
   itemscope: the flipside's props attach to the host entity. */
const buildFlipsideBack = (flipside) => {
	const fields = flipside?.fields ?? flipside ?? {};
	const type = SCHEMA_TYPES[fields.schemaType] ? fields.schemaType : 'content';
	const back = buildContent(fields, type, false);
	back.setAttribute('tabindex', '0');
	if (DETAILS[type] && fields.details) DETAILS[type](fields.details, back);
	buildTail(fields, back);
	return back;
};

const renderReveal = (fields, type, itemtype, tokens, preset, flipside) => {
	const front = el('ui-face', {}, [
		buildMedia(fields, type, tokens, preset),
		el('ui-content', {}, [
			fields.eyebrow ? part('small', 'eyebrow', {}, fields.eyebrow) : null,
			part('strong', 'headline', { itemprop: HEADLINE_PROP[type] || 'name' }, fields.headline),
			fields.details?.version ? part('span', 'meta', {}, [
				'v', el('span', { itemprop: 'softwareVersion' }, fields.details.version)
			]) : null
		])
	]);
	const back = flipside ? buildFlipsideBack(flipside) : buildDerivedBack(fields, type);
	const reveal = preset.reveal || {};

	return el('ui-reveal', {
		icon: reveal.icon || 'top right sm',
		'icon-close': reveal.iconClose || null,
		type: reveal.type || 'flip',
		'type-lg': reveal.typeLg || null,
		to: reveal.to || null,
		from: reveal.from || null,
		trigger: reveal.trigger || null,
		scroll: !!reveal.scroll,
		variant: preset.variant || null,
		media: [preset.media, ...tokens.media].filter(Boolean).join(' ') || null,
		content: preset.content || null,
		style: styleAttr(preset.styles),
		itemscope: true,
		itemtype
	}, [
		el('details', { name: 'render-reveal' }, [
			el('summary', {}, [front, el('ui-icon', { type: reveal.iconType || 'plus-cross', 'aria-hidden': 'true' })]),
			back
		])
	]);
};

/* ── public API ── */

/**
 * Resolve a card's preset reference against a preset map.
 * `fields.preset` is a UCF reference: { "$ref": "card-preset/{id}" }.
 */
const resolvePreset = (fields, presets) => {
	const ref = fields.preset?.$ref || '';
	const id = ref.startsWith('card-preset/') ? ref.slice('card-preset/'.length) : ref;
	return (id && presets[id]) || DEFAULT_PRESET;
};

/* Resolve a card → card reference ({ "$ref": "card/{id}" }) against a UCF map keyed by id. */
const resolveCard = (ref, cards) => {
	const id = (ref?.$ref || '').split('/').pop();
	return (id && cards[id]) || null;
};

/**
 * Fetch a preset collection (data/card.presets.json) and return the id → preset map.
 * @param {string} url
 * @returns {Promise<object>}
 */
export async function loadPresets(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
	const doc = await response.json();
	return doc.presets || doc;
}

/**
 * Render one card from a UCF instance (or its bare `fields` object).
 * The look & feel comes from the referenced card-preset — pass the preset map
 * from loadPresets(). Unknown/missing references fall back to a plain stack card.
 * @param {object} ucf — UCF file content ({ fields }) or the fields object itself
 * @param {object} [presets] — id → preset map (from data/card.presets.json)
 * @param {object} [cards] — id → UCF map for resolving card references (flipside)
 * @returns {HTMLElement} <ui-card> or <ui-reveal>
 */
export function renderCard(ucf, presets = {}, cards = {}) {
	const fields = ucf?.fields ?? ucf ?? {};
	const type = SCHEMA_TYPES[fields.schemaType] ? fields.schemaType : 'content';
	const itemtype = SCHEMA + SCHEMA_TYPES[type];
	const preset = resolvePreset(fields, presets);

	const tokens = { media: [] };

	if (preset.element === 'ui-reveal') {
		return renderReveal(fields, type, itemtype, tokens, preset, resolveCard(fields.flipside, cards));
	}

	/* Bare <ui-media> — a standalone media frame, no card chrome. The media
	   token string sits on the element itself (rds() applies outside a card). */
	if (preset.element === 'ui-media') {
		const media = buildMedia(fields, type, tokens, preset) || el('ui-media');
		const mediaTokens = [preset.media, ...tokens.media].filter(Boolean).join(' ');
		if (mediaTokens) media.setAttribute('media', mediaTokens);
		const style = styleAttr(preset.styles);
		if (style) media.setAttribute('style', style);
		media.setAttribute('itemscope', '');
		media.setAttribute('itemtype', itemtype);
		if (fields.headline) media.append(meta('name', fields.headline));
		const caption = fields.media?.find((item) => item.caption)?.caption;
		if (caption) media.append(part('small', 'caption', {}, caption));
		return media;
	}

	/* Bare <ui-content> — a standalone content column, no card chrome. */
	if (preset.element === 'ui-content') {
		const content = buildContent(fields, type, false);
		if (DETAILS[type] && fields.details) DETAILS[type](fields.details, content);
		buildTail(fields, content);
		if (preset.content) content.setAttribute('content', preset.content);
		const style = styleAttr(preset.styles);
		if (style) content.setAttribute('style', style);
		content.setAttribute('itemscope', '');
		content.setAttribute('itemtype', itemtype);
		return content;
	}

	const media = buildMedia(fields, type, tokens, preset);
	const overlay = /ovr\(/.test(preset.variant || '');
	const content = buildContent(fields, type, overlay);
	if (DETAILS[type] && fields.details) DETAILS[type](fields.details, content);
	buildTail(fields, content);

	const mediaTokens = [preset.media, ...tokens.media].filter(Boolean).join(' ');
	return el('ui-card', {
		variant: preset.variant || 'col',
		media: mediaTokens || null,
		content: preset.content || null,
		style: styleAttr(preset.styles),
		itemscope: true,
		itemtype
	}, [
		el('cq-box', {}, [media, content])
	]);
}

/**
 * Fetch a UCF file and render it.
 * @param {string} url
 * @param {object} [presets] — id → preset map
 * @param {object} [cards] — id → UCF map for card references
 * @returns {Promise<HTMLElement>}
 */
export async function renderCardFrom(url, presets = {}, cards = {}) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
	return renderCard(await response.json(), presets, cards);
}

export default renderCard;
