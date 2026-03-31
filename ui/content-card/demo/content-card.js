/**
 * content-card — Unified content card web component
 *
 * Attributes:
 *   type      — Schema.org card type (article, recipe, event, etc.)
 *   content   — ID matching a card in the data source
 *   card      — Base layout tokens: "vertical ar(16/9) eyebrow(above)"
 *   card-md   — Layout tokens at container width >= 400px
 *   card-xl   — Layout tokens at container width >= 700px
 */

const SCHEMA_MAP = {
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
  gallery: 'MediaGallery',
  statistic: 'Observation',
  achievement: 'EducationalOccupationalCredential',
  announcement: 'SpecialAnnouncement',
  business: 'LocalBusiness',
  comparison: 'Table',
  contact: 'ContactPoint',
  location: 'TouristDestination',
  membership: 'Offer',
  social: 'SocialMediaPosting',
  software: 'SoftwareApplication'
};

/* ── Token Parser ── */
function parseTokens(attrValue) {
  if (!attrValue) return null;
  const str = attrValue.trim();
  const tokens = { layout: 'vertical', eyebrow: null, subgrid: false };
  const layoutMatch = str.match(/^(vertical-r|vertical|horizontal-r|horizontal|overlay\([^)]+\)|media-only|content-only)/);
  if (layoutMatch) tokens.layout = layoutMatch[1];
  const eyebrowMatch = str.match(/eyebrow\(([^)]+)\)/);
  if (eyebrowMatch) tokens.eyebrow = eyebrowMatch[1];
  if (str.includes('subgrid')) tokens.subgrid = true;
  return tokens;
}

/* ── Schema helper: hidden meta tag ── */
function meta(prop, content) {
  if (content == null || content === '') return '';
  return `<meta itemprop="${prop}" content="${content}">`;
}

/* ── Reusable render helpers (with microdata) ── */

function renderAuthors(authors) {
  if (!authors?.length) return '';
  return authors.map(a => `
    <address itemprop="author" itemscope itemtype="https://schema.org/Person">
      <div class="cc-author">
        <div class="cc-author-info">
          <span class="cc-author-name" itemprop="name">${a.name}</span>
          ${a.role ? `<span class="cc-author-role" itemprop="jobTitle">${a.role}</span>` : ''}
        </div>
      </div>
    </address>
  `).join('');
}

function renderStars(value, max = 5) {
  const filled = Math.round(value);
  return '\u2605'.repeat(filled) + '\u2606'.repeat(max - filled);
}

function renderRating(rating, reviewer) {
  if (!rating) return '';
  return `
    <div class="cc-rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
      ${meta('worstRating', '1')}${meta('bestRating', rating.max || 5)}
      <span class="cc-stars" itemprop="ratingValue" content="${rating.value}">${renderStars(rating.value, rating.max || 5)}</span>
      <span class="cc-rating-count">${rating.value}/${rating.max || 5}</span>
      ${reviewer ? `<span class="cc-verified" itemprop="author" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${reviewer.name}</span>${reviewer.verified ? ' \u2713' : ''}</span>` : ''}
    </div>
  `;
}

function renderPrice(price, wrapOffer = true) {
  if (!price) return '';
  const currency = price.currency || '';
  const inner = `
    ${meta('priceCurrency', currency)}
    <div class="cc-price">
      <span class="cc-price-current" itemprop="price" content="${price.current ?? price.monthly ?? price.hourlyRate ?? ''}">${currency} ${price.current ?? price.monthly ?? price.hourlyRate ?? ''}</span>
      ${price.original ? `<span class="cc-price-original">${currency} ${price.original}</span>` : ''}
      ${price.discountText ? `<span class="cc-price-discount">${price.discountText}</span>` : ''}
    </div>
  `;
  return wrapOffer
    ? `<div itemprop="offers" itemscope itemtype="https://schema.org/Offer">${inner}${meta('availability', 'https://schema.org/InStock')}</div>`
    : inner;
}

function renderMetaRow(items) {
  if (!items?.length) return '';
  const html = items
    .filter(([, v]) => v != null && v !== '')
    .map(([label, value]) => `<span class="cc-meta-item"><span class="cc-detail-label">${label}</span> ${value}</span>`)
    .join('');
  return html ? `<div class="cc-meta">${html}</div>` : '';
}

