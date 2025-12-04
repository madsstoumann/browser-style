/**
 * CSP Evaluator - Analyzes Content Security Policy directives for security issues
 * Based on simplified logic from Google's CSP Evaluator
 */

export const SEVERITY = {
	HIGH: 'high',
	MEDIUM: 'medium',
	SECURE: 'secure'
};

const UNSAFE_KEYWORDS_CONFIG = {
	"'unsafe-inline'": { severity: SEVERITY.HIGH, messageKey: 'eval.unsafeInline', recommendationKey: 'eval.unsafeInlineRec' },
	"'unsafe-eval'": { severity: SEVERITY.HIGH, messageKey: 'eval.unsafeEval', recommendationKey: 'eval.unsafeEvalRec' },
	"'unsafe-hashes'": { severity: SEVERITY.MEDIUM, messageKey: 'eval.unsafeHashes', recommendationKey: 'eval.unsafeHashesRec' }
};

const WILDCARDS_CONFIG = {
	'*': { severity: SEVERITY.HIGH, messageKey: 'eval.wildcardAll', recommendationKey: 'eval.wildcardAllRec' },
	'http:': { severity: SEVERITY.MEDIUM, messageKey: 'eval.wildcardHttp', recommendationKey: 'eval.wildcardHttpRec' },
	'https:': { severity: SEVERITY.MEDIUM, messageKey: 'eval.wildcardHttps', recommendationKey: 'eval.wildcardHttpsRec' },
	'data:': { severity: SEVERITY.MEDIUM, messageKey: 'eval.dataUri', recommendationKey: 'eval.dataUriRec' }
};

const SECURE_PATTERNS = {
	nonce: /^'nonce-[A-Za-z0-9+/=]+'$/,
	hash: /^'(sha256|sha384|sha512)-[A-Za-z0-9+/=]+'$/,
	strictDynamic: "'strict-dynamic'"
};

const CRITICAL_DIRECTIVES_CONFIG = {
	'base-uri': { messageKey: 'eval.missingBaseUri', recommendationKey: 'eval.missingBaseUriRec' },
	'object-src': { messageKey: 'eval.missingObjectSrc', recommendationKey: 'eval.missingObjectSrcRec' }
};

const SCRIPT_STYLE_DIRECTIVES = ['script-src', 'script-src-elem', 'script-src-attr', 'style-src', 'style-src-elem', 'style-src-attr', 'default-src'];

/**
 * Checks for unsafe keywords in a directive's values.
 * @param {string} directive - The directive name.
 * @param {string[]} values - The directive's values.
 * @param {Object} rules - The evaluation rules.
 * @param {Function} t - The translation function.
 * @returns {{findings: Array, severity: string}}
 */
function _checkUnsafeKeywords(directive, values, rules, t) {
	const findings = [];
	let severity = SEVERITY.SECURE;

	for (const value of values) {
		if (rules.unsafeKeywords[value]) {
			const config = rules.unsafeKeywords[value];
			const currentSeverity = rules.scriptStyleDirectives.includes(directive) && value === "'unsafe-inline'"
				? SEVERITY.HIGH
				: config.severity;

			findings.push({
				severity: currentSeverity,
				message: t(config.messageKey),
				recommendation: t(config.recommendationKey)
			});

			if (currentSeverity === SEVERITY.HIGH) severity = SEVERITY.HIGH;
			else if (currentSeverity === SEVERITY.MEDIUM && severity !== SEVERITY.HIGH) severity = SEVERITY.MEDIUM;
		}
	}
	return { findings, severity };
}

/**
 * Checks for wildcards in a directive's values.
 * @param {string} directive - The directive name.
 * @param {string[]} values - The directive's values.
 * @param {Object} rules - The evaluation rules.
 * @param {Function} t - The translation function.
 * @returns {{findings: Array, severity: string}}
 */
function _checkWildcards(directive, values, rules, t) {
	const findings = [];
	let severity = SEVERITY.SECURE;

	for (const value of values) {
		if (rules.wildcards[value]) {
			const config = rules.wildcards[value];
			const currentSeverity = rules.scriptStyleDirectives.includes(directive) && (value === '*' || value === 'data:')
				? SEVERITY.HIGH
				: config.severity;

			findings.push({
				severity: currentSeverity,
				message: t(config.messageKey),
				recommendation: t(config.recommendationKey)
			});

			if (currentSeverity === SEVERITY.HIGH) severity = SEVERITY.HIGH;
			else if (currentSeverity === SEVERITY.MEDIUM && severity === SEVERITY.SECURE) severity = SEVERITY.MEDIUM;
		}
	}
	return { findings, severity };
}

