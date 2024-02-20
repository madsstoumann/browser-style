export function generateClasses(styles, breakpoints, breakpointDelimiter = ':', prefixDelimiter = '-') {
	const classes = [];
	const classesWithoutBreakpoints = generateClassesForBreakpoint('', styles, breakpointDelimiter, prefixDelimiter);
	for (const breakpoint of breakpoints) {
		const mediaQuery = breakpoint.key
			? `@media (min-width: ${breakpoint.value}px) {`
			: '';
		const breakpointClasses = generateClassesForBreakpoint(breakpoint.key, styles, breakpointDelimiter, prefixDelimiter);
		classes.push(
			`${mediaQuery} ${breakpointClasses.join('\n')} ${mediaQuery ? '}' : ''}`,
		);
	}
	classes.unshift(...classesWithoutBreakpoints);
	return classes.join('\n');
}

export function generateClassesForBreakpoint(breakpointKey, styles, breakpointDelimiter = ':', prefixDelimiter = '-') {
	const breakpointClasses = [];

	for (const {
		property,
		prefix,
		values,
		unit,
		type,
		breakpoints: specifiedBreakpoints,
	} of styles) {
		if (
			!specifiedBreakpoints ||
			specifiedBreakpoints.includes(breakpointKey) ||
			!breakpointKey
		) {

			const escapedBreakpointKey = breakpointKey ? (breakpointKey+breakpointDelimiter).replace(/\:/g, '\\:') : '';

			if (type === 'color') {
				values.forEach((item) => {
					item.values.forEach((value, index) => {
						
						const baseClassName = `${prefix}${prefixDelimiter}${item.name}`;
						const className = `${baseClassName}-${(index + 1) * 100}`;
						const escapedClassName = breakpointKey
							? `.${escapedBreakpointKey}${className.replace(/\./g, '\\.')}`
							: `.${className.replace(/\./g, '\\.')}`;
						breakpointClasses.push(`${escapedClassName}{${property}:${value}}`);
					});
				});
			} 
			if (type === 'length') {
				breakpointClasses.push(
					...values.map((value) => {
						const baseClassName = `${prefix}${prefixDelimiter}`;
						const className = `${baseClassName}${value}`;
						const escapedClassName = breakpointKey
							? `.${escapedBreakpointKey}${className.replace(/\./g, '\\.')}`
							: `.${className.replace(/\./g, '\\.')}`;
						return `${escapedClassName}{${property}:${value}${unit}}`;
					}),
				);
			}
			if (type === 'string') {
				breakpointClasses.push(
					...values.map((value) => {
						const baseClassName = `${prefix}${prefixDelimiter}`;
						const className = `${baseClassName}${value.name}`;
						const escapedClassName = breakpointKey
							? `.${escapedBreakpointKey}${className.replace(/\./g, '\\.')}`
							: `.${className.replace(/\./g, '\\.')}`;
						return `${escapedClassName}{${property}:${value.value}}`;
					}),
				);
			}
		}
	}

	return breakpointClasses;
}

export function applyStylesheet(css) {
	const styleElement = document.createElement('style');
	styleElement.type = 'text/css';
	styleElement.appendChild(document.createTextNode(css));
	document.head.appendChild(styleElement);
}