function renderCheckList(items, crossed = false) {
  if (!items?.length) return '';
  const cls = crossed ? 'cc-check-list cc-check-list--x' : 'cc-check-list';
  return `<ul class="${cls}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}

function renderAddress(addr) {
  if (!addr) return '';
  return `
    <div itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
      <address class="cc-address">
        ${addr.streetAddress ? `<span itemprop="streetAddress">${addr.streetAddress}</span>, ` : ''}
        ${addr.addressLocality ? `<span itemprop="addressLocality">${addr.addressLocality}</span>, ` : ''}
        ${addr.addressRegion ? `<span itemprop="addressRegion">${addr.addressRegion}</span> ` : ''}
        ${addr.postalCode ? `<span itemprop="postalCode">${addr.postalCode}</span> ` : ''}
        ${addr.addressCountry ? meta('addressCountry', addr.addressCountry) : ''}
      </address>
    </div>
  `;
}

function renderContactMethods(methods) {
  if (!methods?.length) return '';
  return `<div class="cc-contact-methods">${methods.map(m => {
    const prop = m.type === 'email' ? 'email' : m.type === 'phone' ? 'telephone' : 'contactPoint';
    return `<a class="cc-contact-method" itemprop="${prop}" href="${m.type === 'email' ? 'mailto:' : m.type === 'phone' ? 'tel:' : '#'}${m.value}"><span class="cc-contact-icon">${m.type}</span><span>${m.label || m.value}</span></a>`;
  }).join('')}</div>`;
}

function renderMap(geoData, businessName = 'business location') {
  if (!geoData?.mapProvider?.url) return '';
  const lat = parseFloat(geoData.latitude);
  const lng = parseFloat(geoData.longitude);
  const mp = geoData.mapProvider;
  const latOffset = mp.latOffset || 0.003;
  const lngOffset = mp.lngOffset || 0.005;
  const mapUrl = mp.url
    .replace('{lat}', lat).replace('{lng}', lng)
    .replace('{lat1}', lat - latOffset).replace('{lat2}', lat + latOffset)
    .replace('{lng1}', lng - lngOffset).replace('{lng2}', lng + lngOffset)
    .replace('{zoom}', mp.zoom || 15);
  const providerName = mp.name || mp.type || 'Map';
  return `<iframe class="cc-business-map" src="${mapUrl}" loading="lazy" title="${providerName} showing ${businessName}"></iframe>`;
}

function renderAvailability(availability) {
  if (!availability) return '';
  const cls = availability.toLowerCase().includes('in') ? 'in-stock'
    : availability.toLowerCase().includes('low') ? 'low-stock' : 'out-of-stock';
  return `<span class="cc-availability cc-availability--${cls}">${availability}</span>`;
}

/* ── Type-specific renderers (with full Schema.org microdata) ── */

const TYPE_RENDERERS = {
  article(d, content, category, cardData) {
    const parts = [];
    if (category) parts.push(meta('articleSection', category));
    if (content?.published?.datetime) parts.push(meta('datePublished', content.published.datetime));
    if (content?.modified) parts.push(meta('dateModified', content.modified));
    /* Header row with time + reading time */
    const headerItems = [];
    if (content?.published?.formatted) headerItems.push(`<time class="cc-meta-item" datetime="${content.published.datetime || ''}">${content.published.formatted}</time>`);
    if (content?.readingTime) headerItems.push(`<span class="cc-meta-item">${content.readingTime}</span>`);
    if (headerItems.length) parts.push(`<div class="cc-meta">${headerItems.join('')}</div>`);
    parts.push(renderAuthors(cardData?.authors));
    return parts.join('');
  },

  news(d, content, category, cardData) {
    return TYPE_RENDERERS.article(d, content, category, cardData);
  },

  recipe(d, content, category, cardData) {
    return meta('recipeCategory', category) + meta('prepTime', d?.prepTime) + meta('cookTime', d?.cookTime) + meta('recipeYield', d?.servings)
      + renderMetaRow([['Prep', d?.prepTime], ['Cook', d?.cookTime], ['Servings', d?.servings]])
      + (content?.text?.length
        ? `<details class="cc-collapsible"><summary>Ingredients</summary><div class="cc-collapsible-body"><ul itemprop="recipeIngredient">${content.text.map(i => `<li>${i}</li>`).join('')}</ul></div></details>`
        : '')
      + (d?.instructions?.length
        ? `<details class="cc-collapsible"><summary>Instructions</summary><div class="cc-collapsible-body"><ol class="cc-ordered-list" itemprop="recipeInstructions" itemscope itemtype="https://schema.org/ItemList">${d.instructions.map((s, i) => `<li itemprop="itemListElement" itemscope itemtype="https://schema.org/HowToStep">${meta('position', i + 1)}<span itemprop="text">${s}</span></li>`).join('')}</ol></div></details>`
        : '')
      + renderAuthors(cardData?.authors);
  },

  product(d, content, category, cardData) {
    const availUrl = d?.availability?.toLowerCase().includes('in')
      ? 'https://schema.org/InStock'
      : d?.availability?.toLowerCase().includes('low')
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/OutOfStock';
    return meta('category', category)
      + (d?.price
        ? `<div class="cc-price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            ${meta('priceCurrency', d.price.currency)}
            <span class="cc-price-current" itemprop="price" content="${d.price.current}">${d.price.currency || ''} ${d.price.current}</span>
            ${d.price.original ? `<span class="cc-price-original">${d.price.currency || ''} ${d.price.original}</span>` : ''}
            ${d.price.discountText ? `<span class="cc-price-discount">${d.price.discountText}</span>` : ''}
            ${meta('availability', availUrl)}
            ${meta('itemCondition', 'https://schema.org/NewCondition')}
          </div>`
        : '')
      + renderAvailability(d?.availability)
      + renderMetaRow([['SKU', cardData?.sku], ['Valid until', d?.validUntil]]);
  },

  review(d) {
    const parts = [];
    /* Rating with stars */
    if (d?.rating) {
      parts.push(`
        <div class="cc-rating" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
          ${meta('ratingValue', d.rating.value)}${meta('bestRating', d.rating.max || 5)}${meta('worstRating', '1')}
          <div class="cc-stars" role="img" aria-label="Rating: ${d.rating.value} out of ${d.rating.max || 5} stars">
            <span aria-hidden="true">${renderStars(d.rating.value, d.rating.max || 5)}</span>
            <span class="cc-rating-count">(${d.rating.value}/${d.rating.max || 5})</span>
          </div>
        </div>
      `);
    }
    /* Reviewer as author */
    if (d?.reviewer) {
      parts.push(`
        <div itemprop="author" itemscope itemtype="https://schema.org/Person">
          <div class="cc-author">
            <div class="cc-author-info">
              <span class="cc-author-name" itemprop="name">${d.reviewer.name}</span>
              ${d.reviewer.verified ? '<span class="cc-verified" title="Verified Purchase">\u2713 Verified</span>' : ''}
            </div>
          </div>
        </div>
      `);
    }
    /* Review date */
    if (d?.reviewDate) {
      parts.push(`<time itemprop="datePublished" datetime="${d.reviewDate}">${d.reviewDate}</time>`);
    }
    /* Reviewed item with nested hidden aggregateRating + Offer */
    if (d?.productReviewed) {
      parts.push(`
        <div itemprop="itemReviewed" itemscope itemtype="https://schema.org/Product">
          <span itemprop="name">${d.productReviewed}</span>
          <div itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating" style="display:none">
            ${meta('ratingValue', d.rating?.value)}${meta('ratingCount', '1')}${meta('bestRating', d.rating?.max || 5)}${meta('worstRating', '1')}
          </div>
        </div>
      `);
    }
    return parts.join('');
  },

  event(d) {
    const loc = d?.location || {};
    return meta('eventStatus', d?.status ? `https://schema.org/EventStatus${d.status}` : '')
      + meta('eventAttendanceMode', 'https://schema.org/OfflineEventAttendanceMode')
      + meta('startDate', d?.startDate)
      + meta('endDate', d?.endDate)
      + renderMetaRow([['Date', d?.startDate], ['Status', d?.status]])
      + (loc.name
        ? `<div class="cc-meta" itemprop="location" itemscope itemtype="https://schema.org/Place">
            <span itemprop="name">${loc.name}</span>
            ${loc.address ? `<span itemprop="address" itemscope itemtype="https://schema.org/PostalAddress"><span itemprop="streetAddress">${loc.address}</span></span>` : ''}
          </div>`
        : '')
      + (d?.organizer?.name ? `<div class="cc-meta" itemprop="organizer" itemscope itemtype="https://schema.org/Organization"><span class="cc-detail-label">Organizer</span> <span itemprop="name">${d.organizer.name}</span></div>` : '');
  },

  job(d, content, category) {
    const sal = d?.salaryRange;
    return meta('industry', category)
      + meta('datePosted', new Date().toISOString().split('T')[0])
      + (d?.company ? `<div itemprop="hiringOrganization" itemscope itemtype="https://schema.org/Organization">${meta('name', d.company)}</div>` : '')
      + (d?.location ? `<div itemprop="jobLocation" itemscope itemtype="https://schema.org/Place"><span itemprop="name">${d.location}</span>${meta('address', d.location)}</div>` : '')
      + (d?.employmentType ? meta('employmentType', d.employmentType) : '')
      + (d?.applicationDeadline ? meta('validThrough', d.applicationDeadline) : '')
      + renderMetaRow([['Company', d?.company], ['Location', d?.location], ['Type', d?.employmentType], ['Apply by', d?.applicationDeadline]])
      + (sal
        ? `<div class="cc-salary" itemprop="baseSalary" itemscope itemtype="https://schema.org/MonetaryAmount">
            ${meta('currency', sal.currency)}
            <span itemprop="value" itemscope itemtype="https://schema.org/QuantitativeValue">
              ${meta('minValue', sal.min)}${meta('maxValue', sal.max)}${meta('unitText', sal.period || 'YEAR')}
              ${sal.currency || ''}${sal.min?.toLocaleString?.() ?? sal.min}\u2013${sal.max?.toLocaleString?.() ?? sal.max}
            </span>
            <span class="cc-salary-period">${sal.period || 'annually'}</span>
          </div>`
        : '')
      + (d?.qualifications?.length
        ? `<details class="cc-collapsible"><summary>Requirements</summary><div class="cc-collapsible-body"><ul class="cc-check-list" itemprop="qualifications">${d.qualifications.map(q => `<li>${q}</li>`).join('')}</ul></div></details>`
        : '')
      + (d?.benefits?.length ? `<details class="cc-collapsible"><summary>Benefits</summary><div class="cc-collapsible-body">${renderCheckList(d.benefits)}</div></details>` : '');
  },

  course(d, content, category) {
    return meta('about', category)
      + (d?.duration ? meta('timeRequired', d.duration) : '')
      + (d?.difficultyLevel ? meta('educationalLevel', d.difficultyLevel) : '')
      + `<div itemprop="hasCourseInstance" itemscope itemtype="https://schema.org/CourseInstance" style="display:none">${meta('courseMode', 'Online')}</div>`
      + renderMetaRow([['Duration', d?.duration], ['Level', d?.difficultyLevel], ['Instructor', d?.instructor?.name]])
      + (d?.instructor ? `<div itemprop="provider" itemscope itemtype="https://schema.org/Organization">${meta('name', d.instructor.name)}</div>` : '')
      + (d?.price
        ? `<div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            ${meta('priceCurrency', d.price.currency)}
            <div class="cc-price">
              <span class="cc-price-current" itemprop="price" content="${d.price.current}">${d.price.currency || ''} ${d.price.current}</span>
              ${d.price.original ? `<span class="cc-price-original">${d.price.currency || ''} ${d.price.original}</span>` : ''}
            </div>
            ${meta('availability', 'https://schema.org/InStock')}
            ${meta('category', category)}
          </div>`
        : '')
      + (d?.prerequisites?.length ? `<details class="cc-collapsible"><summary>Prerequisites</summary><div class="cc-collapsible-body"><ul class="cc-bullet-list">${d.prerequisites.map(p => `<li>${p}</li>`).join('')}</ul></div></details>` : '');
  },

  booking(d) {
    const price = d?.price;
    return (d?.serviceName ? `<div itemprop="reservationFor" itemscope itemtype="https://schema.org/Service">${meta('name', d.serviceName)}</div>` : '')
      + (d?.venue ? `<div itemprop="provider" itemscope itemtype="https://schema.org/Organization">${meta('name', d.venue)}</div>` : '')
      + renderMetaRow([['Service', d?.serviceName], ['Venue', d?.venue], ['Capacity', d?.capacity], ['Duration', d?.duration], ['Cancellation', d?.cancellationPolicy]])
      + (price ? `<div class="cc-price">${meta('priceCurrency', price.currency)}${meta('totalPrice', price.hourlyRate)}<span class="cc-price-current">${price.currency || ''} ${price.hourlyRate}/hr</span></div>` : '')
      + (d?.amenities?.length ? `<details class="cc-collapsible"><summary>Amenities</summary><div class="cc-collapsible-body">${renderCheckList(d.amenities)}</div></details>` : '');
  },

  profile(d) {
    const parts = [];
    if (d?.jobTitle) parts.push(`<div class="cc-meta-item" itemprop="jobTitle">${d.jobTitle}</div>`);
    if (d?.organization) parts.push(`<div itemprop="worksFor" itemscope itemtype="https://schema.org/Organization"><span class="cc-meta-item" itemprop="name">${d.organization}</span></div>`);
    if (d?.location) parts.push(`<div class="cc-meta-item" itemprop="address">${d.location}</div>`);
    if (d?.bio) parts.push(`<p class="cc-post-content" itemprop="description">${d.bio}</p>`);
    if (d?.skills?.length) parts.push(`<div class="cc-skills">${d.skills.map(s => `<span class="cc-skill">${s}</span>`).join('')}</div>`);
    if (d?.contacts?.length) {
      parts.push(`<div class="cc-contact-methods">${d.contacts.map(m => {
        const href = m.type === 'email' ? `mailto:${m.value}` : m.type === 'phone' ? `tel:${m.value}` : m.value;
        return `<a class="cc-contact-method" itemprop="contactPoint" href="${href}"><span class="cc-contact-icon">${m.type}</span><span>${m.label || m.value}</span></a>`;
      }).join('')}</div>`);
    }
    return parts.join('');
  },

  quote(d, content, category, cardData) {
    return renderAuthors(cardData?.authors);
  },

  faq(d, content) {
    const items = content?.text;
    if (!items?.length) return '';
    return `<div class="cc-faq">${items.map(item => `
      <details itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
        <summary itemprop="name">${item.headline}</summary>
        <div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
          <p class="cc-faq-answer" itemprop="text">${item.text}</p>
        </div>
      </details>
    `).join('')}</div>`;
  },

  poll(d, content) {
    const items = content?.text;
    const poll = d || {};
    if (!items?.length) return '';
    const total = poll.totalVotes || 0;
    return `<div class="cc-poll">${items.map(item => {
      const votes = parseInt(item.text) || 0;
      const pct = total ? Math.round((votes / total) * 100) : 0;
      return `
        <label class="cc-poll-option" itemprop="suggestedAnswer" itemscope itemtype="https://schema.org/Answer">
          <input type="radio" name="poll">
          <span itemprop="text">${item.headline}</span>
          <div class="cc-poll-bar" style="width:${pct}%"></div>
          <span class="cc-poll-pct">${pct}%</span>
        </label>`;
    }).join('')}
      <span class="cc-poll-total">${total} votes</span>
    </div>`;
  },

  gallery(d) {
    return renderMetaRow([['Album', d?.albumName], ['Photos', d?.totalCount]])
      + (d?.categories?.length ? `<div class="cc-tags">${d.categories.map(c => `<span class="cc-tag">${c}</span>`).join('')}</div>` : '');
  },

  timeline(d, content) {
    const items = content?.text;
    if (!items?.length) return '';
    return `<ol class="cc-timeline">${items.map(item => `
      <li itemprop="subEvent" itemscope itemtype="https://schema.org/Event">
        <div class="cc-timeline-date" itemprop="name">${item.headline}</div>
        <div class="cc-timeline-text" itemprop="description">${item.text}</div>
      </li>
    `).join('')}</ol>`;
  },

  statistic(d) {
    const trendCls = d?.trend === 'up' ? 'up' : d?.trend === 'down' ? 'down' : 'flat';
    return `
      <div itemprop="value" itemscope itemtype="https://schema.org/QuantitativeValue">
        ${d?.metricName ? `<span class="cc-detail-label" itemprop="name">${d.metricName}</span>` : ''}
        <span class="cc-stat-value"><span itemprop="value" content="${d?.currentValue ?? ''}">${d?.currentValue ?? ''}</span>${d?.unit ? `<span class="cc-stat-unit" itemprop="unitText">${d.unit}</span>` : ''}</span>
      </div>
      ${d?.trend ? `<span class="cc-trend cc-trend--${trendCls}"><span class="cc-trend-arrow--${trendCls}"></span>${d.trendPercentage ?? ''}%</span>` : ''}
    `;
  },

  achievement(d) {
    return (d?.issuingOrganization ? `<div itemprop="recognizedBy" itemscope itemtype="https://schema.org/Organization"><span class="cc-meta-item"><span class="cc-detail-label">Issued by</span> <span itemprop="name">${d.issuingOrganization}</span></span></div>` : '')
      + renderMetaRow([['Earned', d?.dateEarned], ['Expires', d?.expirationDate], ['Level', d?.skillLevel], ['ID', d?.credentialId]])
      + (d?.dateEarned ? meta('dateCreated', d.dateEarned) : '')
      + (d?.expirationDate ? meta('expires', d.expirationDate) : '')
      + (d?.skillLevel ? meta('educationalLevel', d.skillLevel) : '')
      + (d?.credentialId ? meta('identifier', d.credentialId) : '')
      + (d?.verificationUrl ? `<a href="${d.verificationUrl}" class="cc-btn cc-btn--secondary">Verify credential</a>` : '');
  },

  announcement(d) {
    const eff = d?.effectiveDate;
    return meta('datePosted', new Date().toISOString().split('T')[0])
      + meta('spatialCoverage', 'Global')
      + (eff?.start ? meta('datePublished', eff.start) : '')
      + (eff?.end ? meta('expires', eff.end) : '')
      + (d?.priority ? `<span class="cc-priority cc-priority--${d.priority}">${d.priority}</span>` : '')
      + renderMetaRow([['Type', d?.announcementType], ['From', eff?.start], ['Until', eff?.end]])
      + (d?.targetAudience ? `<div itemprop="audience" itemscope itemtype="https://schema.org/Audience"><span class="cc-meta-item"><span class="cc-detail-label">Audience</span> <span itemprop="audienceType">${d.targetAudience}</span></span></div>` : '')
      + (d?.actionRequired ? `<span class="cc-detail" style="font-weight:var(--fw-bold,700);color:var(--cc-accent)">Action required: ${d.actionRequired}</span>` : '');
  },

  business(d) {
    return renderAddress(d?.address)
      + renderMap(d?.geo, d?.address?.addressLocality || 'business location')
      + (d?.telephone ? `<a class="cc-contact-method" itemprop="telephone" href="tel:${d.telephone}"><span class="cc-contact-icon">phone</span>${d.telephone}</a>` : '')
      + (d?.email ? `<a class="cc-contact-method" itemprop="email" href="mailto:${d.email}"><span class="cc-contact-icon">email</span>${d.email}</a>` : '')
      + (d?.website ? meta('url', d.website) : '')
      + (d?.openingHours?.length
        ? `<div class="cc-hours">${d.openingHours.map(h => `${meta('openingHours', h.schema)}<div class="cc-hours-row">${h.display}</div>`).join('')}</div>`
        : '');
  },

  comparison(d) {
    if (!d?.items?.length) return '';
    return `<div class="cc-comparison-items">${d.items.map(item => `
      <div class="cc-comparison-item${item.name === d.recommendation ? ' cc-comparison-item--recommended' : ''}">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy">` : ''}
        <span class="cc-comparison-name">${item.name}</span>
        <span class="cc-comparison-price">${item.price ?? ''}</span>
      </div>
    `).join('')}</div>`
      + (d?.recommendation ? `<span class="cc-popular">Recommended: ${d.recommendation}</span>` : '')
      + (d?.summary ? `<p class="cc-detail">${d.summary}</p>` : '');
  },

  contact(d) {
    return (d?.contactType ? meta('contactType', d.contactType) : '')
      + (d?.availableHours ? meta('hoursAvailable', d.availableHours) : '')
      + renderMetaRow([['Type', d?.contactType], ['Hours', d?.availableHours], ['Response', d?.responseTime]])
      + renderContactMethods(d?.contactMethods);
  },

  location(d) {
    return renderAddress(d?.address)
      + renderMetaRow([['Hours', d?.hours], ['Contact', d?.contact]])
      + (d?.amenities?.length ? `<details class="cc-collapsible"><summary>Amenities</summary><div class="cc-collapsible-body">${renderCheckList(d.amenities)}</div></details>` : '');
  },

  membership(d) {
    const price = d?.price;
    return (d?.isPopular ? '<span class="cc-popular">Most Popular</span>' : '')
      + renderMetaRow([['Plan', d?.planName], ['Trial', d?.trialPeriod]])
      + (d?.trialPeriod ? meta('eligibleDuration', d.trialPeriod) : '')
      + (price
        ? `<div itemscope itemtype="https://schema.org/PriceSpecification">
            ${meta('priceCurrency', price.currency)}${meta('price', price.monthly)}
            <div class="cc-price">
              <span class="cc-price-current">${price.currency || ''} ${price.monthly}/mo</span>
              ${price.yearly ? `<span class="cc-detail">${price.currency || ''} ${price.yearly}/yr</span>` : ''}
            </div>
          </div>`
        : '')
      + (d?.features?.length ? `<ul class="cc-check-list" itemprop="includesObject">${d.features.map(f => `<li>${f}</li>`).join('')}</ul>` : '')
      + (d?.limitations?.length ? renderCheckList(d.limitations, true) : '');
  },

  social(d) {
    return meta('datePublished', new Date().toISOString())
      + (d?.platform ? `<div itemprop="publisher" itemscope itemtype="https://schema.org/Organization"><span class="cc-platform" itemprop="name">${d.platform}</span></div>` : '')
      + (d?.author ? `<div itemprop="author" itemscope itemtype="https://schema.org/Person"><div class="cc-author"><div class="cc-author-info"><span class="cc-author-name" itemprop="name">${d.author}</span></div></div></div>` : '')
      + (d?.postContent ? `<div class="cc-post-content" itemprop="text">${d.postContent}</div>` : '')
      + (d?.hashtags?.length ? `<div class="cc-hashtags">${d.hashtags.map(h => `<span>#${h}</span>`).join(' ')}</div>` : '');
  },

  software(d) {
    const dev = d?.developer;
    return (d?.version ? meta('softwareVersion', d.version) : '')
      + (d?.applicationCategory ? meta('applicationCategory', d.applicationCategory) : '')
      + renderMetaRow([['Version', d?.version], ['Category', d?.applicationCategory], ['OS', d?.operatingSystem?.join(', ')]])
      + (d?.operatingSystem?.length ? d.operatingSystem.map(os => meta('operatingSystem', os)).join('') : '')
      + (dev ? `<div itemprop="author" itemscope itemtype="https://schema.org/Organization">${meta('url', dev.website)}<span class="cc-meta-item"><span class="cc-detail-label">Developer</span> <span itemprop="name">${dev.name}</span></span></div>` : '')
      + renderPrice(d?.price);
  }
};