/**
 * Evaluates a single directive's values.
 * @param {string} directive - The directive name.
 * @param {string[]} values - Array of directive values.
 * @param {Function} t - The translation function.
 * @param {Object} rules - The merged evaluation rules.
 * @returns {Object} DirectiveEvaluation
 */
export function evaluateDirective(directive, values, t, rules) {
	const unsafeResult = _checkUnsafeKeywords(directive, values, rules, t);
	const wildcardResult = _checkWildcards(directive, values, rules, t);

	const findings = [...unsafeResult.findings, ...wildcardResult.findings];
	let overallSeverity = unsafeResult.severity === SEVERITY.HIGH || wildcardResult.severity === SEVERITY.HIGH ? SEVERITY.HIGH : (unsafeResult.severity === SEVERITY.MEDIUM || wildcardResult.severity === SEVERITY.MEDIUM ? SEVERITY.MEDIUM : SEVERITY.SECURE);

	const hasSecurePattern = values.some(value =>
		rules.securePatterns.nonce.test(value) ||
		rules.securePatterns.hash.test(value) ||
		value === rules.securePatterns.strictDynamic
	);

	if (values.includes("'none'") && ['object-src', 'base-uri'].includes(directive)) {
		if (findings.length === 0) {
			findings.push({ severity: SEVERITY.SECURE, message: t('eval.secure'), recommendation: '' });
		}
	}

	if (overallSeverity === SEVERITY.SECURE) {
		if (hasSecurePattern && rules.scriptStyleDirectives.includes(directive)) {
			findings.push({ severity: SEVERITY.SECURE, message: t('eval.hasNonceOrHash'), recommendation: '' });
		} else if (findings.length === 0) {
			findings.push({ severity: SEVERITY.SECURE, message: t('eval.noIssues'), recommendation: '' });
		}
	}

	return { severity: overallSeverity, findings };
}

/**
 * Merges default and custom evaluation rules.
 * @param {Object} customRules - Custom evaluation rules.
 * @returns {Object} Merged rules.
 */
function _mergeRules(customRules) {
	return {
		unsafeKeywords: { ...UNSAFE_KEYWORDS_CONFIG, ...(customRules?.unsafeKeywords || {}) },
		wildcards: { ...WILDCARDS_CONFIG, ...(customRules?.wildcards || {}) },
		securePatterns: { ...SECURE_PATTERNS, ...(customRules?.securePatterns || {}) },
		criticalDirectives: { ...CRITICAL_DIRECTIVES_CONFIG, ...(customRules?.criticalDirectives || {}) },
		scriptStyleDirectives: [...SCRIPT_STYLE_DIRECTIVES, ...(customRules?.scriptStyleDirectives || [])]
	};
}

/**
 * Evaluates the entire CSP policy.
 * @param {Object} state - CSP state object from CspManager.
 * @param {Function} t - The translation function.
 * @param {Object} [customRules] - Custom evaluation rules.
 * @returns {Object} Evaluations object.
 */
export function evaluatePolicy(state, t, customRules = null) {
	const evaluations = {};
	const rules = _mergeRules(customRules);

	for (const [directive, config] of Object.entries(state)) {
		if (config.enabled) {
			const allValues = [...config.defaults, ...config.added];
			evaluations[directive] = evaluateDirective(directive, allValues, t, rules);
		}
	}

	for (const [criticalDirective, config] of Object.entries(rules.criticalDirectives)) {
		if (!state[criticalDirective]?.enabled) {
			if (!evaluations._missing) {
				evaluations._missing = { severity: SEVERITY.MEDIUM, findings: [] };
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
 * Calculates an overall policy score (0-100, higher is better).
 * @param {Object} evaluations - The evaluations object.
 * @returns {number} The policy score.
 */
export function getPolicyScore(evaluations) {
	let score = 100;
	let highCount = 0;
	let mediumCount = 0;

	for (const evaluation of Object.values(evaluations)) {
		for (const finding of evaluation.findings) {
			if (finding.severity === SEVERITY.HIGH) highCount++;
			else if (finding.severity === SEVERITY.MEDIUM) mediumCount++;
		}
	}

	score -= highCount * 20;
	score -= mediumCount * 10;

	return Math.max(0, score);
}
