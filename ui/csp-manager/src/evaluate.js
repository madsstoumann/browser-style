/**
 * CSP Evaluator - Analyzes Content Security Policy directives for security issues
 * Based on simplified logic from Google's CSP Evaluator
 */

/**
 * Severity levels for findings
 */
export const SEVERITY = {
	HIGH: 'high',
	MEDIUM: 'medium',
	SECURE: 'secure'
};

/**
 * Evaluation result structure
 * @typedef {Object} Finding
 * @property {string} severity - 'high', 'medium', or 'secure'
 * @property {string} message - Description of the issue
 * @property {string} [recommendation] - Suggested fix
 */

/**
 * @typedef {Object} DirectiveEvaluation
 * @property {string} severity - Overall severity for the directive
 * @property {Finding[]} findings - Array of findings
 */

/**
 * Check if a value is an unsafe keyword
 */
const UNSAFE_KEYWORDS = {
	"'unsafe-inline'": {
		severity: SEVERITY.HIGH,
		messageKey: 'eval.unsafeInline',
		recommendationKey: 'eval.unsafeInlineRec'
	},
	"'unsafe-eval'": {
		severity: SEVERITY.HIGH,
		messageKey: 'eval.unsafeEval',
		recommendationKey: 'eval.unsafeEvalRec'
	},
	"'unsafe-hashes'": {
		severity: SEVERITY.MEDIUM,
		messageKey: 'eval.unsafeHashes',
		recommendationKey: 'eval.unsafeHashesRec'
	}
};

/**
 * Check if a value is a risky wildcard
 */
const WILDCARDS = {
	'*': {
		severity: SEVERITY.HIGH,
		messageKey: 'eval.wildcardAll',
		recommendationKey: 'eval.wildcardAllRec'
	},
	'http:': {
		severity: SEVERITY.MEDIUM,
		messageKey: 'eval.wildcardHttp',
		recommendationKey: 'eval.wildcardHttpRec'
	},
	'https:': {
		severity: SEVERITY.MEDIUM,
		messageKey: 'eval.wildcardHttps',
		recommendationKey: 'eval.wildcardHttpsRec'
	},
	'data:': {
		severity: SEVERITY.MEDIUM,
		messageKey: 'eval.dataUri',
		recommendationKey: 'eval.dataUriRec'
	}
};

/**
 * Secure patterns to look for (positive indicators)
 */
const SECURE_PATTERNS = {
	nonce: /^'nonce-[A-Za-z0-9+/=]+'$/,
	hash: /^'(sha256|sha384|sha512)-[A-Za-z0-9+/=]+'$/,
	strictDynamic: "'strict-dynamic'"
};

/**
 * Directives that are critical for security
 */
const CRITICAL_DIRECTIVES = {
	'base-uri': {
		messageKey: 'eval.missingBaseUri',
		recommendationKey: 'eval.missingBaseUriRec'
	},
	'object-src': {
		messageKey: 'eval.missingObjectSrc',
		recommendationKey: 'eval.missingObjectSrcRec'
	}
};

/**
 * Script/style related directives that need stricter evaluation
 */
const SCRIPT_STYLE_DIRECTIVES = ['script-src', 'script-src-elem', 'script-src-attr', 'style-src', 'style-src-elem', 'style-src-attr', 'default-src'];

/**
 * Evaluate a single directive's values
 * @param {string} directive - Directive name
 * @param {string[]} values - Array of directive values
 * @param {Function} t - Translation function
 * @returns {DirectiveEvaluation}
 */