/* ── Render Helpers ── */

function renderImage(source, addItemprop = false) {
  const alt = source.alt || '';
  const src = source.src || '';
  return `<img src="${src}" alt="${alt}" loading="lazy"${addItemprop ? ' itemprop="image"' : ''}>`;
}

function renderMedia(data) {
  const media = data.media;
  if (!media?.sources?.length) return '';

  const cardData = data.data || {};
  const ribbon = cardData.ribbon;
  const sticker = cardData.sticker;
  const caption = media.caption;
  const isGallery = media.sources.length > 1;

  let inner;
  if (isGallery) {
    const slides = media.sources
      .map((s, i) => `<div class="cc-gallery-slide">${renderImage(s, i === 0)}</div>`)
      .join('');
    const dots = media.sources
      .map((_, i) => `<button class="cc-gallery-dot${i === 0 ? ' cc-gallery-dot--active' : ''}"></button>`)
      .join('');
    inner = `
      <div class="cc-gallery">${slides}</div>
      <button class="cc-gallery-arrow cc-gallery-arrow--prev">&#x2192;</button>
      <button class="cc-gallery-arrow cc-gallery-arrow--next">&#x2192;</button>
      <div class="cc-gallery-dots">${dots}</div>
    `;
  } else {
    inner = renderImage(media.sources[0], true);
  }

  return `
    <figure class="cc-media${isGallery ? ' cc-media--gallery' : ''}">
      ${ribbon ? `<span class="cc-ribbon">${ribbon.text}</span>` : ''}
      ${sticker ? `<span class="cc-sticker">${sticker.text}</span>` : ''}
      ${inner}
      ${caption ? `<span class="cc-caption">${caption}</span>` : ''}
    </figure>
  `;
}

