/**
 * ui/card/render.js
 * @version 2.0.0
 * @author Mads Stoumann
 *
 * SSR rendering engine for the universal card model (cms/baseline/models/card.schema.json).
 * Takes a UCF content instance (or its `fields` object) and returns an HTML STRING —
 * a fully composed <ui-card>, <ui-reveal>, or bare <ui-media>/<ui-content>, with
 * inline schema.org microdata matching ui/card/demo/schema.html.
 *
 * Security: every interpolated value passes through esc() — the output is safe to
 * insert with insertAdjacentHTML/innerHTML or stream from a server. The single,
 * deliberate exception is the headline, where renderInline() re-allows `<b>` only
 * (gradient-highlight segments); everything else in it stays escaped.
 *
 * No `document` usage — runs unchanged in Node for true SSR.
 *
 * Usage (browser):
 *   import { renderCard, loadPresets } from './render.js';
 *   const presets = await loadPresets('data/card.presets.json');
 *   const ucf = await (await fetch('data/product.json')).json();
 *   grid.insertAdjacentHTML('beforeend', renderCard(ucf, presets));
 */

/* Token knowledge is DATA: data/tokens.json is the manifest the CSS conventions, this
   renderer, the generated tokens.md and tokens.lint.js all read. tokens.data.js is its
   generated ES-module mirror — a plain import, so this module stays Node+browser safe. */
import TOKENS from './data/tokens.data.js';
import { buildCfUrl, buildSrcset } from './srcset.js';

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
	software: 'SoftwareApplication',
	organization: 'Organization',
	video: 'VideoObject',
	howto: 'HowTo',
	qa: 'QAPage',
	podcast: 'PodcastEpisode',
	movie: 'Movie',
	book: 'Book',
	dataset: 'Dataset',
	claim: 'ClaimReview',
	loyalty: 'MemberProgram',
	quiz: 'Quiz',
	service: 'Service',
	realestate: 'RealEstateListing',
	menu: 'Menu',
	tvseries: 'TVSeries',
	tvepisode: 'TVEpisode',
	medical: 'MedicalWebPage',
	music: 'MusicAlbum',
	glossary: 'DefinedTermSet',
	podcastseries: 'PodcastSeries'
};

/* itemtype sharpening — narrows a card to an allowlisted subtype of its base type.
   Never verbatim data: this value lands in an itemtype. Docs: docs/schema.md § Subtypes */
export const SUBTYPES = {
	article: new Set(['BlogPosting', 'TechArticle', 'APIReference', 'ScholarlyArticle', 'Report', 'SatiricalArticle', 'AdvertiserContentArticle']),
	business: new Set(['Restaurant', 'CafeOrCoffeeShop', 'Bakery', 'BarOrPub', 'FastFoodRestaurant', 'IceCreamShop', 'Winery', 'Brewery', 'Distillery', 'Store', 'Hotel', 'Resort', 'BedAndBreakfast', 'Motel', 'Hostel', 'Campground', 'BeautySalon', 'DaySpa', 'HealthClub', 'AutoRepair', 'AutoDealer', 'AutoRental', 'GasStation', 'Dentist', 'MedicalClinic', 'Pharmacy', 'Physician', 'RealEstateAgent', 'TravelAgency', 'Library', 'GovernmentOffice']),
	event: new Set(['SportsEvent', 'MusicEvent', 'TheaterEvent', 'ScreeningEvent', 'ComedyEvent', 'DanceEvent', 'ExhibitionEvent', 'FoodEvent', 'LiteraryEvent', 'BusinessEvent', 'EducationEvent', 'ChildrensEvent', 'SocialEvent', 'SaleEvent', 'Festival', 'Hackathon', 'PublicationEvent', 'CourseInstance']),
	location: new Set(['TouristAttraction', 'TouristDestination', 'LandmarksOrHistoricalBuildings', 'Accommodation', 'Apartment', 'House', 'SingleFamilyResidence', 'Room', 'Suite', 'Residence', 'ApartmentComplex', 'GatedResidenceCommunity', 'CivicStructure', 'Park', 'Beach', 'Campground', 'Church', 'Museum', 'Airport']),
	news: new Set(['ReportageNewsArticle', 'OpinionNewsArticle', 'AnalysisNewsArticle', 'BackgroundNewsArticle', 'ReviewNewsArticle']),
	organization: new Set(['NGO', 'Corporation', 'OnlineStore', 'OnlineBusiness', 'EducationalOrganization', 'School', 'CollegeOrUniversity', 'GovernmentOrganization', 'NewsMediaOrganization', 'MedicalOrganization', 'ResearchOrganization', 'PerformingGroup', 'MusicGroup', 'SportsOrganization', 'SportsTeam', 'Airline', 'LibrarySystem', 'WorkersUnion', 'PoliticalParty', 'FundingScheme', 'Consortium', 'Project']),
	product: new Set(['ProductGroup', 'ProductModel', 'IndividualProduct', 'Vehicle', 'Car', 'Motorcycle', 'Drug', 'DietarySupplement']),
	social: new Set(['DiscussionForumPosting', 'BlogPosting', 'LiveBlogPosting'])
};

/* Own-key test, not truthiness: a bare `SCHEMA_TYPES[x]` lets inherited Object.prototype
   keys ("constructor", "toString", "__proto__") through. Docs: docs/schema.md § Subtypes */
const baseType = (fields) => Object.hasOwn(SCHEMA_TYPES, fields?.schemaType) ? fields.schemaType : 'content';

/* `subtype` beats `businessType` because the latter is only the pre-`subtype` business-only
   spelling, kept resolving for existing content. Takes raw fields and normalises the base type
   itself: every other itemtype producer (articles/build.js, demo/render.html) calls THIS. */
export const resolveItemtype = (fields) => {
	const type = baseType(fields);
	const wanted = fields.details?.subtype || (type === 'business' ? fields.details?.businessType : null);
	return wanted && SUBTYPES[type]?.has(wanted) ? wanted : SCHEMA_TYPES[type];
};

/* schema.org EventAttendanceModeEnumeration stems */
const ATTENDANCE_MODES = new Set(['Offline', 'Online', 'Mixed']);

/* schema.org BookFormatType members — bookFormat emits only for these */
const BOOK_FORMATS = new Set(['Hardcover', 'Paperback', 'EBook', 'AudiobookFormat', 'GraphicNovel']);

/* review itemReviewed types — Organization/Service make the review a testimonial */
const REVIEWED_TYPES = new Set(['Product', 'Organization', 'Service']);

/* ── enumeration / itemtype allowlists for the markup-first types.
   Every one of these lands in a schema.org URL or an itemtype, so none may ever
   be interpolated verbatim — same discipline as SUBTYPES/BOOK_FORMATS. ── */

/* schema.org TierBenefitEnumeration — the complete set is these four. All four are
   valid vocabulary; Google reads only Points and Price, so a tier whose ONLY benefits
   are Returns/Shipping is ineligible. Docs: docs/schema.md § Loyalty programme */
const TIER_BENEFITS = new Set(['TierBenefitLoyaltyPoints', 'TierBenefitLoyaltyPrice', 'TierBenefitLoyaltyReturns', 'TierBenefitLoyaltyShipping']);
/* schema.org RestrictedDiet members — MenuItem.suitableForDiet takes these by URL */
const RESTRICTED_DIETS = new Set(['DiabeticDiet', 'GlutenFreeDiet', 'HalalDiet', 'HinduDiet', 'KosherDiet', 'LowCalorieDiet', 'LowFatDiet', 'LowLactoseDiet', 'LowSaltDiet', 'VeganDiet', 'VegetarianDiet']);
/* RealEstateListing.mainEntity — the ACCOMMODATION subtree only. Residence and
   ApartmentComplex are Place, not Accommodation: the block emits yearBuilt, whose
   domain is Accommodation alone, so neither could carry it. (ApartmentComplex is in
   numberOfBedrooms' domain and nothing else here — not worth a per-property gate.) */
const RESIDENCE_TYPES = new Set(['Accommodation', 'Apartment', 'House', 'SingleFamilyResidence', 'Suite', 'Room']);
/* schema.org MusicAlbumProductionType / MusicAlbumReleaseType members */
const ALBUM_PRODUCTION_TYPES = new Set(['CompilationAlbum', 'DJMixAlbum', 'DemoAlbum', 'LiveAlbum', 'MixtapeAlbum', 'RemixAlbum', 'SoundtrackAlbum', 'SpokenWordAlbum', 'StudioAlbum']);
const ALBUM_RELEASE_TYPES = new Set(['AlbumRelease', 'BroadcastRelease', 'EPRelease', 'SingleRelease']);
/* schema.org MedicalSpecialty members — WebPage.specialty takes a Specialty */
const MEDICAL_SPECIALTIES = new Set(['Anesthesia', 'Cardiovascular', 'CommunityHealth', 'Dentistry', 'Dermatologic', 'DietNutrition', 'Emergency', 'Endocrine', 'Gastroenterologic', 'Genetic', 'Geriatric', 'Gynecologic', 'Hematologic', 'Infectious', 'LaboratoryScience', 'Midwifery', 'Musculoskeletal', 'Neurologic', 'Nursing', 'Obstetric', 'Oncologic', 'Optometric', 'Otolaryngologic', 'Pathology', 'Pediatric', 'PharmacySpecialty', 'Physiotherapy', 'PlasticSurgery', 'Podiatric', 'PrimaryCare', 'Psychiatric', 'PublicHealth', 'Pulmonary', 'Radiography', 'Renal', 'RespiratoryTherapy', 'Rheumatologic', 'SpeechPathology', 'Surgical', 'Toxicologic', 'Urologic']);
/* the three MedicalEntity shapes a MedicalWebPage may be `about` */
const MEDICAL_ABOUT_TYPES = new Set(['MedicalCondition', 'Drug', 'MedicalProcedure']);
/* MedicalCondition aspect property → the type its value must carry */
const MEDICAL_ASPECTS = { signOrSymptom: 'MedicalSignOrSymptom', riskFactor: 'MedicalRiskFactor', possibleTreatment: 'MedicalTherapy' };
/* medicalAudience takes the TYPE MedicalAudience (subtype Patient) — NOT the
   similarly named MedicalAudienceType enumeration (Clinician/MedicalResearcher) */
const MEDICAL_AUDIENCES = new Set(['MedicalAudience', 'Patient']);

/* Quiz question shapes. `Question` accepts suggestedAnswer AND acceptedAnswer at
   once, so a Quiz can be a flashcard deck (one acceptedAnswer, revealed) or a graded
   multiple-choice set (several suggestedAnswer + the acceptedAnswer). The format is
   an EXPLICIT field, not inferred from the presence of options, and it picks both
   itemprop values. schema.org documents exactly three eduQuestionType spellings —
   "Multiple choice", "Open ended", "Flashcard". Docs: docs/schema.md § Quiz */
const QUIZ_FORMATS = {
	flashcard: { question: 'Flashcard', resource: 'Flashcard' },
	'multiple-choice': { question: 'Multiple choice', resource: 'Practice problem' }
};
/* absent/unknown falls back to the flashcard shape — resolved in ONE place, so the
   deck (DETAILS.quiz) and the flip card (REVEAL_FACES.quiz) cannot disagree */
const quizFormat = (d) => Object.hasOwn(QUIZ_FORMATS, d?.format) ? d.format : 'flashcard';

/* Fallback when a card references no preset (or an unknown one).
   Real presets live in data/card.presets.json — instances of the
   card-preset model (cms/baseline/models/card-preset.schema.json). */
const DEFAULT_PRESET = { element: 'ui-card', variant: 'col', media: 'asr(16/9)' };

/* itemtypes whose viewCount is a WatchAction (moving content); all others get ViewAction */
const WATCHABLE = new Set(['VideoObject', 'Movie', 'PodcastEpisode']);

/* headline itemprop: job → title, article/news → headline, rest → name */
const HEADLINE_PROP = { job: 'title', article: 'headline', news: 'headline' };
/* …but a subtype can want a different property than its base: Google documents
   `headline` for DiscussionForumPosting and says it "is not recommended for a
   SocialMediaPosting", so social's plain spelling keeps `name`. Keyed by RESOLVED
   itemtype, consulted first. Docs: docs/schema.md § Subtypes */
const HEADLINE_PROP_BY_ITEMTYPE = new Map([['DiscussionForumPosting', 'headline']]);
const headlineProp = (fields, type) => HEADLINE_PROP_BY_ITEMTYPE.get(resolveItemtype(fields)) || HEADLINE_PROP[type] || 'name';
/* summary itemprop: review → reviewBody, quote/announcement/social → text, rest → description */
const SUMMARY_PROP = { review: 'reviewBody', quote: 'text', announcement: 'text', social: 'text' };
/* eyebrow itemprop — only where a sensible property exists AND no `details` field already
   owns it: job's eyebrow is display text, `industry` is details.industry. Docs: schema.md § Job.
   Exported for render.test.js, which re-adds the removed `job: 'industry'` entry to prove the
   duplicate-property guard below still holds when this map grows. */
export const EYEBROW_PROP = { article: 'articleSection', news: 'articleSection', product: 'category', recipe: 'recipeCategory', course: 'about', video: 'genre', movie: 'genre', book: 'genre', tvseries: 'genre', music: 'genre' };
/* published itemprop: JobPosting/SpecialAnnouncement use datePosted, VideoObject uploadDate */
const PUBLISHED_PROP = { job: 'datePosted', announcement: 'datePosted', video: 'uploadDate' };
/* datePosted is typed Date, so a timestamp is out of range; uploadDate takes a DateTime */
const dateOnly = (value) => (/^\d{4}-\d{2}-\d{2}T/.test(value) ? value.slice(0, 10) : value);
/* preset headingTag allowlist — heading LEVEL is placement, so it lives on the preset */
const HEADING_TAGS = new Set(['h2', 'h3', 'h4', 'h5']);

/* types whose `body` is the article text → wrapped in itemprop="articleBody" */
const ARTICLE_BODY_TYPES = new Set(['article', 'news']);
/* types where the image/video belongs to another scope — skip itemprop */
const NO_IMAGE_PROP = new Set(['review', 'contact']);
/* types whose ROOT is the VideoObject — media props emit at root, never a nested scope */
const ROOT_VIDEO_TYPES = new Set(['video']);
/* Person has no keywords property. Intangible-rooted types (JobPosting, Offer,
   Reservation, ContactPoint, ItemList, Observation, MemberProgram, Service) have
   none either — null = visible chips only, no itemprop */
const TAGS_PROP = { profile: 'knowsAbout', job: null, membership: null, booking: null, contact: null, comparison: null, statistic: null, loyalty: null, service: null };
/* byline itemprop — a quote's people are its creators, everyone else's are authors */
const bylineProp = (type) => type === 'quote' ? 'creator' : 'author';

/* ── one item, one value per property ──
   Two emitters reach the same root-scope itemprop: the ENVELOPE (eyebrow, headline,
   summary, byline, tags, dates — driven by the maps above) and the type's own DETAILS
   renderer. A record filling both fields declares one property twice with two values.
   The envelope wins, and DETAILS asks first. Derived from the maps rather than a
   hand-written pair list, so adding an envelope itemprop cannot silently resurrect a
   collision. Docs: docs/schema.md § One property, one value */
const envelopeProps = (fields, type, { eyebrow = true } = {}) => {
	const props = new Set();
	if (eyebrow && fields.eyebrow && EYEBROW_PROP[type]) props.add(EYEBROW_PROP[type]);
	if (fields.headline && type !== 'quote') props.add(headlineProp(fields, type));
	if (fields.summary) props.add(SUMMARY_PROP[type] || 'description');
	if (fields.published) props.add(PUBLISHED_PROP[type] || 'datePublished');
	if (fields.modified) props.add('dateModified');
	if (fields.authors?.length) props.add(bylineProp(type));
	if (fields.tags?.length) {
		const tagProp = type in TAGS_PROP ? TAGS_PROP[type] : 'keywords';
		if (tagProp) props.add(tagProp);
	}
	return props;
};
/* the default for a DETAILS renderer called without a claim set — claims nothing */
const NO_PROPS = new Set();

/* ── string helpers (all data flows through esc) ── */

const esc = (value) => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

/* attribute string: null/false skipped, true = bare attribute, values escaped */
const attrs = (obj) => Object.entries(obj)
	.filter(([, value]) => value != null && value !== false && value !== '')
	.map(([key, value]) => value === true ? ` ${key}` : ` ${key}="${esc(value)}"`)
	.join('');

/* ── image pipeline (SSR srcset) — armed per renderCard() call via options.images.
   Off by default: /cdn-cgi/image/ only resolves on the Cloudflare zone and a failed
   srcset candidate does NOT fall back to src. Docs: docs/media.md § srcset ── */
const IMG_DEFAULTS = { breakpoints: [240, 320, 480, 720, 1200], format: 'auto', quality: 80, fit: 'cover', base: '' };
let IMG = null;
const setImages = (images) => {
	IMG = images ? { ...IMG_DEFAULTS, ...images, base: images.cdnBase ?? images.base ?? '' } : null;
};
/* demo affordance (options.typeChip): a <ui-chip data-type> naming the card's resolved
   schema.org type on each frame — top end unless other furniture already claims te */
let TYPE_CHIP = false;
/* same eligibility as ui-media-srcset.js #eligible(): ROOT-relative local paths only —
   a page-relative src would transform into the wrong zone path (404, no src fallback) */
