export function interpolate(start, end, factor) { return start + (end - start) * factor; }
export function random(min, max) {return Math.random() * (max - min) + min }