function renderContent(data, headlineTag = 'h2', skipEyebrow = false, clickable = null) {
  const { headline, subheadline, summary, category, tags, actions, links } = data;
  const isStretched = clickable !== null && links?.length === 1 && links[0].url;
  const hideLink = clickable === 'hide';

  const parts = [];
  const cardData = data.data || {};
  const type = cardData.type;

  /* Schema.org headline prop varies by type */
  const HEADLINE_NAME_TYPES = ['recipe', 'product', 'event', 'course', 'booking', 'profile', 'quote', 'faq', 'gallery', 'timeline', 'statistic', 'achievement', 'announcement', 'business', 'comparison', 'contact', 'location', 'membership', 'social', 'software', 'poll'];
  const headlineProp = (type === 'job') ? 'title' : HEADLINE_NAME_TYPES.includes(type) ? 'name' : 'headline';
  const summaryProp = (type === 'review') ? 'reviewBody' : 'description';

  if (category && !skipEyebrow) {
    parts.push(`<span class="cc-eyebrow">${category}</span>`);
  }

  if (headline) {
    parts.push(`<${headlineTag} class="cc-headline" itemprop="${headlineProp}">${headline}</${headlineTag}>`);
  }

  if (subheadline) {
    parts.push(`<p class="cc-subheadline">${subheadline}</p>`);
  }

  /* For quote type, summary is the quote text */
  if (summary) {
    if (type === 'quote') {
      parts.push(`<blockquote class="cc-blockquote" itemprop="text">${summary}<cite class="cc-citation">${data.data?.authors?.[0]?.name || ''}</cite></blockquote>`);
    } else {
      parts.push(`<p class="cc-summary" itemprop="${summaryProp}">${summary}</p>`);
    }
  }

  /* Type-specific content — pass category for schema meta */
  const typeData = cardData[type];
  const renderer = type && TYPE_RENDERERS[type];
  if (renderer) {
    const typeHtml = renderer(typeData, cardData.content, category, cardData);
    if (typeHtml) parts.push(typeHtml);
  }

  if (tags?.length) {
    const tagHtml = tags.map(t => {
      const name = typeof t === 'string' ? t : t.name;
      return `<span class="cc-tag">${name}</span>`;
    }).join('');
    parts.push(`<div class="cc-tags">${tagHtml}</div>`);
  }

  if (actions?.length) {
    const btns = actions.map(a => {
      const cls = a.style === 'secondary' ? 'cc-btn cc-btn--secondary' : 'cc-btn cc-btn--primary';
      return `<a href="${a.url || '#'}" class="${cls}">${a.text}</a>`;
    }).join('');
    parts.push(`<div class="cc-actions">${btns}</div>`);
  }

  if (isStretched) {
    const link = links[0];
    const hideCls = hideLink ? ' cc-stretched-link--hidden' : '';
    parts.push(`<a href="${link.url}" class="cc-stretched-link${hideCls}">${link.text}</a>`);
  } else if (links?.length) {
    const items = links.map(l => `<li><a href="${l.url || '#'}">${l.text}</a></li>`).join('');
    parts.push(`<ul class="cc-links">${items}</ul>`);
  }

  if (parts.length === 0) return '';
  return `<div class="cc-content">${parts.join('')}</div>`;
}