const cdnEligible = (src) => !!(IMG && src && src.startsWith('/') && !src.startsWith('//'));
/* fixed-size images (thumbs, avatars): square 1x/2x pair instead of a width ladder */
const fixedSrcset = (src, size) => {
	if (!cdnEligible(src)) return null;
	const t = (w) => buildCfUrl(src, { format: IMG.format, quality: IMG.quality, fit: IMG.fit, width: w, height: w }, IMG.base);
	return `${t(size)} 1x, ${t(size * 2)} 2x`;
};
/* sizes: `auto` is spec-invalid on eager images; Safari ignores it, so lazy gets the fallback list too */
const sizesFor = (eager) => !IMG ? null : eager ? IMG.sizes || null : IMG.sizes ? `auto, ${IMG.sizes}` : 'auto';
/* carousel thumbnail: ONE narrow URL (the marker is ~2-4rem), CDN when eligible else the
   source itself — a ::scroll-marker background, so there is no srcset to hand it. The
   result lands inside url('…') in an inline style, where esc() does not help: quotes,
   parens and semicolons would end the value, so they are dropped rather than escaped. */
const CSS_URL_UNSAFE = /['"();\\]/g;
const thumbUrl = (src, width = 160) =>
	String(cdnEligible(src) ? buildCfUrl(src, { format: IMG.format, quality: IMG.quality, width }, IMG.base) : src)
		.replace(CSS_URL_UNSAFE, '');

const meta = (prop, content) =>
	content == null || content === '' ? '' : `<meta itemprop="${esc(prop)}" content="${esc(content)}">`;

const scope = (prop, type) =>
	` itemprop="${esc(prop)}" itemscope itemtype="${SCHEMA + type}"`;

/* Inline-rich text: plain string or UCF richtext object. Escapes everything, then
   re-allows an ALLOWLIST: <b>/<em>/<code> (attribute-free, so an escaped
   `<em onmouseover=…>` can never match) and <ui-gradient-text>
   (@browser.style/gradient-text). The gradient element accepts only
   animate="slide|breathe" — never a free attribute string. Docs: docs/content.md */
const INLINE_TAGS = /&lt;(\/?)(b|em|code)&gt;|&lt;(\/?)ui-gradient-text(?: animate=&quot;(slide|breathe)&quot;)?&gt;|&lt;(\/?)high-light((?: (?:fill|ink)=&quot;[#\w(),.%\s-]{1,32}&quot;| variant=&quot;(?:underline|strike)&quot;){0,3})&gt;/g;
/* high-light's attribute payload is re-validated per pair — the group match above only
   bounds the shape, this rebuilds it from an allowlist so nothing else can ride along */
const HL_ATTR = /(fill|ink|variant)=&quot;([#\w(),.%\s-]{1,32})&quot;/g;
const highLightAttrs = (raw) => {
	let out = '';
	for (const [, name, value] of String(raw || '').matchAll(HL_ATTR)) {
		if (name === 'variant' && !/^(underline|strike)$/.test(value)) continue;
		out += ` ${name}="${esc(value)}"`;
	}
	return out;
};
/* An UNCLOSED allowlisted tag joins the parser's list of active formatting elements and
   is reconstructed inside every element that follows, so one missing `</em>` italicises
   the rest of the page. Unbalanced input therefore renders fully escaped: the phrase
   loses its emphasis and nothing else moves. Docs: docs/content.md § Inline markup */
const INLINE_PAIRS = /<(\/?)(b|em|code|ui-gradient-text|high-light)\b[^>]*>/g;
const balancedInline = (html) => {
	const open = new Map();
	for (const [, close, tag] of html.matchAll(INLINE_PAIRS)) {
		const depth = (open.get(tag) || 0) + (close ? -1 : 1);
		if (depth < 0) return false;
		open.set(tag, depth);
	}
	for (const depth of open.values()) if (depth !== 0) return false;
	return true;
};
const renderInline = (value) => {
	const text = typeof value === 'string' ? value : value?.$richtext ? value.content : value ?? '';
	const escaped = esc(text);
	const rich = escaped.replace(INLINE_TAGS, (match, bSlash, bTag, gSlash, animate, hSlash, hAttrs) => {
		if (bTag) return `<${bSlash}${bTag}>`;
		if (hSlash !== undefined) return `<${hSlash}high-light${hSlash ? '' : highLightAttrs(hAttrs)}>`;
		return `<${gSlash}ui-gradient-text${!gSlash && animate ? ` animate="${animate}"` : ''}>`;
	});
	return balancedInline(rich) ? rich : escaped;
};

/* plain text from a possibly-rich headline (for aria/meta contexts) */
const plain = (value) => {
	const text = typeof value === 'string' ? value : value?.$richtext ? value.content : value ?? '';
	return String(text).replace(/<[^>]+>/g, '');
};

/* Display formatters. Both fall through to raw author data, and every call site
   interpolates them into a TEXT NODE, so they return HTML-safe strings — do NOT
   esc() their output again. Docs: ui/card/AGENTS.md § conventions */
const num = (value) => esc(typeof value === 'number' ? value.toLocaleString('en-US') : value);

/* display price via Intl — machine values stay raw in content= attrs */
const CURRENCY_CODE = /^[A-Za-z]{3}$/;
const fmtPrice = (currency, value) => {
	if (value == null || value === '') return '';
	const number = Number(value);
	/* Intl throws RangeError on any code that is not three ASCII letters — one typo'd
	   currency must never crash a whole page render in an engine that degrades */
	if (!CURRENCY_CODE.test(currency || '') || Number.isNaN(number)) return esc(`${currency || ''} ${value}`.trim());
	return esc(new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: Number.isInteger(number) ? 0 : 2 }).format(number));
};

/* A priced row: the machine value on a <meta>, the human string as the text node.
   Google's price must carry no currency symbol and no thousands separator, and the
   validator reads the TEXT node — `<data itemprop="price" value="279">$279</data>`
   survives only on price's Text arm. Same shape as loyalty's MonetaryAmount rows.
   fmtPrice() is already escaped; do NOT esc() this. docs/schema.md § Price */
const priceValue = (currency, value, prop = 'price') =>
	value == null || value === '' ? '' : meta(prop, value) + fmtPrice(currency, value);

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

/* preset.styles → style attribute value. Only CSS custom properties pass. */
const styleAttr = (styles) => {
	const rules = Object.entries(styles || {})
		.filter(([key]) => key.startsWith('--'))
		.map(([key, value]) => `${key}: ${value}`);
	return rules.length ? rules.join('; ') : null;
};

/* star rating row — part "rating". `prop: null` opens the scope with NO itemprop,
   which is what makes microdata read it as a SECOND TOP-LEVEL ITEM rather than a
   property of the enclosing card — the EmployerAggregateRating shape. `lead` is
   markup placed inside the scope ahead of the metas (itemReviewed); the two label
   options override the star-row wording. Docs: docs/schema.md § Employer rating */
const ratingPart = (prop, ratingType, rating, { lead = '', srLabel = null, visibleLabel = null } = {}) => {
	if (!rating?.value) return '';
	const max = rating.max ?? 5;
	/* built from already-escaped pieces — num() escapes, so no outer esc() here */
	const label = srLabel ?? `Rated ${esc(rating.value)} out of ${esc(max)} stars${rating.count ? ` from ${num(rating.count)} ratings` : ''}`;
	const visible = visibleLabel ?? `${esc(rating.value)} / ${esc(max)}${rating.count ? ` (${num(rating.count)} ratings)` : ''}`;
	/* @browser.style/rating — a disabled range input masked with stars. It is
	   DECORATIVE (aria-hidden): a role="img" wrapper may not contain an input, so
	   the <span> carries the accessible text and the metas carry the machine value */
	return `<div data-part="rating"${prop ? scope(prop, ratingType) : ` itemscope itemtype="${SCHEMA + ratingType}"`}>
		${lead}${meta('ratingValue', rating.value)}
		${rating.count != null ? meta('ratingCount', rating.count) : ''}
		${meta('bestRating', max)}${meta('worstRating', 1)}
		<input class="ui-rating" type="range" min="1" max="${esc(max)}" value="${esc(rating.value)}" step="0.01" disabled aria-hidden="true">
		<span data-sr>${label}</span>
		<span aria-hidden="true">${visible}</span>
	</div>`;
};

/* check/ordered list — part "list" */
/* contact button — schema.org email is Text, but itemprop on an <a> reads the
   href (mailto:…), so email rides a <meta> and the link stays plain */
const contactLink = ({ type, value, label }, primary = false) => {
	const href = type === 'email' ? `mailto:${value}` : type === 'phone' ? `tel:${value.replace(/\s/g, '')}` : value;
	const prop = type === 'phone' ? 'telephone' : type === 'email' ? null : 'url';
	return `${type === 'email' ? meta('email', value) : ''}<a class="ui-button"${primary ? ' data-variant="accent"' : ''}${prop ? ` itemprop="${prop}"` : ''} href="${esc(href)}">${esc(label || value)}</a>`;
};

/* map link — `geo:lat,lng` (RFC 5870) is the standards answer and hands off to the
   OS map app on Android/desktop Linux, but iOS Safari and desktop browsers ignore
   it. The https Apple/Google form is what actually opens an app everywhere, so the
   href is author-supplied (details.geo.url) and geo: is the fallback. Docs: card.md */
const mapUrl = (geo) => geo?.url || (geo?.latitude != null && geo?.longitude != null
	? `geo:${geo.latitude},${geo.longitude}`
	: null);

/* map EMBED src — the frame's iframe, not the "Open in Maps" href above.
   Coordinates are validated as NUMBERS before they reach a URL; esc() is the second
   layer, never the first. Docs: docs/media.md § Map */
const MAP_ZOOM = { min: 1, max: 20, default: 16 };
const mapCoords = (geo, item = {}) => {
	const lat = Number(item.latitude ?? geo?.latitude);
	const lon = Number(item.longitude ?? geo?.longitude);
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
	if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
	const zoom = Math.round(Number(item.zoom));
	return { lat, lon, zoom: Number.isFinite(zoom) ? Math.min(Math.max(zoom, MAP_ZOOM.min), MAP_ZOOM.max) : MAP_ZOOM.default };
};

/* bbox is (west, south, east, north); the latitude cosine keeps the box square on the
   ground rather than in degrees, which otherwise flattens it towards the poles */
const osmEmbed = ({ lat, lon, zoom }) => {
	const lonHalf = 180 / 2 ** zoom;
	const latHalf = lonHalf * Math.cos(lat * Math.PI / 180);
	const box = [lon - lonHalf, lat - latHalf, lon + lonHalf, lat + latHalf].map((n) => n.toFixed(6));
	return `https://www.openstreetmap.org/export/embed.html?bbox=${box.join(',')}&layer=mapnik&marker=${lat},${lon}`;
};

/* google needs an API key, apple a MapKit JWT — neither can be built from coordinates
   alone, so an unkeyed provider falls back to OSM rather than emitting a dead frame */
const googleEmbed = ({ lat, lon, zoom }, key) =>
	key ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${lat},${lon}&zoom=${zoom}` : null;

const MAP_PROVIDERS = { osm: (c) => osmEmbed(c), google: (c, options) => googleEmbed(c, options.key) };

/* hasMap is a Place property — emit it only where the resolved itemtype descends from
   Place. Other types still get the frame, just unmarked. Docs: docs/schema.md § Map */
const HAS_MAP_TYPES = new Set(['business', 'location']);

const mapFrame = (item, fields, type) => {
	const coords = mapCoords(fields.details?.geo, item);
	const src = item.src || (coords && (MAP_PROVIDERS[item.provider]?.(coords, fields.details?.map || {}) || osmEmbed(coords)));
	if (!src) return '';
	const title = item.alt || `Map of ${plain(fields.headline) || 'this location'}`;
	return `<iframe${attrs({ src, title, loading: 'lazy', itemprop: HAS_MAP_TYPES.has(type) ? 'hasMap' : null })}></iframe>`;
};

/* eligibleDuration is QuantitativeValue-typed — expand ISO P<n><unit>, not Duration text */
const DURATION_UNIT = { D: 'DAY', W: 'WEE', M: 'MON', Y: 'ANN' };
const eligibleDuration = (iso) => {
	const m = /^P(\d+)([DWMY])$/.exec(iso || '');
	return m ? `<span${scope('eligibleDuration', 'QuantitativeValue')} hidden>${meta('value', m[1])}${meta('unitCode', DURATION_UNIT[m[2]])}</span>` : '';
};

/* "Mo-Fr 07:00-18:00" → hidden OpeningHoursSpecification; unparsable strings stay flat-only */
const DAY_NAMES = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' };
const DAY_ORDER = Object.keys(DAY_NAMES);
const hoursSpec = (spec) => {
	const m = /^([A-Z][a-z])(?:-([A-Z][a-z]))?\s+(\d\d:\d\d)-(\d\d:\d\d)$/.exec(spec || '');
	if (!m || !DAY_NAMES[m[1]] || (m[2] && !DAY_NAMES[m[2]])) return '';
	const days = DAY_ORDER.slice(DAY_ORDER.indexOf(m[1]), (m[2] ? DAY_ORDER.indexOf(m[2]) : DAY_ORDER.indexOf(m[1])) + 1);
	return days.length
		? `<span${scope('openingHoursSpecification', 'OpeningHoursSpecification')} hidden>${days.map((day) => meta('dayOfWeek', SCHEMA + DAY_NAMES[day])).join('')}${meta('opens', m[3])}${meta('closes', m[4])}</span>`
		: '';
};

/* machine + human opening hours — flat openingHours meta AND the structured spec per entry */
/* one tabular row per entry — days/time read from the MACHINE string so a single
   day ("Th 09:00-16:00") and a range ("Mo-We 09:00-17:00") both work; explicit
   days/time keys win for locales the derivation can't spell */
const DAY_ABBR = { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun' };
const hoursRow = (entry) => {
	if (entry.days || entry.time) return { days: entry.days || '', time: entry.time || '' };
	const m = /^([A-Z][a-z])(?:-([A-Z][a-z]))?\s+(\d\d:\d\d)-(\d\d:\d\d)$/.exec(entry.schema || '');
	if (!m) return { days: '', time: entry.display || '' };
	const clock = (time) => time.replace(/^0/, '');
	return {
		days: m[2] ? `${DAY_ABBR[m[1]]}–${DAY_ABBR[m[2]]}` : DAY_ABBR[m[1]],
		time: `${clock(m[3])}–${clock(m[4])}`
	};
};

/* opening hours as a two-column <dl>. Each row carries a structured
   OpeningHoursSpecification (valid on Place and below) plus, where the type allows
   it, the flat openingHours string — that one is a LocalBusiness/CivicStructure
   property, so a plain Place (location) must pass flat: false */
const hoursPart = (hours, { flat = true } = {}) =>
	hours?.length
		? `<dl data-part="hours">${hours.map((entry) => {
			const { days, time } = hoursRow(entry);
			return `<dt>${esc(days)}</dt><dd>${flat ? meta('openingHours', entry.schema) : ''}${hoursSpec(entry.schema)}${esc(time)}</dd>`;
		}).join('')}</dl>`
		: '';

/* GeoCoordinates — machine-only (the visible affordance is the map link) */
const geoPart = (geo) =>
	geo?.latitude != null || geo?.longitude != null
		? `<div${scope('geo', 'GeoCoordinates')} hidden>${meta('latitude', geo.latitude)}${meta('longitude', geo.longitude)}</div>`
		: '';

/* Organization has no geo property (Place does) — coordinates ride location → Place */
const geoViaPlace = (geo) =>
	geo?.latitude != null || geo?.longitude != null
		? `<div${scope('location', 'Place')} hidden>${geoPart(geo)}</div>`
		: '';

/* PostalAddress as stacked lines: street · postal + locality · country.
   A 2-letter country code stays machine-only — "DK" reads as noise in a card */
const addressPart = (address, prop = 'address') => {
	if (!address) return '';
	const country = address.addressCountry || '';
	const lines = [
		address.streetAddress ? `<span itemprop="streetAddress">${esc(address.streetAddress)}</span>` : '',
		[
			address.postalCode ? `<span itemprop="postalCode">${esc(address.postalCode)}</span>` : '',
			address.addressLocality ? `<span itemprop="addressLocality">${esc(address.addressLocality)}</span>` : ''
		].filter(Boolean).join(' '),
		country.length > 2 ? `<span itemprop="addressCountry">${esc(country)}</span>` : ''
	].filter(Boolean).map((line) => `<span>${line}</span>`).join('');
	return `<address data-part="address"${scope(prop, 'PostalAddress')}>${lines}${country.length > 2 ? '' : meta('addressCountry', country)}</address>`;
};

const listPart = (items, { ordered = false, itemprop = null, crossed = false } = {}) =>
	items?.length
		? `<${ordered ? 'ol' : 'ul'} data-part="list"${crossed ? ' data-variant="crossed"' : ''}${itemprop ? ` itemprop="${esc(itemprop)}"` : ''}>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`
		: '';

/* author image via @browser.style/avatar — initials fallback when no image */
const initials = (name) => {
	const parts = (name || '').trim().split(/\s+/).filter(Boolean);
	return parts.length ? (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase() : '';
};
/* loading/decoding are unconditional — an avatar is always below the fold, and deferring it
   has nothing to do with whether the srcset pipeline is armed. Only srcset is IMG-gated. */
const avatarPart = ({ avatar, name }) => avatar
	? `<ui-avatar><img src="${esc(avatar)}" alt=""${attrs({ srcset: IMG ? fixedSrcset(avatar, 64) : null, loading: 'lazy', decoding: 'async' })}></ui-avatar>`
	: (name ? `<ui-avatar><abbr aria-hidden="true">${esc(initials(name))}</abbr></ui-avatar>` : '');

/* byline rows from authors[] — the dateline rides the FIRST author as a second
   line (avatar · name/role over date · reading time), the common editorial shape */
const byline = (authors, prop = 'author', dateline = '') =>
	(authors || []).map((author, index) => `<address data-part="byline"${scope(prop, 'Person')}>
		${avatarPart(author)}
		<span data-part="byline-who"><span itemprop="name">${esc(author.name)}</span>${author.role ? `<span itemprop="jobTitle">${esc(author.role)}</span>` : ''}</span>${index === 0 ? dateline : ''}
	</address>`).join('');

/* screen credits — director row + one actor scope per name. Shared by movie/
   tvseries/tvepisode; the label carries its own punctuation because a series is
   "Created and directed by" where a film is "Director:". `actor` accepts a Person
   OR a PerformingGroup; Person is the safe default for a bare name. */
const creditsPart = (d) =>
	(d.director?.name ? `<p data-part="meta"${scope('director', 'Person')}>${esc(d.director.label || 'Director:')} <span itemprop="name">${esc(d.director.name)}</span></p>` : '')
	+ (d.actors?.length ? `<p data-part="meta">Starring: ${d.actors.map((name) => `<span${scope('actor', 'Person')}><span itemprop="name">${esc(name)}</span></span>`).join(', ')}</p>` : '');

/* quote part via @browser.style/quote — variant on the <ui-quote> wrapper styles it, data-part stays the card hook */
const quotePart = (text, { itemprop = 'text', variant = null, cite = null } = {}) =>
	`<ui-quote data-part="quote"${attrs({ variant })}><blockquote itemprop="${esc(itemprop)}"><q>${esc(text)}</q>${cite ? `<cite>${esc(cite)}</cite>` : ''}</blockquote></ui-quote>`;

/* nested <ui-accordion> — cq-box is hand-authored so the CSS-only form styles without JS */
const accordion = (group, items, variant = null, hostAttrs = '') =>
	`<ui-accordion${attrs({ group, variant })}${hostAttrs}><cq-box>${items.map(({ summary, body, scopeAttrs = '', icon = 'plus-minus' }) =>
		`<details name="${esc(group)}"${scopeAttrs}>
			<summary>${summary}<ui-icon type="${esc(icon)}"></ui-icon></summary>
			${body}
		</details>`
	).join('')}</cq-box></ui-accordion>`;

/* VideoObject metas for a native <video> item (placed INSIDE the element — valid fallback content) */
const videoMetas = (item, src) =>
	meta('name', item.alt) + meta('contentUrl', src) + meta('thumbnailUrl', item.poster)
	+ meta('uploadDate', item.uploadDate) + meta('duration', item.duration) + meta('description', item.description);

/* provider embed URLs (shared by the nested VideoObject block and root-video metas) */
const embedInfo = (item) => ({
	embedUrl: item.mediaType === 'youtube'
		? `https://www.youtube.com/embed/${item.src}`
		: `https://player.vimeo.com/video/${item.src}`,
	thumb: item.mediaType === 'youtube'
		? `https://i.ytimg.com/vi/${item.src}/hqdefault.jpg`
		: item.poster
});

/* VideoObject block for a provider embed (hidden — appended to the content column) */
const embedVideoObject = (item) => {
	const { embedUrl, thumb } = embedInfo(item);
	return `<div${scope('video', 'VideoObject')} hidden>
		${meta('name', item.alt)}${meta('embedUrl', embedUrl)}${meta('thumbnailUrl', thumb)}${meta('uploadDate', item.uploadDate)}
	</div>`;
};

/* root-VideoObject card: same media facts, but as ROOT props (name/description ride the envelope) */
const rootEmbedMetas = (item) => {
	const { embedUrl, thumb } = embedInfo(item);
	return meta('embedUrl', embedUrl) + meta('thumbnailUrl', thumb) + meta('uploadDate', item.uploadDate) + meta('duration', item.duration);
};
const rootVideoMetas = (item, src) =>
	meta('contentUrl', src) + meta('thumbnailUrl', item.poster) + meta('uploadDate', item.uploadDate) + meta('duration', item.duration);

/* ── media column ── */

/* ── overlay furniture (chip / sticker / save / play / beacon) ──
   Content = the furniture object (text/semantics only). Look = the preset's
   media= tokens; each item's optional style= override is appended and, for a
   token that collides with the preset on the same axis, replaces it (the CSS
   matches media= tokens by substring, so precedence is source-order, not token
   order — mergeMediaTokens strips the preset's same-axis token so the override
   always wins). */

/* The overlay stems the renderer emits: the five FURNITURE elements (chip/sticker/
   save/play/beacon), plus the marquee BAND. The band is a different manifest axis on
   purpose (full-width strip, `top`/`bot` instead of the 9-grid) but it has the exact
   same merge problem — CSS resolves media= by source order, not token order — so it
   joins the same override table. Deprecated stems are excluded from the table (the
   guard is currently a no-op — ply() was folded into play() and removed in v5, so no
   furniture stem has a deprecated spelling left and token strings reach the merge
   verbatim, with no stem-normalization step). */
const FURNITURE = Object.entries(TOKENS.attributes.media.tokens)
	.filter(([, entry]) => entry.axis === 'furniture' || entry.axis === 'band');
const FURNITURE_TOKEN = new RegExp(`^(${FURNITURE.filter(([, entry]) => !entry.deprecated).map(([stem]) => stem).join('|')})\\(([^)]*)\\)$`);

/* arg value → merge axis, unioned from the manifest across the furniture stems. The
   class list is PINNED: adopting a new manifest arg class changes which preset tokens
   an override displaces, so it is a deliberate edit, not a silent data pickup.
   (`pos` = the 9-grid · `hue` = the 8-key palette + its accepted aliases · `size` — xs is
   beacon-only, play() sizes live here too · `anim`/`face` are beacon's, `disc` the shared
   radius vocabulary: beacon(non) turns solid's default blink off and stays in `disc` ·
   `mode` = the pale/muted plate tones + the marquee's rpt/seam/fade play modes ·
   `flag` = sticker(fit)'s text-fit typesetting. The marquee's `value` class —
   direction/speed/gap — is deliberately NOT here: those compose rather than
   displace, so each one falls through to exact-match replacement.) */
const MERGE_CLASSES = ['pos', 'hue', 'size', 'variant', 'shape', 'anim', 'face', 'disc', 'mode', 'flag'];
const FURNITURE_AXIS = Object.fromEntries(MERGE_CLASSES.map((cls) => [cls, new Set()]));
for (const [, entry] of FURNITURE) {
	for (const cls of MERGE_CLASSES)
		for (const value of entry.args[cls] || []) if (!value.includes('<')) FURNITURE_AXIS[cls].add(value);
	/* an accepted alias classifies with its canonical — dark→black is a hue */
	for (const [alias, canonical] of Object.entries(entry.argAliases))
		for (const cls of MERGE_CLASSES) if (FURNITURE_AXIS[cls].has(canonical)) FURNITURE_AXIS[cls].add(alias);
}
const axisOf = (value) => {
	if (value.startsWith('sh:')) return 'shape'; /* clipped silhouettes: sh:burst, sh:<custom>… */
	for (const [axis, set] of Object.entries(FURNITURE_AXIS)) if (set.has(value)) return axis;
	return value; /* unknown → exact-match replacement */
};

/* Merge a preset media= string with furniture style-override tokens. Overrides
   win: any preset token of the same element+axis is dropped before appending. */
const mergeMediaTokens = (presetMedia, overrides = []) => {
	const ov = overrides.filter(Boolean);
	const base = String(presetMedia || '').split(/\s+/).filter(Boolean);
	if (!ov.length) return base.join(' ');
	const conflicts = new Set();
	for (const token of ov) {
		const match = FURNITURE_TOKEN.exec(token);
		if (match) conflicts.add(`${match[1]}:${axisOf(match[2])}`);
	}
	const kept = base.filter((token) => {
		const match = FURNITURE_TOKEN.exec(token);
		return !match || !conflicts.has(`${match[1]}:${axisOf(match[2])}`);
	});
	return [...kept, ...ov].join(' ');
};

/* media= belongs on the frame it configures (canonical placement) — inject it
   into the built <ui-media> rather than onto the ui-card/ui-reveal host. */
const withMedia = (html, media) => media ? html.replace('<ui-media', `<ui-media${attrs({ media })}`) : html;

/* reveal preset values → compact variant-token spellings. The scale animation is
   grw() (content= owns scl()); the old `scl` spelling was removed in v5, so `scale`
   is the only preset word that folds to it. */
const RVL_TOKEN = { expand: 'exp', flip: 'flp', slide: 'sld', scale: 'grw' };
const FRM_TOKEN = { top: 'top', bottom: 'btm', left: 'lft', right: 'rgt' };
/* animations whose token carries a direction/origin argument (manifest: the
   reveal-animation stems that declare a `pos` arg class — exp declares none) */
const RVL_DIRECTED = new Set(Object.entries(TOKENS.attributes.variant.tokens)
	.filter(([, entry]) => entry.axis === 'reveal-animation' && !entry.deprecated && entry.args.pos)
	.map(([stem]) => stem));
/* animations that need the <ui-face> front-face wrapper (exp animates the host) */
const RVL_FACED = new Set(['flp', 'sld', 'grw']);
/* the toggle icon's corner when a preset names none */
const RVL_ICON = 'top right sm';
const ICON_STYLE = { dark: 'drk', semi: 'sem' };
const ICON_CELLS = new Set(TOKENS.attributes.variant.tokens.ico.args.pos);
/* icon words → ico()/icc() tokens: positional words fold into ONE corner token
   (top/bottom × left/right; defaults top + end → ts te bs be),
   style words map to their short forms, corner/short values pass through. */
const iconTokens = (fn, words) => {
	const out = [];
	let block = null, inline = null;
	for (const w of String(words || '').split(/\s+/).filter(Boolean)) {
		if (w === 'top' || w === 'bottom') block = w;
		else if (w === 'left' || w === 'right') inline = w;
		else if (ICON_CELLS.has(w)) out.push(`${fn}(${w})`);
		else out.push(`${fn}(${ICON_STYLE[w] || w})`);
	}
	if (block || inline) out.unshift(`${fn}(${(block || 'top')[0]}${inline === 'left' ? 's' : 'e'})`);
	return out;
};

/* A furniture item's style= string → per-value tokens, e.g. ("chip", "bs red")
   → ["chip(bs)", "chip(red)"]. Single-value tokens only (CSS matches by substring). */
const styleTokens = (el, style) =>
	String(style || '').split(/\s+/).filter(Boolean).map((token) => `${el}(${token})`);

/* Every word marquee() accepts, straight from the manifest (args + argAliases,
   placeholders skipped). The band is validated where the point furniture is not,
   because its position vocabulary is only `top`/`bot` — an author reaching for a
   furniture corner (`marquee(te)`) would otherwise emit a token no rule matches
   and get the silent default. Unknown words are dropped, never emitted. */
const MARQUEE_ARGS = new Set([
	...Object.values(TOKENS.attributes.media.tokens.marquee.args).flat().filter((value) => !value.includes('<')),
	...Object.keys(TOKENS.attributes.media.tokens.marquee.argAliases)
]);
const marqueeStyle = (style) =>
	String(style || '').split(/\s+/).filter((word) => MARQUEE_ARGS.has(word)).join(' ');

/* Build the overlay furniture markup from the unified furniture object and push
   each item's style-override tokens onto tokens.media (positioning/hue/shape come
   from the preset — the renderer no longer generates those). save/play also
   accept a bare `true`. */
const buildFurniture = (furniture, fields, tokens, mediaId, videoId = null) => {
	if (!furniture) return '';
	let html = '';
	const push = (el, style) => { for (const token of styleTokens(el, style)) tokens.media.push(token); };

	if (furniture.marquee?.text) {
		/* A BAND, not 9-grid furniture: it spans the frame's full inline size and
		   takes no position cell — `top` (default) and `bot` are its only placement
		   words, and it rides at z-index 1, BELOW the z-2 point furniture. Text goes
		   on aria-label, which is both the accessible name and the rendered string:
		   ui-marquee.css fills ::before (and ::after for the rpt mode) while the
		   element is :empty, so the band needs no child markup at all. */
		const marquee = furniture.marquee;
		html += `<ui-marquee aria-label="${esc(marquee.text)}"></ui-marquee>`;
		push('marquee', marqueeStyle(marquee.style));
	}
	if (furniture.play) {
		/* invoker commands are the one <ui-play> contract (video.js handles them).
		   With no native <video> to target it stays a labelled affordance. */
		const play = furniture.play === true ? {} : furniture.play;
		html += `<ui-play><button${attrs({
			type: 'button',
			'aria-label': play.label || 'Play',
			command: videoId ? '--play-pause' : null,
			commandfor: videoId
		})}><ui-icon type="play-pause"></ui-icon></button></ui-play>`;
		push('play', play.style);
	}
	if (furniture.chip?.text) {
		const chip = furniture.chip;
		html += `<ui-chip>${esc(chip.text)}${chip.badge ? `<ui-badge>${esc(chip.badge)}</ui-badge>` : ''}</ui-chip>`;
		push('chip', chip.style);
	}
	if (furniture.beacon?.text) {
		/* marker-class live/status indicator — plain text-only markup (summary-
		   safe); look comes from beacon(…) tokens: position/hue/size/face
		   (pll|sld|tck)/animation (bln|pls|brt|non — reduced-motion-gated in CSS).
		   Every face incl. the tck ticker is markup-free (pseudo-element panel +
		   dot loader riding a registered --_bcn-slide clock in ui-beacon.css). */
		const beacon = furniture.beacon;
		html += `<ui-beacon>${esc(beacon.text)}</ui-beacon>`;
		push('beacon', beacon.style);
	}
	if (furniture.sticker?.lines?.length) {
		const sticker = furniture.sticker;
		const lines = sticker.lines.map((line) => {
			const el = { label: 'small', lead: 'strong', plain: 'span' }[line.role] || 'small';
			return `<${el}>${esc(line.text ?? '')}${line.sup ? `<sup>${esc(line.sup)}</sup>` : ''}</${el}>`;
		}).join('');
		html += `<ui-sticker>${lines}</ui-sticker>`;
		push('sticker', sticker.style);
	}
	if (furniture.save) {
		const save = furniture.save === true ? {} : furniture.save;
		const name = esc(plain(fields.headline) || 'card');
		const label = save.saved ? `Remove ${name} from favorites` : `Save ${name} to favorites`;
		html += `<ui-save><button type="button" command="--save"${mediaId ? ` commandfor="${esc(mediaId)}"` : ''} aria-label="${label}"${save.saved ? ' aria-pressed="true"' : ''}><ui-icon type="shape" shape="${esc(save.shape || 'heart')}" variant="outline"></ui-icon></button></ui-save>`;
		push('save', save.style);
	}
	return html;
};

/* <ui-lightbox> is emitted SEPARATELY and placed BEFORE the slides: in a nav
   scroller it is sticky-pinned to the scrollport (media.carousel.css), and a
   sticky start-corner pin only holds from first-child position — the same
   contract as the hand-authored sticky <ui-play> (end corners are relocated by
   carousel.js for play; for lightbox they are documented as deferred). */

/* the two canonical glyphs, inlined from /assets/svg (cleaned Tabler outlines:
   bare viewBox, stroke styling comes from ui-icon's svg rules). `photos` =
   library-photo.svg "open gallery" (the default), `maximize` =
   window-maximize.svg "full screen" (single image / video frames). */
const LIGHTBOX_GLYPHS = {
	photos: '<svg viewBox="0 0 24 24"><path d="M7 5.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666"/><path d="M4.012 7.26a2.005 2.005 0 0 0 -1.012 1.737v10c0 1.1 .9 2 2 2h10c.75 0 1.158 -.385 1.5 -1"/><path d="M17 7h.01"/><path d="M7 13l3.644 -3.644a1.21 1.21 0 0 1 1.712 0l3.644 3.644"/><path d="M15 12l1.644 -1.644a1.21 1.21 0 0 1 1.712 0l2.644 2.644"/></svg>',
	maximize: '<svg viewBox="0 0 24 24"><path d="M3 17a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1l0 -3"/><path d="M4 12v-6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-6"/><path d="M12 8h4v4"/><path d="M16 8l-5 5"/></svg>'
};
const buildLightbox = (furniture, tokens, mediaId) => {
	if (!furniture?.lightbox) return '';
	const lightbox = furniture.lightbox === true ? {} : furniture.lightbox;
	for (const token of styleTokens('lightbox', lightbox.style)) tokens.media.push(token);
	const glyph = LIGHTBOX_GLYPHS[lightbox.shape] || LIGHTBOX_GLYPHS.photos;
	return `<ui-lightbox><button type="button" command="toggle-popover"${mediaId ? ` commandfor="${esc(mediaId)}"` : ''} aria-label="${esc(lightbox.label || 'View gallery')}"><ui-icon>${glyph}</ui-icon></button></ui-lightbox>`;
};

/**
 * Build the <ui-media> string. Returns { html, hostAttrs, extras }:
 * - hostAttrs: attributes computed for the frame (provider embeds, dual-attribute carousel form)
 * - extras: schema markup that must live OUTSIDE ui-media (VideoObject for embeds → content column)
 * Furniture style-override tokens are pushed onto tokens.media for the host's media= string.
 */
const buildMedia = (fields, type, tokens, preset = {}, frameAttrs = {}, cardId = null) => {
	if (!fields.media?.length) return null;
	let frames = '';
	let embed = null;
	let extras = '';
	/* a <ui-play> commands the frame's FIRST native <video>/<audio> — id it for commandfor */
	const playId = (fields.furniture?.play && cardId) ? `${cardId}-video` : null;
	let videoId = playId;
	const rootVideo = ROOT_VIDEO_TYPES.has(type);
	/* srcset geometry + loading from the preset's media= string — same contract as
	   ui-media-srcset.js (#resolveRatio + the load(eager|lazy) token) */
	const ratioMatch = IMG && /asr\((\d+)\/(\d+)\)/.exec(preset.media || '');
	const ratio = ratioMatch ? +ratioMatch[1] / +ratioMatch[2] : null;
	const eager = /load\(eager\)/.test(preset.media || '');
	/* mrk(tmb) paints each ::scroll-marker from --ui-carousel-thumb-url (carousel.css);
	   with no value the thumb is a bare placeholder, so an SSR'd thumbnail carousel has
	   to carry one per slide. Docs: docs/media.md § Thumbnails */
	const thumbs = /mrk\(tmb\)/.test(preset.media || '');
	let firstImg = true;
	for (const item of fields.media) {
		const src = item.asset?.$asset ? item.asset.$asset : item.src;
		if (item.mediaType === 'youtube' || item.mediaType === 'vimeo') {
			/* lite embed — provider/video attributes on the frame itself (index.js wires it) */
			embed = { provider: item.mediaType, video: src };
			extras += rootVideo ? rootEmbedMetas(item) : embedVideoObject(item);
			continue;
		}
		if (item.mediaType === 'video') {
			const id = videoId;
			videoId = null;
			frames += `<video${attrs({
				id,
				src,
				playsinline: true,
				controls: item.controls !== false && !item.autoplay,
				autoplay: !!item.autoplay,
				muted: !!(item.muted ?? item.autoplay),
				loop: !!item.loop,
				poster: item.poster || null,
				preload: item.autoplay ? 'auto' : 'metadata',
				'aria-label': item.alt || null
			})}${rootVideo || NO_IMAGE_PROP.has(type) ? '' : scope('video', 'VideoObject')}>${rootVideo ? rootVideoMetas(item, src) : NO_IMAGE_PROP.has(type) ? '' : videoMetas(item, src)}</video>`;
			continue;
		}
		if (item.mediaType === 'map') {
			/* the frame IS the map — coordinates come from details.geo, the same object
			   geoPart() emits, so the two can never disagree. Docs: docs/media.md § Map */
			frames += mapFrame(item, fields, type);
			continue;
		}
		if (item.mediaType === 'audio') {
			/* chromeless <audio> — renders nothing; the poster img stays the visual and
			   <ui-play> drives playback via command="--play-pause" (video.js mirrors state) */
			const id = videoId;
			videoId = null;
			frames += `<audio${attrs({ id, src, preload: 'metadata', 'aria-label': item.alt || null })}${NO_IMAGE_PROP.has(type) ? '' : scope('associatedMedia', 'AudioObject')}>${NO_IMAGE_PROP.has(type) ? '' : meta('contentUrl', src) + meta('name', item.alt)}</audio>`;
			continue;
		}
		const cdn = cdnEligible(src);
		frames += `<img${attrs({
			src,
			alt: item.alt || '',
			style: thumbs ? styleAttr({ '--ui-carousel-thumb-url': `url('${thumbUrl(src)}')` }) : null,
			srcset: cdn ? buildSrcset(src, { ...IMG, ratio }) : null,
			sizes: cdn ? sizesFor(eager) : null,
			loading: eager ? 'eager' : 'lazy',
			fetchpriority: eager && firstImg ? 'high' : null,
			decoding: IMG ? 'async' : null,
			itemprop: NO_IMAGE_PROP.has(type) ? null : 'image'
		})}>`;
		firstImg = false;
	}
	/* save/lightbox need a command target — id the frame when either is present;
	   lightbox also marks the frame as the popover the invoker toggles */
	const mediaId = ((fields.furniture?.save || fields.furniture?.lightbox) && cardId) ? `${cardId}-media` : null;
	const lightbox = buildLightbox(fields.furniture, tokens, mediaId);
	const furniture = buildFurniture(fields.furniture, fields, tokens, mediaId, videoId ? null : playId);
	let typeChip = '';
	if (TYPE_CHIP && !fields.furniture?.chip) {
		/* one chip family per frame: an existing furniture chip owns the tokens — skip.
		   te is taken when any furniture style names it (product's sticker), or when a
		   reveal's toggle icon sits there (its default corner) — chip default (ts) then */
		const teTaken = Object.values(fields.furniture || {}).some((f) => ` ${f?.style || ''} `.includes(' te '))
			|| (preset.element === 'ui-reveal' && !preset.reveal?.trigger && iconTokens('ico', preset.reveal?.icon || RVL_ICON).includes('ico(te)'));
		if (!teTaken) tokens.media.push('chip(te)');
		typeChip = `<ui-chip data-type>${esc(resolveItemtype(fields))}</ui-chip>`;
	}
	const html = `<ui-media${attrs({
		id: mediaId,
		popover: fields.furniture?.lightbox ? true : null,
		/* open-state control vocabulary (standard media spellings) — swapped in by
		   ui/card/lightbox.js while the popover is open; inert without JS */
		'media-open': (fields.furniture?.lightbox && preset['media-open']) || null,
		...(embed || {}),
		...frameAttrs
	})}>${lightbox}${frames}${furniture}${typeChip}</ui-media>`;
	return { html, extras };
};

/* ── content column ── */

/* Long-form body: plain string or UCF richtext ({$richtext, content, format}).
   One element per blank-line-separated paragraph, escaped — html-format richtext
   is NOT rendered (this engine never emits unescaped rich markup).
   For article/news the paragraphs are wrapped in itemprop="articleBody". */
const bodyHtml = (fields, type, textTag = 'p') => {
	const body = fields.body;
	const text = typeof body === 'string'
		? body
		: body?.$richtext && body.format !== 'html' ? body.content : null;
	if (!text) return '';
	const paragraphs = String(text).split(/\n{2,}/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean)
		/* same allowlist as the headline (<b>, <ui-gradient-text>, <high-light>) — every
		   other tag stays escaped, so body copy can mark up a phrase without raw HTML */
		.map((paragraph) => `<${textTag}>${renderInline(paragraph)}</${textTag}>`)
		.join('');
	return ARTICLE_BODY_TYPES.has(type) ? `<div itemprop="articleBody">${paragraphs}</div>` : paragraphs;
};

/**
 * Envelope parts: eyebrow, headline, subheadline, summary/body, date metas.
 * slots.subheadline lets a type renderer replace the subheadline row (profile).
 * Types in DETAILS_OWNS_SUMMARY render their own summary (review).
 *
 * textMode (preset `text` field): "summary" (teaser, default) shows the summary
 * and never the body; "body" shows the body INSTEAD of the summary (summary as
 * fallback when no body exists); "both" shows summary + body (reveal backs).
 */
const DETAILS_OWNS_SUMMARY = new Set(['review']);

const buildContent = (fields, type, overlay, slots = {}, textMode = 'summary', parts = {}, headingTag = 'h3') => {
	/* overlay cards keep <strong>: an overlay headline is a label, not a section heading */
	const headlineTag = overlay ? 'strong' : (HEADING_TAGS.has(headingTag) ? headingTag : 'h3');
	const textTag = overlay ? 'span' : 'p';
	const body = textMode !== 'summary' ? bodyHtml(fields, type, textTag) : '';
	const showSummary = textMode !== 'body' || !body;
	let html = '';
	if (fields.eyebrow) {
		html += `<small data-part="eyebrow"${EYEBROW_PROP[type] ? ` itemprop="${EYEBROW_PROP[type]}"` : ''}>${esc(fields.eyebrow)}</small>`;
	}
	if (fields.headline && type !== 'quote') {
		html += `<${headlineTag} data-part="headline" itemprop="${headlineProp(fields, type)}">${renderInline(fields.headline)}</${headlineTag}>`;
	}
	html += slots.subheadline || (fields.subheadline ? `<${textTag} data-part="subheadline">${esc(fields.subheadline)}</${textTag}>` : '');
	if (fields.summary && showSummary && !DETAILS_OWNS_SUMMARY.has(type)) {
		const prop = SUMMARY_PROP[type] || 'description';
		if (type === 'quote') {
			html += quotePart(fields.summary, { itemprop: prop, variant: parts.quote || 'bigquote', cite: fields.authors?.[0]?.name });
		} else if (type === 'social') {
			html += quotePart(fields.summary, { itemprop: prop, variant: parts.quote || null });
		} else {
			html += `<${textTag} data-part="summary" itemprop="${prop}">${esc(fields.summary)}</${textTag}>`;
		}
	}
	if (fields.summary && !showSummary) {
		/* body replaced the visible summary — keep the description machine-readable */
		html += meta(SUMMARY_PROP[type] || 'description', fields.summary);
	}
	/* the lede byline sits between the standfirst and the body (slots.byline) */
	html += slots.byline || '';
	html += body;
	if (fields.published) {
		const prop = PUBLISHED_PROP[type] || 'datePublished';
		html += meta(prop, prop === 'datePosted' ? dateOnly(fields.published) : fields.published);
	}
	if (fields.modified) html += meta('dateModified', fields.modified);
	return html;
};

/* byline, tags, actions, engagement — envelope trailers, appended after details */
/* dateline — its own block in the byline row: date over reading time, end-aligned */
const datelinePart = (fields) => {
	const date = fields.published
		? `<time datetime="${esc(fields.published)}">${new Date(fields.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>`
		: '';
	return date || fields.readingTime
		? `<small data-part="dateline">${date}${fields.readingTime ? `<span>${esc(fields.readingTime)}</span>` : ''}</small>`
		: '';
};

const buildTail = (fields, type) => {
	let html = '';
	/* a posting/upload date is machine metadata, not an editorial byline date, so the
	   types that redirect `published` away from datePublished show no dateline */
	const dateline = type in PUBLISHED_PROP ? '' : datelinePart(fields);
	if (fields.authors?.length) html += byline(fields.authors, bylineProp(type), dateline);
	else if (dateline) html += `<p data-part="meta">${dateline}</p>`;
	if (fields.modifiedDisplay) html += `<p data-part="meta"><small>Updated ${esc(fields.modifiedDisplay)}</small></p>`;
	if (fields.tags?.length) {
		/* itemprop sits ON the chip (microdata value = textContent) so a nested <a> never leaks its href */
		const tagProp = type in TAGS_PROP ? TAGS_PROP[type] : 'keywords';
		/* a tag may be a string or {name, url}: the anchor sits INSIDE the chip so the
		   itemprop still reads the text, and content.css raises it above a cover link */
		html += `<span data-part="tags">${fields.tags.map((tag) => {
			const label = typeof tag === 'string' ? tag : tag?.name ?? '';
			const url = typeof tag === 'object' ? tag?.url : null;
			const text = url ? `<a href="${esc(url)}">${esc(label)}</a>` : esc(label);
			return `<ui-chip${tagProp ? ` itemprop="${tagProp}"` : ''}>${text}</ui-chip>`;
		}).join('')}</span>`;
	}
	if (fields.actions?.length) {
		html += `<nav data-part="actions">${fields.actions.map((action) => {
			const variant = action.style === 'primary' ? ' data-variant="accent"' : '';
			const label = action.link?.text || '';
			const aria = action.ariaLabel ? ` aria-label="${esc(action.ariaLabel)}"` : '';
			/* no href ⇒ a real <button>: an anchor without one is not a control */
			return action.link?.url
				? `<a class="ui-button"${variant}${aria} href="${esc(action.link.url)}">${esc(label)}</a>`
				: `<button class="ui-button" type="button"${variant}${aria}>${esc(label)}</button>`;
		}).join(' ')}</nav>`;
	}
	if (fields.links?.length) {
		/* plain related links — a text-link list, deliberately not buttons (no itemprop:
		   multiple url values on the card scope would misdeclare the card's own url) */
		html += `<ul data-part="links">${fields.links.map((link) =>
			`<li><a href="${esc(link.url || '#')}">${esc(link.text || link.url || '')}</a></li>`
		).join('')}</ul>`;
	}
	const eng = fields.engagement;
	if (eng && Object.keys(eng).length) {
		/* WatchAction is "dynamic/moving visual content" — only right for a video/audio
		   root. Everything else (article, forum post) views STATIC content: ViewAction,
		   which is also the only one of the two Google reads. Docs: docs/schema.md § Subtypes */
		const viewAction = WATCHABLE.has(resolveItemtype(fields)) ? 'WatchAction' : 'ViewAction';
		const counters = [['likeCount', 'LikeAction'], ['shareCount', 'ShareAction'], ['commentCount', 'CommentAction'], ['viewCount', viewAction]];
		for (const [key, action] of counters) {
			if (eng[key] == null) continue;
			html += `<div${scope('interactionStatistic', 'InteractionCounter')} hidden>${meta('interactionType', SCHEMA + action)}${meta('userInteractionCount', eng[key])}</div>`;
		}
		const summary = [
			eng.viewCount != null ? `${num(eng.viewCount)} views` : null,
			eng.likeCount != null ? `${num(eng.likeCount)} likes` : null,
			eng.shareCount != null ? `${num(eng.shareCount)} shares` : null,
			eng.commentCount != null ? `${num(eng.commentCount)} comments` : null
		].filter(Boolean).join(' · ');
		if (summary) html += `<footer data-part="footer">${summary}</footer>`;
	}
	return html;
};

/* ── type-specific detail renderers — return part strings ── */

/* stock state → theme hue: green in stock · orange low/limited · red out */
const availabilityHue = (availability) =>
	/(in)/i.test(availability || '') ? 'green' : /(low|limited|few)/i.test(availability || '') ? 'orange' : 'red';

const availabilityUrl = (availability) =>
	SCHEMA + (/(in)/i.test(availability || '') ? 'InStock' : /(low|limited)/i.test(availability || '') ? 'LimitedAvailability' : 'OutOfStock');

/* ProductGroup variant axes. A variesBy value names a property Google reads FROM the
   variants, so one allowlist drives both: what variesBy may say and what an item emits.
   Allowlisted for the same two reasons as details.subtype — docs/schema.md § Subtypes. */
const VARIANT_AXES = ['color', 'size', 'material', 'pattern'];

/* One hasVariant row. `item.url` becomes a real anchor, not a meta: Google requires each
   variant be "preselectable directly with a distinct URL", and only a link is crawlable.
   `price == null` (not falsy) — a free variant prices at 0. Docs: docs/schema.md § Product */
const variantItem = (item) => {
	const name = `<span itemprop="name">${esc(item.name)}</span>`;
	const offer = item.price == null ? '' : `<span${scope('offers', 'Offer')}>`
		+ meta('priceCurrency', item.currency)
		+ meta('availability', availabilityUrl(item.availability || 'in stock'))
		+ ` ${priceValue(item.currency, item.price)}</span>`;
	return `<li${scope('hasVariant', 'Product')}>`
		+ (item.url ? `<a itemprop="url" href="${esc(item.url)}">${name}</a>` : name)
		+ meta('sku', item.sku)
		+ VARIANT_AXES.map((axis) => meta(axis, item[axis])).join('')
		+ offer
		+ '</li>';
};

/* One hasVariant row as a picker button. The <label> IS the variant row — the microdata
   rides it, so the picker never restates a list rendered elsewhere. Unlike the list form
   the url is a <meta>, NOT an anchor: an anchor inside a <label> is a second interactive
   control fighting the radio for the same click. Docs: docs/schema.md § Product */
const variantButton = (item, index, group) => {
	const label = [item.size, item.color, item.material, item.pattern].find(Boolean) || item.name;
	return `<label class="ui-button"${scope('hasVariant', 'Product')}>`
		+ `<input type="radio" name="${group}" value="${esc(label)}" data-sr${index === 0 ? ' checked' : ''}>`
		+ meta('name', item.name)
		+ meta('url', item.url)
		+ meta('sku', item.sku)
		+ VARIANT_AXES.map((axis) => meta(axis, item[axis])).join('')
		+ (item.price == null ? '' : `<span${scope('offers', 'Offer')} hidden>${meta('priceCurrency', item.currency)}${meta('price', item.price)}${meta('availability', availabilityUrl(item.availability || 'in stock'))}</span>`)
		+ esc(label)
		+ '</label>';
};

/* Nested hasVariant needs no inProductGroupWithID, and variesBy takes FULL schema.org
   URLs, not bare property names. `control` picks the shape the rows take — a link list
   (default) or a picker; an unknown value falls back to the list, the same loud-skip
   discipline as an unknown axis. Docs: docs/schema.md § Product */
const VARIANT_CONTROLS = new Set(['list', 'buttons']);
const variantsPart = (variants, fields) => {
	const wanted = variants.variesBy || [];
	const axes = wanted.filter((axis) => VARIANT_AXES.includes(axis));
	const control = VARIANT_CONTROLS.has(variants.control) ? variants.control : 'list';
	/* the group name is MINTED, never author data — slug() is an attribute-safe
	   allowlist, and per-headline so two pickers on a page can't share a group */
	const group = `variant-${slug(plain(fields?.headline))}`;
	return meta('productGroupID', variants.productGroupID)
		+ axes.map((axis) => meta('variesBy', SCHEMA + axis)).join('')
		/* an unknown axis is dropped — say so, for the same reason the block-level skip does */
		+ (axes.length < wanted.length ? `<!-- variesBy axes ignored: not one of ${VARIANT_AXES.join(', ')} -->` : '')
		+ (control === 'buttons'
			? `<fieldset class="ui-button-group" data-variant="rounded">${variants.items.map((item, index) => variantButton(item, index, group)).join('')}</fieldset>`
			: `<ul data-part="list">${variants.items.map(variantItem).join('')}</ul>`);
};

/* leading year of an ISO date — "since 2023" in a series meta row */
const startYear = (iso) => /^\d{4}/.exec(iso || '')?.[0] || null;

/* text → an attribute-safe token, for grouping names the renderer mints itself
   (radio groups). Strict allowlist, so it can never break out of the attribute. */
const slug = (text) => String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'card';

/* A list of ALREADY-BUILT scoped <li> rows (each carries its own itemscope, so
   listPart's plain-string shape does not fit). Ordered vs unordered is DATA
   (`details.ordered`), because the answer is per list, not per type: album tracks
   and TV seasons ascend, so ordinal markers are true; podcast episodes descend,
   so markers would lie. The per-type default is the direction that type usually
   runs in — data always wins. */
const scopedList = (rows, ordered) => rows.length
	? `<${ordered ? 'ol' : 'ul'} data-part="list">${rows.join('')}</${ordered ? 'ol' : 'ul'}>`
	: '';

/* one MenuItem row. suitableForDiet takes RestrictedDiet members by URL; the visible
   chip is a separate label so the machine value and the reader's value agree.
   calories is an Energy and servingSize is Text — both unit-bearing strings. */
const menuItem = (item) => {
	const offer = item.price == null ? '' : `<span${scope('offers', 'Offer')}>${meta('priceCurrency', item.currency)}${priceValue(item.currency, item.price)}</span>`;
	const nutrition = item.nutrition
		? `<span${scope('nutrition', 'NutritionInformation')} hidden>${meta('calories', item.nutrition.calories)}${meta('proteinContent', item.nutrition.proteinContent)}${meta('servingSize', item.nutrition.servingSize)}</span>`
		: '';
	return `<li${scope('hasMenuItem', 'MenuItem')}>`
		+ `<p><strong itemprop="name">${esc(item.name)}</strong>${offer ? ` · ${offer}` : ''}${item.label ? ` <ui-chip theme="pale green">${esc(item.label)}</ui-chip>` : ''}</p>`
		+ (item.description ? `<span itemprop="description">${esc(item.description)}</span>` : '')
		+ (item.diets || []).filter((diet) => RESTRICTED_DIETS.has(diet)).map((diet) => meta('suitableForDiet', SCHEMA + diet)).join('')
		+ nutrition
		+ '</li>';
};

const DETAILS = {
	product(d, fields, parts, itemtype) {
		/* PDP order: rating under the title, then price, then stock state */
		let html = ratingPart('aggregateRating', 'AggregateRating', d.rating);
		if (d.price) {
			html += `<p data-part="price"${scope('offers', 'Offer')}>
				${meta('priceCurrency', d.price.currency)}${meta('availability', availabilityUrl(d.availability))}${meta('itemCondition', SCHEMA + 'NewCondition')}${d.validUntil ? meta('priceValidUntil', d.validUntil) : ''}
				${priceValue(d.price.currency, d.price.current)}${d.price.original ? ` <del>${fmtPrice(d.price.currency, d.price.original)}</del>` : ''}${d.price.discountText ? ` <ui-chip theme="pale green">${esc(d.price.discountText)}</ui-chip>` : ''}
			</p>`;
			/* the validity belongs to the offer — directly under the price, not the stock row */
			if (d.validUntilDisplay) html += `<p data-part="meta"><small>Valid until ${esc(d.validUntilDisplay)}</small></p>`;
		}
		if (d.availability) html += `<p data-part="meta"><ui-chip theme="pale ${availabilityHue(d.availability)}">${esc(d.availability)}</ui-chip></p>`;
		/* sku is machine-readable only — no visible number on the card */
		if (d.sku) html += meta('sku', d.sku);
		/* hasVariant/variesBy/productGroupID are ProductGroup-ONLY properties, so the gate is
		   the itemtype WRITTEN on the enclosing scope — never d.subtype, and never a fresh
		   resolveItemtype(fields) either: on the flipside path these details render into the
		   HOST's itemscope. Skipping stays visible. Docs: docs/schema.md § Product */
		if (d.variants?.items?.length) {
			html += itemtype === 'ProductGroup'
				? variantsPart(d.variants, fields)
				: '<!-- variants ignored: itemtype did not resolve to ProductGroup -->';
		}
		return html;
	},

	event(d) {
		/* attendanceMode is data-driven through an ALLOWLIST — the same discipline as
		   details.subtype; anything else falls back to the offline default */
		const mode = ATTENDANCE_MODES.has(d.attendanceMode) ? d.attendanceMode : 'Offline';
		let html = meta('eventStatus', d.status ? SCHEMA + 'Event' + d.status : null)
			+ meta('eventAttendanceMode', `${SCHEMA}${mode}EventAttendanceMode`)
			+ meta('startDate', d.startDate) + meta('endDate', d.endDate);
		const location = d.location?.name
			? `<span${scope('location', 'Place')}><span itemprop="name">${esc(d.location.name)}</span>${d.location.address ? `<span${scope('address', 'PostalAddress')}>, <span itemprop="addressLocality">${esc(d.location.address)}</span></span>` : ''}</span>`
			: '';
		html += `<span data-part="meta">${esc(d.dateDisplay || d.startDate || '')}${location ? ' · ' : ''}${location}</span>`;
		if (d.organizer?.name) {
			html += `<span data-part="meta"${scope('organizer', 'Organization')}>Organizer: <span itemprop="name">${esc(d.organizer.name)}</span></span>`;
		}
		/* ticket tiers — one Offer scope each (Google reads these for event rich results) */
		for (const offer of d.offers || []) {
			html += `<p data-part="price"${scope('offers', 'Offer')}>${meta('priceCurrency', offer.currency)}${meta('availability', availabilityUrl(offer.availability || 'in stock'))}${offer.validThrough ? meta('validThrough', offer.validThrough) : ''}${offer.name ? `<span itemprop="name">${esc(offer.name)}</span> ` : ''}${priceValue(offer.currency, offer.price)}</p>`;
		}
		return html;
	},

	recipe(d, fields, parts = {}) {
		let html = meta('prepTime', d.prepTime) + meta('cookTime', d.cookTime) + meta('recipeYield', d.servings);
		html += `<p data-part="meta">Prep ${esc(duration(d.prepTime))} · Cook ${esc(duration(d.cookTime))} · Serves ${esc(d.servings)}</p>`;
		if (d.ingredients?.length) {
			html += `<ul data-part="list">${d.ingredients.map((item) => `<li itemprop="recipeIngredient">${esc(item)}</li>`).join('')}</ul>`;
		}
		if (d.instructions?.length) {
			/* one collapsible per step — a nested accordion inside the Instructions panel */
			const steps = accordion('recipe-step', d.instructions.map((step, index) => ({
				/* position rides the SUMMARY: the accordion zeroes the panel's first and
				   last child margins, and a box-less <meta> at either end absorbs one */
				summary: `Step ${index + 1}${meta('position', index + 1)}`,
				body: `<div><p itemprop="text">${esc(step)}</p></div>`,
				scopeAttrs: scope('itemListElement', 'HowToStep'),
				icon: 'chevron right'
			})), 'divided', scope('recipeInstructions', 'ItemList'));
			html += accordion('recipe-acc', [{ summary: 'Instructions', body: steps }], parts.accordion);
		}
		return html;
	},

	review(d, fields, parts = {}) {
		let html = ratingPart('reviewRating', 'Rating', d.rating);
		if (fields.summary) {
			html += quotePart(fields.summary, { itemprop: 'reviewBody', variant: parts.quote || null });
		}
		if (d.reviewer?.name) {
			html += `<address data-part="byline"${scope('author', 'Person')}>${avatarPart(d.reviewer)}<span data-part="byline-who"><span itemprop="name">${esc(d.reviewer.name)}</span>${d.reviewer.title ? `<span itemprop="jobTitle">${esc(d.reviewer.title)}</span>` : ''}${d.reviewer.verified ? '<span>✓ Verified purchase</span>' : ''}</span>${d.reviewDate ? `<small data-part="dateline"><time datetime="${esc(d.reviewDate)}">${esc(d.reviewDateDisplay || d.reviewDate)}</time></small>` : ''}</address>`;
			/* the visible time sits inside the Person scope, so the machine-readable
			   date rides a meta on the Review itself */
			if (d.reviewDate) html += meta('datePublished', d.reviewDate);
		}
		if (d.productReviewed) {
			/* the reviewed thing owns its aggregate rating and offer — Google reads both
			   from itemReviewed, not from the Review */
			const agg = d.aggregateRating;
			const reviewedType = REVIEWED_TYPES.has(d.reviewedType) ? d.reviewedType : 'Product';
			/* offers is not an Organization property — testimonials carry no price anyway */
			const offer = d.productPrice && reviewedType !== 'Organization';
			html += `<div${scope('itemReviewed', reviewedType)} hidden>${meta('name', d.productReviewed)}${d.productImage ? meta('image', d.productImage) : ''}${agg ? `<span${scope('aggregateRating', 'AggregateRating')}>${meta('ratingValue', agg.value ?? agg.ratingValue)}${meta('ratingCount', agg.count ?? agg.ratingCount)}${meta('bestRating', agg.max ?? 5)}${meta('worstRating', 1)}</span>` : ''}${offer ? `<span${scope('offers', 'Offer')}>${meta('priceCurrency', d.productPrice.currency)}${meta('price', d.productPrice.amount ?? d.productPrice.current)}${meta('availability', SCHEMA + 'InStock')}</span>` : ''}</div>`;
		}
		return html;
	},

	job(d, fields, parts = {}, itemtype = null, owned = NO_PROPS) {
		/* `industry` was emitted twice for a while — here and on the eyebrow. The eyebrow
		   entry is gone; the guard is what keeps it from coming back. § One property, one value */
		let html = (owned.has('industry') ? '' : meta('industry', d.industry)) + meta('employmentType', d.employmentType) + meta('validThrough', d.applicationDeadline);
		html += `<p data-part="meta"><span${scope('hiringOrganization', 'Organization')}><span itemprop="name">${esc(d.company)}</span></span> · <span${scope('jobLocation', 'Place')}><span itemprop="name">${esc(d.location)}</span></span>${d.employmentTypeDisplay ? ` · ${esc(d.employmentTypeDisplay)}` : ''}${d.applicationDeadlineDisplay ? ` · Apply by ${esc(d.applicationDeadlineDisplay)}` : ''}</p>`;
		const salary = d.salaryRange;
		if (salary) {
			html += `<p data-part="price"${scope('baseSalary', 'MonetaryAmount')}>
				${meta('currency', salary.currency)}
				<span${scope('value', 'QuantitativeValue')}>${meta('minValue', salary.min)}${meta('maxValue', salary.max)}${meta('unitText', salary.period || 'YEAR')}${esc(salary.currency)} ${num(salary.min)}–${num(salary.max)} <small>${esc(salary.periodDisplay || 'annually')}</small></span>
			</p>`;
		}
		/* The employer rating is a SECOND TOP-LEVEL ITEM (itemscope, no itemprop): it
		   rates the company, not the posting, and JobPosting has no aggregateRating —
		   a nested one is simply ignored. Docs: docs/schema.md § Employer rating */
		const employer = d.employerRating;
		if (employer?.value) {
			const org = employer.organization;
			const max = employer.max ?? 5;
			html += ratingPart(null, 'EmployerAggregateRating', employer, {
				/* hidden: a machine-only scope is still a flex item and would otherwise
				   eat a gap slot, indenting the star row against its siblings */
				lead: org ? `<span${scope('itemReviewed', 'Organization')} hidden>${meta('name', org)}${meta('sameAs', employer.sameAs)}</span>` : '',
				/* built from already-escaped pieces — num() escapes, so no outer esc() */
				srLabel: `${esc(org || 'This employer')} rated ${esc(employer.value)} out of ${esc(max)}${employer.count != null ? ` by ${num(employer.count)} employees` : ''}`,
				visibleLabel: `${esc(employer.value)} / ${esc(max)} employer rating${employer.count != null ? ` (${num(employer.count)} reviews)` : ''}`
			});
		}
		const sections = [];
		if (d.qualifications?.length) sections.push({ summary: 'Requirements', body: `<div>${listPart(d.qualifications, { itemprop: 'qualifications' })}</div>` });
		if (d.benefits?.length) sections.push({ summary: 'Benefits', body: `<div>${listPart(d.benefits, { itemprop: 'jobBenefits' })}</div>` });
		if (sections.length) html += accordion('job-acc', sections, parts.accordion);
		return html;
	},

	course(d) {
		/* the teacher is CourseInstance.instructor → Person; Course.provider is the
		   ORGANISATION offering it. Emitting the instructor as provider misdeclares both. */
		let html = meta('timeRequired', d.duration) + meta('educationalLevel', d.difficultyLevel)
			+ `<div${scope('hasCourseInstance', 'CourseInstance')} hidden>${meta('courseMode', 'Online')}${meta('courseWorkload', d.courseWorkload)}${d.instructor?.name ? `<span${scope('instructor', 'Person')}>${meta('name', d.instructor.name)}</span>` : ''}</div>`
			+ (d.provider ? `<span${scope('provider', 'Organization')} hidden>${meta('name', d.provider)}</span>` : '');
		const facts = [d.duration ? duration(d.duration) : null, d.difficultyLevel, d.courseWorkload ? duration(d.courseWorkload) + ' of study' : null].filter(Boolean).join(' · ');
		html += `<p data-part="meta">${esc(facts)}${d.instructor?.name ? ` · Instructor: ${esc(d.instructor.name)}${d.instructor.title ? `, ${esc(d.instructor.title)}` : ''}` : ''}</p>`;
		if (d.price) {
			html += `<p data-part="price"${scope('offers', 'Offer')}>${meta('priceCurrency', d.price.currency)}${meta('availability', SCHEMA + 'InStock')}${priceValue(d.price.currency, d.price.current)}${d.price.original ? ` <del>${fmtPrice(d.price.currency, d.price.original)}</del>` : ''}</p>`;
		}
		html += listPart(d.learningOutcomes, { itemprop: 'teaches' });
		html += listPart(d.prerequisites);
		return html;
	},

	booking(d) {
		let html = meta('totalPrice', d.price?.hourlyRate) + meta('priceCurrency', d.price?.currency)
			+ (d.serviceName ? `<div${scope('reservationFor', 'Service')} hidden>${meta('name', d.serviceName)}</div>` : '');
		html += `<p data-part="meta"><span${scope('provider', 'Organization')}><span itemprop="name">${esc(d.venue)}</span></span>${d.capacity ? ` · Capacity ${esc(d.capacity)}` : ''}${d.duration ? ` · ${esc(d.duration)}` : ''}${d.cancellationPolicy ? ` · ${esc(d.cancellationPolicy)}` : ''}</p>`;
		if (d.price?.hourlyRate != null) {
			html += `<p data-part="price">${fmtPrice(d.price.currency, d.price.hourlyRate)}/hour</p>`;
		}
		html += listPart(d.amenities);
		if (d.specialRequests) html += `<footer data-part="footer">${esc(d.specialRequests)}</footer>`;
		return html;
	},

	poll(d) {
		let html = meta('answerCount', d.options?.length);
		const total = d.totalVotes || d.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;
		if (d.options?.length) {
			html += `<ul data-part="options">${d.options.map((option) => {
				const pct = total ? Math.round((option.votes / total) * 100) : 0;
				return `<li${scope('suggestedAnswer', 'Answer')}>
					<label><input type="radio" class="--check" name="poll-render"> <span itemprop="text">${esc(option.headline)}</span></label>
					<progress max="100" value="${pct}"></progress> <span>${pct}%</span>
				</li>`;
			}).join('')}</ul>`;
		}
		html += `<footer data-part="footer">${num(total)} votes${d.closesDisplay ? ` · ${esc(d.closesDisplay)}` : ''}</footer>`;
		return html;
	},

	profile(d) {
		let html = '';
		if (d.location) html += `<p data-part="meta" itemprop="address">${esc(d.location)}</p>`;
		/* profile URLs double as sameAs — the identity claim Google reads. ABSOLUTE
		   http(s) only: a relative or placeholder href is not an identity anywhere. */
		for (const contact of d.contacts || []) {
			if (/^https?:\/\/\S+/.test(contact.value || '')) html += meta('sameAs', contact.value);
		}
		if (d.contacts?.length) {
			html += `<nav data-part="actions">${d.contacts.map((contact, index) => contactLink(contact, index === 0)).join(' ')}</nav>`;
		}
		return html;
	},

	faq(d, fields, parts = {}) {
		if (!d.items?.length) return '';
		return accordion('faq-render', d.items.map((item) => ({
			summary: `<span itemprop="name">${esc(item.question)}</span>`,
			body: `<div${scope('acceptedAnswer', 'Answer')}><p itemprop="text">${esc(item.answer)}</p></div>`,
			scopeAttrs: scope('mainEntity', 'Question')
		})), parts.accordion);
	},

	timeline(d) {
		if (!d.items?.length) return '';
		/* Event REQUIRES startDate — the visible <time> is the label, so the date also
		   rides a startDate meta (name falls back to the date only when there is no headline) */
		return `<ol data-part="timeline">${d.items.map((item) =>
			`<li${scope('subEvent', 'Event')}${item.theme ? ` data-theme="${esc(item.theme)}"` : ''}>${meta('startDate', item.date)}${meta('endDate', item.endDate)}${item.location ? meta('location', item.location) : ''}<time${item.headline ? '' : ' itemprop="name"'} datetime="${esc(item.date)}">${esc(item.headline || item.date)}</time>${item.headline ? meta('name', item.headline) : ''} <span itemprop="description">${esc(item.text)}</span></li>`
		).join('')}</ol>`;
	},

	gallery(d) {
		const bits = [d.albumName, d.totalCount ? `${d.totalCount} photos` : null].filter(Boolean).join(' · ');
		return bits ? `<p data-part="meta">${esc(bits)}</p>` : '';
	},

	statistic(d) {
		/* The machine value rides a <meta>: displayValue is abbreviated ("2.4M") and a
		   text-reading consumer must never take it for the number. The <data> keeps its
		   value= as the HTML machine pair for the text it wraps (and the stat style hook),
		   never an itemprop. `unit` is a real unit — docs/schema.md § Statistic */
		let html = `<p data-part="stat"${scope('value', 'QuantitativeValue')}>
			${meta('name', d.metricName)}${meta('value', d.currentValue)}
			<data value="${esc(d.currentValue)}">${esc(d.displayValue ?? String(d.currentValue))}</data>${d.unit ? `<small itemprop="unitText">${esc(d.unit)}</small>` : ''}${d.trend ? `<span> ${d.trend === 'up' ? '▲' : d.trend === 'down' ? '▼' : '►'} ${esc(d.trendPercentage)}%</span>` : ''}
		</p>`;
		const foot = [d.comparisonPeriod ? `vs ${d.comparisonPeriod}` : null, d.note].filter(Boolean).join(' · ');
		if (foot) html += `<p data-part="meta">${esc(foot)}</p>`;
		return html;
	},

	achievement(d) {
		let html = d.status ? `<p data-part="meta"><ui-chip theme="pale green">${esc(d.status)}</ui-chip></p>` : '';
		html += meta('dateCreated', d.dateEarned) + meta('expires', d.expirationDate)
			+ meta('educationalLevel', d.skillLevel) + meta('identifier', d.credentialId);
		html += `<p data-part="meta">Issued by <span${scope('recognizedBy', 'Organization')}><span itemprop="name">${esc(d.issuingOrganization)}</span></span>${d.dateEarnedDisplay ? ` · ${esc(d.dateEarnedDisplay)}` : ''}${d.expirationDateDisplay ? ` · Expires ${esc(d.expirationDateDisplay)}` : ''}${d.credentialId ? ` · ID ${esc(d.credentialId)}` : ''}</p>`;
		if (d.verificationUrl) html += `<nav data-part="actions"><a class="ui-button" href="${esc(d.verificationUrl)}" target="_blank" rel="noopener">Verify credential</a></nav>`;
		return html;
	},

	announcement(d) {
		let html = meta('datePosted', d.effectiveDate?.start) + meta('expires', d.effectiveDate?.end) + meta('spatialCoverage', 'Global');
		const range = [d.effectiveDate?.startDisplay || d.effectiveDate?.start, d.effectiveDate?.endDisplay || d.effectiveDate?.end].filter(Boolean).join(' – ');
		const head = [d.announcementType, range].filter(Boolean).join(' · ');
		if (head) html += `<p data-part="meta">${esc(head)}</p>`;
		if (d.priority) {
			const hue = /high|critical/i.test(d.priority) ? 'red' : /medium/i.test(d.priority) ? 'orange' : 'gray';
			html += `<p data-part="meta"><ui-chip theme="pale ${hue}">${esc(d.priorityDisplay || d.priority)}</ui-chip></p>`;
		}
		if (d.targetAudience) {
			html += `<p data-part="meta"${scope('audience', 'Audience')}>Audience: <span itemprop="audienceType">${esc(d.targetAudience)}</span></p>`;
		}
		if (d.actionRequired) html += `<footer data-part="footer">Action required: ${esc(d.actionRequired)}</footer>`;
		return html;
	},

	business(d) {
		let html = meta('url', d.website) + meta('priceRange', d.priceRange) + meta('foundingDate', d.foundingDate)
			+ (d.sameAs || []).map((url) => meta('sameAs', url)).join('');
		html += geoPart(d.geo);
		html += addressPart(d.address);
		html += ratingPart('aggregateRating', 'AggregateRating', d.rating);
		if (d.priceRange) html += `<p data-part="meta">${esc(d.priceRange)}</p>`;
		html += hoursPart(d.openingHours);
		const links = [];
		if (d.telephone) links.push(`<a class="ui-button" itemprop="telephone" href="tel:${esc(d.telephone.replace(/\s/g, ''))}">${esc(d.telephone)}</a>`);
		if (d.email) links.push(`${meta('email', d.email)}<a class="ui-button" href="mailto:${esc(d.email)}">Email</a>`);
		if (links.length) html += `<nav data-part="actions">${links.join(' ')}</nav>`;
		return html;
	},

	comparison(d) {
		let html = meta('numberOfItems', d.items?.length);
		if (d.items?.length) {
			html += `<ul data-part="options">${d.items.map((item, index) =>
				`<li${scope('itemListElement', 'ListItem')}>
					${meta('position', index + 1)}
					${item.image ? `<img src="${esc(item.image)}" alt=""${IMG ? attrs({ srcset: fixedSrcset(item.image, 48), decoding: 'async' }) : ''} itemprop="image" loading="lazy" width="48" height="48">` : ''}<label><span itemprop="name">${esc(item.name)}</span>${item.price ? ` — ${esc(item.price)}` : ''}</label>
					${item.score != null ? `<progress max="100" value="${esc(item.score)}"></progress>` : ''}${item.scoreDisplay ? ` <span>${esc(item.scoreDisplay)}</span>` : ''}
				</li>`
			).join('')}</ul>`;
		}
		if (d.recommendation) html += `<footer data-part="footer">Recommended: ${esc(d.recommendation)}${d.summary ? ` — ${esc(d.summary)}` : ''}</footer>`;
		return html;
	},

	contact(d) {
		/* languages are a LIST — one availableLanguage each, not a joined string */
		const langs = Array.isArray(d.languages) ? d.languages : String(d.languages || '').split(/,\s*/).filter(Boolean);
		let html = meta('contactType', d.contactType) + meta('hoursAvailable', d.availableHours)
			+ langs.map((lang) => meta('availableLanguage', lang)).join('');
		const bits = [d.department, d.availableHoursDisplay, langs.join(', '), d.responseTime ? `Replies ${d.responseTime}` : null].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${esc(bits)}</p>`;
		if (d.contactMethods?.length) {
			html += `<nav data-part="actions">${d.contactMethods.map((method, index) => contactLink(method, index === 0)).join(' ')}</nav>`;
		}
		return html;
	},

	location(d) {
		let html = '';
		html += geoPart(d.geo);
		html += addressPart(d.address);
		/* Place has openingHoursSpecification but NOT the flat openingHours string */
		if (d.openingHours?.length) html += hoursPart(d.openingHours, { flat: false });
		else if (d.hours) html += `<p data-part="meta">${esc(d.hours)}</p>`;
		html += ratingPart('aggregateRating', 'AggregateRating', d.rating);
		/* amenityFeature wants LocationFeatureSpecification scopes — plain list, no itemprop */
		html += listPart(d.amenities);
		if (d.contact) html += `<p data-part="meta"><a itemprop="telephone" href="tel:${esc(String(d.contact).replace(/\s/g, ''))}">${esc(d.contact)}</a></p>`;
		const map = mapUrl(d.geo);
		if (map) html += `<nav data-part="actions"><a class="ui-button" data-variant="accent" href="${esc(map)}"${/^geo:/.test(map) ? '' : ' target="_blank" rel="noopener"'}>Open in Maps</a></nav>`;
		return html;
	},

	membership(d) {
		let html = eligibleDuration(d.trialPeriod);
		if (d.isPopular) html += `<p data-part="meta"><ui-chip theme="pale accent">${esc(d.popularText || 'Most popular')}</ui-chip></p>`;
		if (d.price) {
			html += `<p data-part="price"${scope('priceSpecification', 'PriceSpecification')}>${meta('priceCurrency', d.price.currency)}${priceValue(d.price.currency, d.price.monthly)}/mo ${d.price.yearly ? `<small>or ${fmtPrice(d.price.currency, d.price.yearly)}/yr${d.price.savings ? ` — ${esc(d.price.savings)}` : ''}</small>` : ''}</p>`;
		}
		html += listPart(d.features, { itemprop: 'includesObject' });
		html += listPart(d.limitations, { crossed: true });
		if (d.trialText) html += `<p data-part="meta">${esc(d.trialText)}</p>`;
		return html;
	},

	social(d, fields, parts = {}, itemtype = null, owned = NO_PROPS) {
		let html = d.platform ? `<div${scope('publisher', 'Organization')} hidden>${meta('name', d.platform)}</div>` : '';
		if (d.author) {
			/* the envelope's authors[] already declares author on this item; a second scope
			   would be a second Person. The name stays visible, the microdata does not
			   repeat — details.author is the byline FALLBACK, not a second author. */
			const name = owned.has('author')
				? esc(d.author)
				: `<span${scope('author', 'Person')}><span itemprop="name">${esc(d.author)}</span></span>`;
			html += `<p data-part="meta">${name}${d.platform ? ` · ${esc(d.platform)}` : ''}</p>`;
		}
		return html;
	},

	software(d) {
		let html = meta('applicationCategory', d.applicationCategory)
			+ (d.operatingSystem || []).map((os) => meta('operatingSystem', os)).join('');
		if (d.version) html += `<p data-part="meta"><ui-chip theme="pale accent">v<span itemprop="softwareVersion">${esc(d.version)}</span></ui-chip></p>`;
		html += `<p data-part="meta">${esc((d.operatingSystem || []).join(' · '))}${d.fileSize ? ` · ${esc(d.fileSize)}` : ''}</p>`;
		if (d.developer?.name) {
			html += `<p data-part="meta"${scope('author', 'Organization')}>Developer: <span itemprop="name">${esc(d.developer.name)}</span>${d.developer.website ? meta('url', d.developer.website) : ''}</p>`;
		}
		const req = d.systemRequirements;
		if (req) {
			/* softwareRequirements is free text in schema.org — one readable line */
			const line = typeof req === 'string' ? req : [req.processor, req.ram ? `${req.ram} RAM` : null, req.storage ? `${req.storage} free` : null].filter(Boolean).join(' · ');
			if (line) html += meta('softwareRequirements', line) + `<p data-part="meta">Requires ${esc(line)}</p>`;
		}
		if (d.price) {
			html += `<p data-part="price"${scope('offers', 'Offer')}>${meta('priceCurrency', d.price.currency)}${meta('availability', SCHEMA + 'InStock')}${priceValue(d.price.currency, d.price.current)}${d.price.note ? ` <small>${esc(d.price.note)}</small>` : ''}</p>`;
		}
		return html;
	},

	organization(d) {
		let html = meta('foundingDate', d.foundingDate)
			+ (d.sameAs || []).map((url) => meta('sameAs', url)).join('')
			+ (d.numberOfEmployees != null ? `<span${scope('numberOfEmployees', 'QuantitativeValue')} hidden>${meta('value', d.numberOfEmployees)}</span>` : '');
		/* escaped per component — num() already returns HTML-safe output */
		const bits = [d.numberOfEmployees != null ? `${num(d.numberOfEmployees)} employees` : null, d.foundingDateDisplay ? `Founded ${esc(d.foundingDateDisplay)}` : null].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${bits}</p>`;
		html += geoViaPlace(d.headquarters?.geo) + addressPart(d.headquarters?.address);
		if (d.email) html += `<p data-part="meta">${meta('email', d.email)}<a href="mailto:${esc(d.email)}">${esc(d.email)}</a></p>`;
		/* each local office is a department → LocalBusiness (Google's multi-location pattern),
		   with its own coordinates so each branch geocodes independently */
		for (const office of d.offices || []) {
			const contacts = [
				office.telephone ? `<a itemprop="telephone" href="tel:${esc(office.telephone.replace(/\s/g, ''))}">${esc(office.telephone)}</a>` : '',
				office.email ? `${meta('email', office.email)}<a href="mailto:${esc(office.email)}">${esc(office.email)}</a>` : ''
			].filter(Boolean);
			html += `<div data-part="office"${scope('department', 'LocalBusiness')}>
				<strong itemprop="name">${esc(office.name)}</strong>
				${geoPart(office.geo)}${addressPart(office.address)}${contacts.length ? `<p data-part="meta">${contacts.join('<br>')}</p>` : ''}${hoursPart(office.openingHours)}
			</div>`;
		}
		return html;
	},

	video(d) {
		/* machine duration/uploadDate ride the media item (rootVideoMetas) — details are display + creator */
		let html = '';
		if (d.durationDisplay || d.viewsDisplay) {
			html += `<p data-part="meta">${d.durationDisplay ? `<ui-chip theme="pale accent">${esc(d.durationDisplay)}</ui-chip>` : ''}${d.viewsDisplay ? ` ${esc(d.viewsDisplay)}` : ''}</p>`;
		}
		if (d.creator?.name) html += `<p data-part="meta"${scope('creator', 'Person')}>By <span itemprop="name">${esc(d.creator.name)}</span></p>`;
		return html;
	},

	howto(d, fields, parts = {}) {
		let html = meta('totalTime', d.totalTime)
			+ (d.estimatedCost ? `<span${scope('estimatedCost', 'MonetaryAmount')} hidden>${meta('currency', d.estimatedCost.currency)}${meta('value', d.estimatedCost.value)}</span>` : '');
		/* escaped per component — fmtPrice() already returns HTML-safe output */
		const bits = [d.totalTime ? `Takes ${esc(duration(d.totalTime))}` : null, d.estimatedCost ? `~${fmtPrice(d.estimatedCost.currency, d.estimatedCost.value)}` : null, d.difficulty ? esc(d.difficulty) : null].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${bits}</p>`;
		if (d.supplies?.length || d.tools?.length) {
			html += `<ul data-part="list">${(d.supplies || []).map((item) => `<li${scope('supply', 'HowToSupply')}><span itemprop="name">${esc(item)}</span></li>`).join('')}${(d.tools || []).map((item) => `<li${scope('tool', 'HowToTool')}><span itemprop="name">${esc(item)}</span></li>`).join('')}</ul>`;
		}
		if (d.steps?.length) {
			const steps = accordion('howto-step', d.steps.map((step, index) => ({
				summary: `${step.name ? `<span itemprop="name">${esc(step.name)}</span>` : `Step ${index + 1}`}${meta('position', index + 1)}`,
				body: `<div><p itemprop="text">${esc(step.text)}</p></div>`,
				scopeAttrs: scope('step', 'HowToStep'),
				icon: 'chevron right'
			})), 'divided');
			html += accordion('howto-acc', [{ summary: 'Steps', body: steps }], parts.accordion);
		}
		return html;
	},

	qa(d, fields, parts = {}) {
		/* accepted answer leads, rest by votes; answers are third-party voice → ui-quote
		   (same convention as review/social/claim), the chip carries the accepted state */
		const answers = [...(d.answers || [])].sort((a, b) =>
			(b.accepted ? 1 : 0) - (a.accepted ? 1 : 0) || (b.upvotes || 0) - (a.upvotes || 0));
		if (!d.question && !answers.length) return '';
		let html = `<div${scope('mainEntity', 'Question')}>${meta('name', d.question)}${meta('answerCount', answers.length)}${d.upvotes != null ? meta('upvoteCount', d.upvotes) : ''}`;
		if (answers.length) {
			html += `<ul data-part="list">${answers.map((answer) =>
				`<li${scope(answer.accepted ? 'acceptedAnswer' : 'suggestedAnswer', 'Answer')}>${answer.upvotes != null ? meta('upvoteCount', answer.upvotes) : ''}${quotePart(answer.text, { itemprop: 'text', variant: parts.quote || null })}<small>${answer.accepted ? '<ui-chip theme="pale green">Accepted</ui-chip> ' : ''}${answer.author ? `<span${scope('author', 'Person')}><span itemprop="name">${esc(answer.author)}</span></span>` : ''}${answer.upvotes != null ? ` · ▲ ${num(answer.upvotes)}` : ''}</small></li>`
			).join('')}</ul>`;
		}
		return html + '</div>';
	},

	podcast(d) {
		let html = meta('episodeNumber', d.episodeNumber) + meta('duration', d.duration)
			+ (d.seriesName ? `<div${scope('partOfSeries', 'PodcastSeries')} hidden>${meta('name', d.seriesName)}</div>` : '')
			+ (d.audioUrl ? `<div${scope('associatedMedia', 'AudioObject')} hidden>${meta('contentUrl', d.audioUrl)}</div>` : '');
		const bits = [d.seriesName, d.episodeNumber != null ? `Episode ${d.episodeNumber}` : null, d.durationDisplay || (d.duration ? duration(d.duration) : null)].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${esc(bits)}</p>`;
		return html;
	},

	movie(d) {
		let html = meta('duration', d.duration) + meta('contentRating', d.contentRating) + meta('dateCreated', d.dateReleased);
		const bits = [d.dateReleasedDisplay, d.durationDisplay || (d.duration ? duration(d.duration) : null), d.contentRating].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${esc(bits)}</p>`;
		html += ratingPart('aggregateRating', 'AggregateRating', d.rating);
		return html + creditsPart(d);
	},

	book(d) {
		/* author byline renders EARLY via BYLINE_EARLY — rating and price follow, publisher is the colophon */
		let html = meta('isbn', d.isbn) + meta('numberOfPages', d.numberOfPages)
			+ (BOOK_FORMATS.has(d.bookFormat) ? meta('bookFormat', SCHEMA + d.bookFormat) : '');
		/* U+2060 word joiners defeat iOS tel data detectors — docs/schema.md § Book */
		/* escaped per component — num() already returns HTML-safe output */
		const format = d.bookFormatDisplay || d.bookFormat;
		const bits = [d.numberOfPages ? `${num(d.numberOfPages)} pages` : null, format ? esc(format) : null, d.isbn ? `ISBN ${esc(d.isbn.replace(/-/g, '-\u2060'))}` : null].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${bits}</p>`;
		html += ratingPart('aggregateRating', 'AggregateRating', d.rating);
		if (d.price) {
			html += `<p data-part="price"${scope('offers', 'Offer')}>${meta('priceCurrency', d.price.currency)}${meta('availability', SCHEMA + 'InStock')}${priceValue(d.price.currency, d.price.current)}</p>`;
		}
		if (d.publisher) html += `<p data-part="meta"${scope('publisher', 'Organization')}>Publisher: <span itemprop="name">${esc(d.publisher)}</span></p>`;
		return html;
	},

	dataset(d) {
		let html = meta('license', d.license) + meta('temporalCoverage', d.temporalCoverage) + meta('spatialCoverage', d.spatialCoverage)
			+ (d.variableMeasured || []).map((variable) => meta('variableMeasured', variable)).join('');
		/* display key wins — the machine ISO interval ("2019-01/2025-12") reads poorly */
		const bits = [d.temporalCoverageDisplay || d.temporalCoverage, d.spatialCoverage, d.licenseDisplay].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${esc(bits)}</p>`;
		html += listPart(d.variableMeasured);
		if (d.distribution?.length) {
			html += `<nav data-part="actions">${d.distribution.map((dist, index) =>
				`<span${scope('distribution', 'DataDownload')}>${meta('encodingFormat', dist.format)}<a class="ui-button"${index === 0 ? ' data-variant="accent"' : ''} itemprop="contentUrl" href="${esc(dist.url)}">${esc(dist.format)}</a></span>`
			).join(' ')}</nav>`;
		}
		return html;
	},

	claim(d) {
		/* verdict leads — it is the answer; the quoted claim follows */
		const verdict = d.verdict || {};
		let html = meta('datePublished', d.reviewDate);
		if (verdict.label) {
			const hue = verdict.value != null
				? verdict.value >= 4 ? 'green' : verdict.value >= 3 ? 'orange' : 'red'
				: /false|incorrect/i.test(verdict.label) ? 'red' : /true|correct/i.test(verdict.label) ? 'green' : 'orange';
			html += `<p data-part="meta"${scope('reviewRating', 'Rating')}>${verdict.value != null ? meta('ratingValue', verdict.value) : ''}${meta('bestRating', verdict.max ?? 5)}${meta('worstRating', 1)}<ui-chip theme="pale ${hue}"><span itemprop="alternateName">${esc(verdict.label)}</span></ui-chip></p>`;
		}
		if (d.claim) html += quotePart(d.claim, { itemprop: 'claimReviewed', cite: d.claimant });
		return html;
	},

	/* MemberProgram owns exactly two properties — hasTiers and hostingOrganization;
	   everything visible is Thing. The join CTA carries the programme's own `url`, so
	   it lives here rather than in the envelope actions. Docs: docs/schema.md § Loyalty */
	loyalty(d, fields, parts = {}) {
		let html = d.hostingOrganization
			? `<p data-part="meta"${scope('hostingOrganization', 'Organization')}>Run by <span itemprop="name">${esc(d.hostingOrganization)}</span></p>`
			: '';
		if (d.tiers?.length) {
			html += accordion('member-tier', d.tiers.map((tier) => {
				/* hasTierRequirement is polymorphic — free text, or a MonetaryAmount scope */
				const amount = tier.requirementAmount;
				const requirement = amount
					? `<span${scope('hasTierRequirement', 'MonetaryAmount')}>${meta('currency', amount.currency)}${meta('value', amount.value)}${fmtPrice(amount.currency, amount.value)}</span>`
					: tier.requirement ? `<span itemprop="hasTierRequirement">${esc(tier.requirement)}</span>` : '';
				const benefits = (tier.benefits || []).map((benefit) =>
					`<li>${TIER_BENEFITS.has(benefit.type) ? meta('hasTierBenefit', SCHEMA + benefit.type) : ''}${esc(benefit.text)}</li>`).join('');
				return {
					/* the points value belongs to the TIER and rides the summary: <summary>
					   must be the first child, so a <meta> cannot precede it. Google lists
					   `url` as recommended on each TIER, not only on the programme. */
					summary: `<span itemprop="name">${esc(tier.name)}</span>${meta('membershipPointsEarned', tier.pointsEarned)}${meta('url', tier.url)}`,
					body: `<div>${requirement ? `<p data-part="meta">Joining: ${requirement}${tier.requirementNote ? ` ${esc(tier.requirementNote)}` : ''}</p>` : ''}${benefits ? `<ul data-part="list">${benefits}</ul>` : ''}</div>`,
					scopeAttrs: scope('hasTiers', 'MemberProgramTier')
				};
			}), parts.accordion);
		}
		if (d.joinUrl) html += `<nav data-part="actions"><a class="ui-button" data-variant="accent" itemprop="url" href="${esc(d.joinUrl)}">${esc(d.joinText || 'Join')}</a></nav>`;
		return html;
	},

	/* eduQuestionType is a QUESTION property — Quiz owns none of its own. Two shapes
	   share this renderer and `details.format` chooses between them EXPLICITLY: a
	   flashcard deck (Google Education Q&A, live) or a graded multiple-choice set
	   (Google Practice Problems, retired January 2026 — still valid schema.org).
	   Docs: docs/schema.md § Quiz */
	quiz(d, fields, parts = {}) {
		const cards = d.cards || [];
		const format = quizFormat(d);
		const words = QUIZ_FORMATS[format];
		const graded = format === 'multiple-choice';
		let html = meta('learningResourceType', words.resource)
			+ (d.subject ? `<div${scope('educationalAlignment', 'AlignmentObject')} hidden>${meta('alignmentType', 'educationalSubject')}${meta('targetName', d.subject)}</div>` : '');
		const noun = graded ? 'question' : 'card';
		const bits = [
			d.subject ? `Subject: <span${scope('about', 'Thing')}><span itemprop="name">${esc(d.subject)}</span></span>` : null,
			cards.length ? `${cards.length} ${noun}${cards.length === 1 ? '' : 's'}` : null,
			d.pace ? esc(d.pace) : null
		].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${bits}</p>`;
		if (!cards.length) return html;
		if (!graded) {
			/* an ungraded deck that carries options means the author meant the graded
			   shape and forgot to say so — skipping is loud, as with product variants */
			if (cards.some((card) => card.options?.length)) html += '<!-- options ignored: details.format is not multiple-choice -->';
			return html + accordion('quiz-card', cards.map((card) => ({
				summary: `<span itemprop="text">${esc(card.question)}</span>${meta('eduQuestionType', words.question)}`,
				/* the answer is authored PROSE — the one field of this type the reference page
				   marks up inline (<em>). Questions and options stay plain: they are labels. */
				body: `<div${scope('acceptedAnswer', 'Answer')}><p itemprop="text">${renderInline(card.answer)}</p></div>`,
				scopeAttrs: scope('hasPart', 'Question')
			})), parts.accordion);
		}
		/* Graded: every option is an Answer — the correct one as acceptedAnswer, the
		   rest as suggestedAnswer (the shape DETAILS.qa already uses). Grading is
		   CSS-only: EVERY option carries a verdict chip, hidden until its own radio is
		   checked, so only the reader's pick is ever graded and the key stays unread
		   (content.css § options). The chips sit outside any itemprop, so they add no
		   properties to the Answer. aria-live rides the <ul> — role="status" would
		   replace the list role. One radio group per question, named off the deck, in a
		   <fieldset> whose <legend> IS the question, so every option is announced under
		   it; the legend must come first, so eduQuestionType follows it. */
		const group = `quiz-${slug(plain(fields.headline))}`;
		cards.forEach((card, index) => {
			const name = `${group}-q${index + 1}`;
			const options = (card.options || []).map((option, position) =>
				`<li${scope(option.correct ? 'acceptedAnswer' : 'suggestedAnswer', 'Answer')}>${meta('position', position + 1)}
					<label><input type="radio" class="--check" name="${esc(name)}"> <span itemprop="text">${esc(option.text)}</span></label> ${option.correct ? '<ui-chip data-verdict="correct" theme="pale green">Correct</ui-chip>' : '<ui-chip data-verdict="wrong" theme="pale red">Wrong</ui-chip>'}
				</li>`).join('');
			html += `<fieldset${scope('hasPart', 'Question')}>
				<legend itemprop="text">${esc(card.question)}</legend>${meta('eduQuestionType', words.question)}
				${options ? `<ul data-part="options" aria-live="polite">${options}</ul>` : ''}
			</fieldset>`;
		});
		return html;
	},

	/* OfferCatalog is an ItemList, so itemListElement is the nesting property; the
	   scope is a bare <div> because a <meta itemprop="name"> cannot be a child of <ul>.
	   servicePhone expects a ContactPoint, not a phone string. Docs: schema.md § Service */
	service(d) {
		let html = meta('serviceType', d.serviceType);
		const provider = d.provider ? `<span${scope('provider', 'Organization')}><span itemprop="name">${esc(d.provider)}</span></span>` : '';
		const area = d.areaServed ? `<span${scope('areaServed', 'Place')}><span itemprop="name">${esc(d.areaServed)}</span></span>` : '';
		if (provider || area) html += `<p data-part="meta">${provider}${provider && area ? ' · serving ' : ''}${area}</p>`;
		const catalog = d.catalog;
		if (catalog?.items?.length) {
			html += `<div${scope('hasOfferCatalog', 'OfferCatalog')}>${meta('name', catalog.name)}<ul data-part="list">${catalog.items.map((item) =>
				`<li${scope('itemListElement', 'Offer')}>${meta('priceCurrency', item.currency)}<span${scope('itemOffered', 'Service')}><span itemprop="name">${esc(item.name)}</span></span> — ${priceValue(item.currency, item.price)}${catalog.period ? `/${esc(catalog.period)}` : ''}</li>`
			).join('')}</ul></div>`;
		}
		const channel = d.channel;
		if (channel) {
			const links = [
				channel.url ? `<a class="ui-button" data-variant="accent" itemprop="serviceUrl" href="${esc(channel.url)}">${esc(channel.urlText || 'Get in touch')}</a>` : '',
				channel.telephone ? `<span${scope('servicePhone', 'ContactPoint')}>${meta('contactType', channel.contactType)}<a class="ui-button" itemprop="telephone" href="tel:${esc(String(channel.telephone).replace(/\s/g, ''))}">${esc(channel.telephone)}</a></span>` : ''
			].filter(Boolean);
			html += `<div${scope('availableChannel', 'ServiceChannel')}>${(channel.languages || []).map((lang) => meta('availableLanguage', lang)).join('')}${meta('processingTime', channel.processingTime)}${links.length ? `<nav data-part="actions">${links.join(' ')}</nav>` : ''}</div>`;
		}
		return html;
	},

	/* RealEstateListing is a WebPage: the home hangs off mainEntity. `offers` is NOT
	   valid on Accommodation/Place, so the price rides the LISTING, outside that scope.
	   Every strictly-numeric property emits its machine value via <meta> with the unit
	   words in a separate text node. Docs: docs/schema.md § Real estate */
	realestate(d) {
		let html = meta('datePosted', d.datePosted);
		if (d.price) {
			html += `<p data-part="price"${scope('offers', 'Offer')}>${meta('priceCurrency', d.price.currency)}${meta('availability', availabilityUrl(d.availability || 'in stock'))}${priceValue(d.price.currency, d.price.amount)}${d.price.note ? ` <small>${esc(d.price.note)}</small>` : ''}</p>`;
		}
		const home = d.property;
		if (home) {
			const numbered = (prop, value, text) => value == null || value === '' ? null : `${meta(prop, value)}${text}`;
			const facts = [
				home.floorSize != null
					? `<span${scope('floorSize', 'QuantitativeValue')}>${meta('unitCode', home.floorSizeUnit || 'MTK')}${meta('value', home.floorSize)}${num(home.floorSize)} ${esc(home.floorSizeLabel || 'm²')}</span>`
					: null,
				numbered('numberOfBedrooms', home.bedrooms, `${num(home.bedrooms)} bedroom${home.bedrooms === 1 ? '' : 's'}`),
				numbered('numberOfBathroomsTotal', home.bathrooms, `${num(home.bathrooms)} bathroom${home.bathrooms === 1 ? '' : 's'}`),
				numbered('numberOfRooms', home.rooms, `${num(home.rooms)} room${home.rooms === 1 ? '' : 's'}`),
				/* esc(), not num(): a year is not a quantity — num() would print "2,018" */
				numbered('yearBuilt', home.yearBuilt, `built ${esc(home.yearBuilt)}`)
			].filter(Boolean).join(' · ');
			const amenities = home.amenities?.length
				? `<ul data-part="list">${home.amenities.map((amenity) =>
					`<li${scope('amenityFeature', 'LocationFeatureSpecification')}>${meta('value', 'true')}<span itemprop="name">${esc(amenity)}</span></li>`).join('')}</ul>`
				: '';
			html += `<div${scope('mainEntity', RESIDENCE_TYPES.has(home.type) ? home.type : 'Accommodation')}>`
				+ meta('name', home.name) + meta('floorLevel', home.floorLevel) + meta('petsAllowed', home.petsAllowed)
				+ (facts ? `<p data-part="meta">${facts}</p>` : '')
				+ addressPart(home.address) + amenities + '</div>';
		}
		const bits = [d.datePostedDisplay ? `Listed ${esc(d.datePostedDisplay)}` : null, d.agent ? esc(d.agent) : null, d.viewings ? esc(d.viewings) : null].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${bits}</p>`;
		return html;
	},

	/* Menu and MenuSection are CreativeWorks; MenuItem is an Intangible — which is why
	   only the ITEM gets offers/nutrition/suitableForDiet. Docs: docs/schema.md § Menu */
	menu(d, fields, parts = {}) {
		let html = '';
		if (d.sections?.length) {
			html += accordion('menu-section', d.sections.map((section) => ({
				summary: `<span itemprop="name">${esc(section.name)}</span>`,
				body: `<div><ul data-part="list">${(section.items || []).map(menuItem).join('')}</ul></div>`,
				scopeAttrs: scope('hasMenuSection', 'MenuSection')
			})), parts.accordion);
		}
		if (d.note) html += `<footer data-part="footer">${esc(d.note)}</footer>`;
		return html;
	},

	tvseries(d) {
		let html = meta('numberOfSeasons', d.numberOfSeasons) + meta('numberOfEpisodes', d.numberOfEpisodes)
			+ meta('startDate', d.startDate) + meta('contentRating', d.contentRating);
		const year = startYear(d.startDate);
		const bits = [
			d.numberOfSeasons != null ? `${num(d.numberOfSeasons)} season${d.numberOfSeasons === 1 ? '' : 's'}` : null,
			d.numberOfEpisodes != null ? `${num(d.numberOfEpisodes)} episode${d.numberOfEpisodes === 1 ? '' : 's'}` : null,
			year ? `since ${esc(year)}` : null,
			d.contentRating ? `rated ${esc(d.contentRating)}` : null
		].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${bits}</p>`;
		html += ratingPart('aggregateRating', 'AggregateRating', d.rating) + creditsPart(d);
		/* containsSeason's range is CreativeWorkSeason, which TVSeason satisfies.
		   The superseded actors/episodes/seasons spellings are never emitted. */
		return html + scopedList((d.seasons || []).map((season) =>
			`<li${scope('containsSeason', 'TVSeason')}>${meta('seasonNumber', season.seasonNumber)}${meta('numberOfEpisodes', season.numberOfEpisodes)}<span itemprop="name">${esc(season.name)}</span>${season.display ? ` — ${esc(season.display)}` : ''}</li>`
		), d.ordered ?? true);
	},

	/* episodeNumber/partOfSeason/partOfSeries/duration are all inherited from Episode —
	   a renderer that looks them up on TVEpisode will not find them documented there */
	tvepisode(d) {
		let html = meta('episodeNumber', d.episodeNumber) + meta('duration', d.duration) + meta('datePublished', d.datePublished)
			+ (d.seriesName ? `<div${scope('partOfSeries', 'TVSeries')} hidden>${meta('name', d.seriesName)}</div>` : '')
			+ (d.season ? `<div${scope('partOfSeason', 'TVSeason')} hidden>${meta('seasonNumber', d.season.seasonNumber)}${meta('name', d.season.name)}</div>` : '');
		const bits = [
			d.season?.seasonNumber != null && d.episodeNumber != null ? `Season ${num(d.season.seasonNumber)}, episode ${num(d.episodeNumber)}` : null,
			d.durationDisplay ? esc(d.durationDisplay) : d.duration ? esc(duration(d.duration)) : null,
			d.datePublishedDisplay ? esc(d.datePublishedDisplay) : null
		].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${bits}</p>`;
		return html + creditsPart(d);
	},

	/* specialty/reviewedBy/lastReviewed are WebPage properties MedicalWebPage merely
	   inherits; medicalAudience is its only own usable one. The reviewedBy byline is
	   VISIBLE markup, never a hidden meta — a signal a reader cannot see is not an
	   E-E-A-T signal. Docs: docs/schema.md § Health */
	medical(d) {
		let html = (MEDICAL_SPECIALTIES.has(d.specialty) ? meta('specialty', SCHEMA + d.specialty) : '')
			+ meta('lastReviewed', d.lastReviewed);
		if (d.audience?.name) {
			html += `<div${scope('medicalAudience', MEDICAL_AUDIENCES.has(d.audience.type) ? d.audience.type : 'MedicalAudience')} hidden>${meta('name', d.audience.name)}</div>`;
		}
		if (d.about?.name) {
			const aspects = (d.about.aspects || [])
				.filter((aspect) => Object.hasOwn(MEDICAL_ASPECTS, aspect.type))
				.map((aspect) => `<li${scope(aspect.type, MEDICAL_ASPECTS[aspect.type])}><span itemprop="name">${esc(aspect.text)}</span></li>`).join('');
			html += `<div${scope('about', MEDICAL_ABOUT_TYPES.has(d.about.type) ? d.about.type : 'MedicalCondition')}>${meta('name', d.about.name)}${aspects ? `<ul data-part="list">${aspects}</ul>` : ''}</div>`;
		}
		if (d.reviewedBy?.name) {
			const dateline = d.lastReviewed
				? `<small data-part="dateline"><span>${esc(d.reviewedLabel || 'Medically reviewed')}</span><time datetime="${esc(d.lastReviewed)}">${esc(d.lastReviewedDisplay || d.lastReviewed)}</time></small>`
				: '';
			html += byline([d.reviewedBy], 'reviewedBy', dateline);
		}
		if (d.disclaimer) html += `<footer data-part="footer">${esc(d.disclaimer)}</footer>`;
		return html;
	},

	/* numTracks and track come from MusicPlaylist, the album's parent (`tracks` is
	   superseded). numTracks DERIVES from the track list unless stated: a hand-kept
	   count silently goes stale, and the field survives only for partial listings.
	   Docs: docs/schema.md § Album */
	music(d) {
		const tracks = d.tracks || [];
		const numTracks = d.numTracks ?? (tracks.length || null);
		let html = meta('numTracks', numTracks) + meta('datePublished', d.datePublished)
			+ (ALBUM_PRODUCTION_TYPES.has(d.productionType) ? meta('albumProductionType', SCHEMA + d.productionType) : '')
			+ (ALBUM_RELEASE_TYPES.has(d.releaseType) ? meta('albumReleaseType', SCHEMA + d.releaseType) : '');
		const bits = [
			numTracks != null ? `${num(numTracks)} track${numTracks === 1 ? '' : 's'}` : null,
			d.durationDisplay ? esc(d.durationDisplay) : null,
			d.datePublishedDisplay ? `released ${esc(d.datePublishedDisplay)}` : null
		].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${bits}</p>`;
		html += scopedList(tracks.map((track, index) =>
			`<li${scope('track', 'MusicRecording')}>${meta('position', track.position ?? index + 1)}${meta('duration', track.duration)}<span itemprop="name">${esc(track.name)}</span>${track.durationDisplay ? ` <small>${esc(track.durationDisplay)}</small>` : ''}</li>`
		), d.ordered ?? true);
		if (d.note) html += `<footer data-part="footer">${esc(d.note)}</footer>`;
		return html;
	},

	/* DefinedTerm is an Intangible, DefinedTermSet a CreativeWork; both are still
	   pending.schema.org. Docs: docs/schema.md § Glossary */
	glossary(d, fields, parts = {}) {
		let html = d.about ? `<div${scope('about', 'Thing')} hidden>${meta('name', d.about)}</div>` : '';
		if (d.terms?.length) {
			html += accordion('glossary', d.terms.map((term) => ({
				summary: `<span itemprop="name">${esc(term.name)}</span>${meta('termCode', term.termCode)}`,
				/* the definition is authored PROSE — inline markup allowed (<code>); the term
				   NAME above stays plain, because it is the DefinedTerm's machine-read name */
				body: `<div><p itemprop="description">${renderInline(term.description)}</p></div>`,
				scopeAttrs: scope('hasDefinedTerm', 'DefinedTerm')
			})), parts.accordion);
		}
		if (d.note) html += `<footer data-part="footer">${esc(d.note)}</footer>`;
		return html;
	},

	/* There is NO episode-count property on PodcastSeries — the count is prose and the
	   machine answer is the hasPart cardinality. webFeed rides a real <a href> so the
	   feed is crawlable. Docs: docs/schema.md § Podcast series */
	podcastseries(d) {
		let html = meta('startDate', d.startDate);
		const year = startYear(d.startDate);
		const bits = [
			d.cadence ? esc(d.cadence) : null,
			d.episodeCount != null ? `${num(d.episodeCount)} episode${d.episodeCount === 1 ? '' : 's'}${year ? ` since ${esc(year)}` : ''}` : null,
			d.feed?.url ? `<a itemprop="webFeed" href="${esc(d.feed.url)}">${esc(d.feed.text || 'RSS feed')}</a>` : null
		].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${bits}</p>`;
		if (d.host?.name) html += byline([d.host], 'author');
		/* newest first by convention — descending rows must NOT get ordinal markers */
		html += scopedList((d.episodes || []).map((episode) =>
			`<li${scope('hasPart', 'PodcastEpisode')}>${meta('episodeNumber', episode.episodeNumber)}${meta('duration', episode.duration)}<span itemprop="name">${esc(episode.name)}</span>${episode.durationDisplay ? ` <small>${esc(episode.durationDisplay)}</small>` : ''}</li>`
		), d.ordered ?? false);
		if (d.note) html += `<footer data-part="footer">${esc(d.note)}</footer>`;
		return html;
	}
};

/* types whose subheadline row is a schema SCOPE rather than plain envelope text:
   profile's jobTitle/organization, music's byArtist → MusicGroup */
const SUBHEADLINE_SLOT = {
	profile: (d, textTag) => d?.jobTitle
		? `<${textTag} data-part="subheadline"><span itemprop="jobTitle">${esc(d.jobTitle)}</span>${d.organization ? ` · <span${scope('worksFor', 'Organization')}><span itemprop="name">${esc(d.organization)}</span></span>` : ''}</${textTag}>`
		: '',
	music: (d, textTag) => d?.artist
		? `<${textTag} data-part="subheadline"${scope('byArtist', 'MusicGroup')}><span itemprop="name">${esc(d.artist)}</span></${textTag}>`
		: ''
};

/* byline-early types: author identity precedes the commerce details (book).
   A preset's byline: "lede" opts any type in — the full-article shape. */
const BYLINE_EARLY = new Set(['book']);

/* full content column for a card (envelope + details + trailers) */
/* `itemtype` is the bare schema.org name ACTUALLY WRITTEN on the enclosing scope —
   threaded down so a DETAILS renderer can gate subtype-only properties on it. It is
   not always resolveItemtype(fields): a flipside column renders into the HOST's
   scope. Docs: docs/schema.md § Product */
const contentColumn = (fields, type, overlay, extras = '', textMode = 'summary', parts = {}, bylineMode = 'tail', headingTag = 'h3', itemtype = null) => {
	const slots = {};
	if (SUBHEADLINE_SLOT[type] && fields.details) {
		slots.subheadline = SUBHEADLINE_SLOT[type](fields.details, overlay ? 'span' : 'p');
	}
	let tailFields = fields;
	const lede = bylineMode === 'lede';
	if ((lede || BYLINE_EARLY.has(type)) && fields.authors?.length) {
		/* lede: above the body, carrying the dateline. book: after the envelope,
		   before the commerce details. Either way the tail keeps neither. */
		const early = byline(fields.authors, 'author', lede ? datelinePart(fields) : '');
		if (lede) slots.byline = early;
		tailFields = lede ? { ...fields, authors: null, published: null, readingTime: null } : { ...fields, authors: null };
		if (!lede) slots.after = early;
	}
	let html = buildContent(fields, type, overlay, slots, textMode, parts, headingTag) + (slots.after || '');
	if (DETAILS[type] && fields.details) html += DETAILS[type](fields.details, fields, parts, itemtype, envelopeProps(fields, type));
	html += buildTail(tailFields, type);
	return html + extras;
};

/* ── reveal composition (<ui-reveal>) — used when preset.element is ui-reveal ── */

/* Back panel derived from the host card's own envelope + details. */
const derivedBack = (fields, type, itemtype) => {
	let html = fields.eyebrow ? `<small data-part="eyebrow">${esc(fields.eyebrow)}</small>` : '';
	/* version rides the details chip, not the headline */
	html += `<h3 data-part="headline">${renderInline(fields.headline)}</h3>`;
	if (fields.summary) html += `<p data-part="summary" itemprop="${SUMMARY_PROP[type] || 'description'}">${esc(fields.summary)}</p>`;
	html += bodyHtml(fields, type);
	/* eyebrow: false — the back panel prints the eyebrow WITHOUT an itemprop (the front
	   face and the back share the host's one itemscope), so it claims no property here */
	if (DETAILS[type] && fields.details) html += DETAILS[type](fields.details, fields, {}, itemtype, envelopeProps(fields, type, { eyebrow: false }));
	html += buildTail({ ...fields, published: null, readingTime: null }, type);
	return html;
};

/* Back panel from a referenced flipside card — a content column only, never
   another reveal, so flipside chains cannot recurse. Shares the host's itemscope.
   Backs are the "full" face: summary + body both render. */
const flipsideBack = (flipside, itemtype) => {
	const fields = flipside?.fields ?? flipside ?? {};
	const type = baseType(fields);
	/* itemtype is the HOST's — this column shares the host's itemscope */
	return contentColumn(fields, type, false, '', 'both', {}, 'tail', 'h3', itemtype);
};

/* ── per-type face composition ──
   The generic reveal is one item shown twice: a teaser front, a fuller back, both in
   the HOST's scope. Some types split along a property boundary that shape cannot
   express — a flashcard's question is on the front and its acceptedAnswer on the back,
   and both belong to a Question that is neither the host nor either face, so the scope
   has to sit on the <details> that wraps them. An entry owns exactly the pieces
   renderReveal cannot derive: `front` and `back` ({ attrs, html }) are required, the
   `host` ({ attrs, html }) and `details` attribute contributions are optional.
   renderReveal still composes the elements. Returning null declines — the generic derivedBack/flipsideBack path
   runs — so an entry only has to answer for the records it can actually shape.
   Keyed like DETAILS, by base type. Docs: docs/schema.md § Quiz */
const REVEAL_FACES = {
	/* Flashcard: <details> carries the Question scope because eduQuestionType is on the
	   front and acceptedAnswer is the back, and both are Question properties. The Quiz's
	   own properties stay machine metadata on the host — the visible headline is the
	   QUESTION (itemprop="text"), so the Quiz name never reaches a face. */
	quiz(fields, { preset }) {
		const d = fields.details || {};
		const cards = d.cards || [];
		/* only the flashcard shape has two faces: a graded question needs its options
		   visible WITH the question, which is one face, not two */
		if (quizFormat(d) !== 'flashcard' || !cards.length) return null;
		const words = QUIZ_FORMATS.flashcard;
		const card = cards[0];
		return {
			/* content= rides the HOST here, not the front face: scl() has to reach the
			   question and the answer, which are two different elements */
			host: {
				attrs: { content: preset.content || null },
				html: meta('name', plain(fields.headline)) + meta('learningResourceType', words.resource)
					+ (d.subject ? `<div${scope('about', 'Thing')} hidden>${meta('name', d.subject)}</div>`
						+ `<div${scope('educationalAlignment', 'AlignmentObject')} hidden>${meta('alignmentType', 'educationalSubject')}${meta('targetName', d.subject)}</div>` : '')
					/* a reveal has one front and one back, so the rest of a deck has nowhere
					   to go — skipping is loud, as with product variants */
					+ (cards.length > 1 ? `<!-- ${cards.length - 1} of ${cards.length} flashcards not rendered: a reveal shows one question — a deck needs a ui-card preset -->` : '')
			},
			details: { itemprop: 'hasPart', itemscope: true, itemtype: `${SCHEMA}Question` },
			/* the front face renders inside <summary>, which takes phrasing content —
			   a heading tag there is invalid, so the headline part rides a <span> */
			front: { attrs: {}, html: `${fields.eyebrow ? `<small data-part="eyebrow">${esc(fields.eyebrow)}</small>` : ''}
					<span data-part="headline" itemprop="text">${esc(card.question)}</span>
					${meta('eduQuestionType', words.question)}` },
			/* the answer is authored PROSE (docs/schema.md § Quiz), and its panel reads as
			   a second surface — the same call as the graded verdict chips' themes */
			back: {
				attrs: { itemprop: 'acceptedAnswer', itemscope: true, itemtype: `${SCHEMA}Answer`, theme: 'gray ink', content: 'pad(lg)' },
				html: `<p data-part="summary" itemprop="text">${renderInline(card.answer)}</p>`
			}
		};
	}
};

const renderReveal = (fields, type, schemaType, tokens, preset, flipside, cardId = null) => {
	const itemtype = SCHEMA + schemaType;
	const media = buildMedia(fields, type, tokens, preset, {}, cardId);
	/* the type's own composition, if it has one and accepts this record */
	const faces = REVEAL_FACES[type]?.(fields, { preset, type, schemaType, itemtype }) || null;
	const back = faces ? faces.back.html : flipside ? flipsideBack(flipside, schemaType) : derivedBack(fields, type, schemaType);
	const reveal = preset.reveal || {};
	/* reveal config → variant tokens. The preset keeps friendly editor values
	   ("slide", "left", "top right sm"); the emitted animation token carries its
	   own direction/origin — type+from fold into ONE token: slide+left → sld(lft),
	   flip+top → flp(top); expand → exp; scale → grw (origin follows ico()).
	   Icon placement folds into a corner token (ico(te) = top end). */
	const anim = RVL_TOKEN[reveal.type] || reveal.type || 'flp';
	const dir = reveal.from && RVL_DIRECTED.has(anim) ? FRM_TOKEN[reveal.from] || reveal.from : null;
	const revealTokens = [
		dir ? `${anim}(${dir})` : anim,
		reveal.typeLg ? `lg:${RVL_TOKEN[reveal.typeLg] || reveal.typeLg}` : null,
		reveal.to ? 'pop' : null,
		reveal.trigger ? 'trg(card)' : null,
		reveal.scroll ? 'scr' : null,
		...iconTokens('ico', reveal.icon || RVL_ICON),
		...iconTokens('icc', reveal.iconClose),
	].filter(Boolean);
	/* media=/content= sit on the primitives they configure; variant=/theme= on the host */
	const column = faces ? `<ui-content${attrs(faces.front.attrs)}>${faces.front.html}</ui-content>` : `<ui-content${attrs({ content: preset.content || null })}>
			${fields.eyebrow ? `<small data-part="eyebrow">${esc(fields.eyebrow)}</small>` : ''}
			<strong data-part="headline" itemprop="${headlineProp(fields, type)}">${renderInline(fields.headline)}</strong>
			${fields.details?.version ? `<span data-part="meta"><ui-chip theme="pale accent">v<span itemprop="softwareVersion">${esc(fields.details.version)}</span></ui-chip></span>` : ''}
		</ui-content>`;
	const inner = `${withMedia(media?.html || '', mergeMediaTokens(preset.media, tokens.media))}
		${column}`;
	/* <ui-face> only where the animation transforms the front face; exp animates the host */
	const front = RVL_FACED.has(anim) ? `<ui-face>${inner}</ui-face>` : inner;
	/* trg(card) makes the whole summary the trigger — no toggle icon */
	const icon = reveal.trigger ? '' : `<ui-icon type="${esc(reveal.iconType || 'plus-cross')}" aria-hidden="true"></ui-icon>`;
	return `<ui-reveal${attrs({
		variant: [preset.variant, ...revealTokens].filter(Boolean).join(' '),
		theme: preset.theme || null,
		...(faces?.host?.attrs || {}),
		style: styleAttr(preset.styles),
		itemscope: true,
		itemtype
	})}>${faces?.host?.html || ''}
		<details${attrs({ name: reveal.name || null, ...(faces?.details || {}) })}>
			<summary>${front}${icon}</summary>
			<ui-content${attrs(faces?.back.attrs || { tabindex: '0' })}>${back}${media?.extras || ''}</ui-content>
		</details>
	</ui-reveal>`;
};

/* ── public API ── */

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
 * Render one card from a UCF instance (or its bare `fields` object) to an HTML string.
 * The look & feel comes from the referenced card-preset — pass the preset map from
 * loadPresets(). Unknown/missing references fall back to a plain stack card.
 * @param {object} ucf — UCF file content ({ fields }) or the fields object itself
 * @param {object} [presets] — id → preset map (from data/card.presets.json)
 * @param {object} [cards] — id → UCF map for resolving card references (flipside)
 * @param {object} [options] — { images: { cdnBase?, breakpoints?, format?, quality?, fit?, sizes? }, typeChip?: boolean }
 *        `images` arms the Cloudflare srcset pipeline; omit it and images render exactly as before.
 *        `sizes` is the computed fallback list (lazy frames get `auto, ` prepended).
 *        `typeChip` adds a <ui-chip data-type> naming the resolved schema.org type on each frame.
 * @returns {string} HTML for <ui-card>, <ui-reveal>, or a bare primitive
 */
export function renderCard(ucf, presets = {}, cards = {}, options = null) {
	setImages(options?.images);
	TYPE_CHIP = !!options?.typeChip;
	const fields = ucf?.fields ?? ucf ?? {};
	const cardId = ucf?.id || null;
	const type = baseType(fields);
	/* resolved ONCE: schemaType is what gets written, and what DETAILS renderers gate on */
	const schemaType = resolveItemtype(fields);
	const itemtype = SCHEMA + schemaType;
	const preset = resolvePreset(fields, presets);
	const tokens = { media: [] };

	if (preset.element === 'ui-reveal') {
		return renderReveal(fields, type, schemaType, tokens, preset, resolveCard(fields.flipside, cards), cardId);
	}

	/* Bare <ui-media> — a standalone media frame, no card chrome. The media
	   token string sits on the element itself (rds() applies outside a card). */
	if (preset.element === 'ui-media') {
		const caption = fields.media?.find((item) => item.caption)?.caption;
		const media = buildMedia(fields, type, tokens, preset, {}, cardId);
		const inner = (media?.html || '<ui-media></ui-media>')
			.replace('<ui-media', `<ui-media${attrs({
				media: mergeMediaTokens(preset.media, tokens.media) || null,
				style: styleAttr(preset.styles),
				itemscope: true,
				itemtype
			})}`)
			.replace('</ui-media>', `${fields.headline ? meta('name', plain(fields.headline)) : ''}${caption ? `<small data-part="caption">${esc(caption)}</small>` : ''}${media?.extras || ''}</ui-media>`);
		return inner;
	}

	/* Bare <ui-content> — a standalone content column, no card chrome. */
	if (preset.element === 'ui-content') {
		return `<ui-content${attrs({
			content: preset.content || null,
			style: styleAttr(preset.styles),
			itemscope: true,
			itemtype
		})}>${contentColumn(fields, type, false, '', preset.text || 'summary', preset.parts || {}, preset.byline || 'tail', preset.headingTag, schemaType)}</ui-content>`;
	}

	const media = buildMedia(fields, type, tokens, preset, {}, cardId);
	const overlay = /ovr\(/.test(preset.variant || '');
	/* media=/content= sit on the primitives they configure; variant=/theme= on the host */
	return `<ui-card${attrs({
		variant: preset.variant || 'col',
		theme: preset.theme || null,
		style: styleAttr(preset.styles),
		itemscope: true,
		itemtype
	})}>
		<cq-box>
			${withMedia(media?.html || '', mergeMediaTokens(preset.media, tokens.media))}
			<ui-content${attrs({ content: preset.content || null })}>${contentColumn(fields, type, overlay, media?.extras || '', preset.text || 'summary', preset.parts || {}, preset.byline || 'tail', preset.headingTag, schemaType)}</ui-content>
		</cq-box>
	</ui-card>`;
}

/**
 * Fetch a UCF file and render it.
 * @param {string} url
 * @param {object} [presets] — id → preset map
 * @param {object} [cards] — id → UCF map for card references
 * @param {object} [options] — see renderCard()
 * @returns {Promise<string>}
 */
export async function renderCardFrom(url, presets = {}, cards = {}, options = null) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
	return renderCard(await response.json(), presets, cards, options);
}

export default renderCard;