export function evaluateDirective(directive, values, t) {
	const findings = [];
	let overallSeverity = SEVERITY.SECURE;

	// Check for unsafe keywords
	for (const value of values) {
		if (UNSAFE_KEYWORDS[value]) {
			const config = UNSAFE_KEYWORDS[value];
			// unsafe-inline in script/style directives is HIGH, elsewhere MEDIUM
			const severity = SCRIPT_STYLE_DIRECTIVES.includes(directive) && value === "'unsafe-inline'"
				? SEVERITY.HIGH
				: config.severity;

			findings.push({
				severity,
				message: t(config.messageKey),
				recommendation: t(config.recommendationKey)
			});

			if (severity === SEVERITY.HIGH) {
				overallSeverity = SEVERITY.HIGH;
			} else if (severity === SEVERITY.MEDIUM && overallSeverity !== SEVERITY.HIGH) {
				overallSeverity = SEVERITY.MEDIUM;
			}
		}
	}

	// Check for wildcards (especially dangerous in script-src)
	for (const value of values) {
		if (WILDCARDS[value]) {
			const config = WILDCARDS[value];
			// Wildcards in script-src are more dangerous
			const severity = SCRIPT_STYLE_DIRECTIVES.includes(directive) && (value === '*' || value === 'data:')
				? SEVERITY.HIGH
				: config.severity;

			findings.push({
				severity,
				message: t(config.messageKey),
				recommendation: t(config.recommendationKey)
			});

			if (severity === SEVERITY.HIGH && overallSeverity !== SEVERITY.HIGH) {
				overallSeverity = SEVERITY.HIGH;
			} else if (severity === SEVERITY.MEDIUM && overallSeverity === SEVERITY.SECURE) {
				overallSeverity = SEVERITY.MEDIUM;
			}
		}
	}

	// Check for secure patterns (nonces, hashes)
	const hasSecurePattern = values.some(value =>
		SECURE_PATTERNS.nonce.test(value) ||
		SECURE_PATTERNS.hash.test(value) ||
		value === SECURE_PATTERNS.strictDynamic
	);

	// Special handling for 'none'
	const hasNone = values.includes("'none'");

	// If directive has 'none' and it's appropriate (like object-src), it's secure
	if (hasNone && ['object-src', 'base-uri'].includes(directive)) {
		if (findings.length === 0) {
			findings.push({
				severity: SEVERITY.SECURE,
				message: t('eval.secure'),
				recommendation: ''
			});
		}
	}

	// Only add positive messages if there are no security issues
	if (overallSeverity === SEVERITY.SECURE) {
		// If script-src has secure patterns, note it positively
		if (hasSecurePattern && SCRIPT_STYLE_DIRECTIVES.includes(directive)) {
			findings.push({
				severity: SEVERITY.SECURE,
				message: t('eval.hasNonceOrHash'),
				recommendation: ''
			});
		}
		// If no findings at all, it's generally secure
		else if (findings.length === 0) {
			findings.push({
				severity: SEVERITY.SECURE,
				message: t('eval.noIssues'),
				recommendation: ''
			});
		}
	}

	return {
		severity: overallSeverity,
		findings
	};
}

/**
 * Evaluate entire CSP policy
 * @param {Object} state - CSP state object from CspManager
 * @param {Function} t - Translation function
 * @returns {Object<string, DirectiveEvaluation>}
 */
export function evaluatePolicy(state, t) {
	const evaluations = {};

	// Evaluate each enabled directive
	for (const [directive, config] of Object.entries(state)) {
		if (config.enabled) {
			const allValues = [...config.defaults, ...config.added];
			evaluations[directive] = evaluateDirective(directive, allValues, t);
		}
	}

	// Check for missing critical directives
	for (const [criticalDirective, config] of Object.entries(CRITICAL_DIRECTIVES)) {
		if (!state[criticalDirective]?.enabled) {
			// Store as a warning on default-src or create a global warning
			if (!evaluations._missing) {
				evaluations._missing = {
					severity: SEVERITY.MEDIUM,
					findings: []
				};
			}
			evaluations._missing.findings.push({
				severity: SEVERITY.MEDIUM,
				message: t(config.messageKey),
				recommendation: t(config.recommendationKey)
			});
		}
	}

	return evaluations;
}

/**
 * Get overall policy score (0-100, higher is better)
 * @param {Object<string, DirectiveEvaluation>} evaluations
 * @returns {number}
 */
export function getPolicyScore(evaluations) {
	let score = 100;
	let highCount = 0;
	let mediumCount = 0;

	for (const evaluation of Object.values(evaluations)) {
		for (const finding of evaluation.findings) {
			if (finding.severity === SEVERITY.HIGH) {
				highCount++;
			} else if (finding.severity === SEVERITY.MEDIUM) {
				mediumCount++;
			}
		}
	}

	// Deduct points for issues
	score -= highCount * 20;
	score -= mediumCount * 10;

	return Math.max(0, score);
}