/* ── Web Component ── */
export default class ContentCard extends HTMLElement {
  static observedAttributes = ['card', 'card-md', 'card-xl', 'type', 'clickable'];

  _data = null;

  constructor() {
    super();
    this.classList.add('cc');
  }

  connectedCallback() {
    if (this._data) this._render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (this._data) this._render();
    }
  }

  _applySchema() {
    const type = this.getAttribute('type');
    const schemaType = SCHEMA_MAP[type] || 'CreativeWork';
    this.setAttribute('itemscope', '');
    this.setAttribute('itemtype', `https://schema.org/${schemaType}`);
  }

  _render() {
    if (!this._data) return;

    this._applySchema();

    const baseTokens = parseTokens(this.getAttribute('card') || 'vertical');
    const headlineTag = this._data.data?.content?.headlineTag || 'h2';
    const hasEyebrowPlacement = baseTokens.eyebrow && this._data.category;

    const clickableAttr = this.getAttribute('clickable');
    const clickable = clickableAttr !== null ? (clickableAttr || true) : null;

    const mediaHtml = renderMedia(this._data);
    const contentHtml = renderContent(this._data, headlineTag, hasEyebrowPlacement, clickable);

    let eyebrowAboveHtml = '';
    let eyebrowOutsideHtml = '';

    if (hasEyebrowPlacement) {
      const eyebrowText = this._data.category;
      if (baseTokens.eyebrow === 'above') {
        eyebrowAboveHtml = `<span class="cc-eyebrow--above">${eyebrowText}</span>`;
      } else if (baseTokens.eyebrow === 'outside') {
        eyebrowOutsideHtml = `<span class="cc-eyebrow--outside">${eyebrowText}</span>`;
      }
    }

    const innerHtml = `${eyebrowAboveHtml}${mediaHtml}${contentHtml}`;
    this.textContent = '';

    if (eyebrowOutsideHtml) {
      const outsideEl = document.createElement('span');
      outsideEl.className = 'cc-eyebrow--outside';
      outsideEl.textContent = this._data.category;
      this.appendChild(outsideEl);
    }

    const inner = document.createElement('div');
    inner.className = 'cc-inner';
    inner.innerHTML = innerHtml;
    this.appendChild(inner);
  }

  set data(value) {
    this._data = value;
    if (this.isConnected) {
      this._render();
    }
  }

  get data() {
    return this._data;
  }
}

customElements.define('content-card', ContentCard);
