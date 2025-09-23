# Design Tokens

## Documentation
Resolver: https://deploy-preview-289--designtokensorg.netlify.app/tr/drafts/resolver/
Format: https://deploy-preview-298--designtokensorg.netlify.app/tr/drafts/format/

## Figma Plugin

## Open Props
https://github.com/argyleink/open-props



https://design-tokens.github.io/community-group/format/

animation
	 - delay (dimension)
	 - direction (string: normal, reverse, alternate, alternate-reverse)
	 - duration (dimension)
	 - fill-mode (string: none, forwards, backwards, both)
	 - iteration-count (number)
	 - name (string)
	 - play-state (string: running, paused)
	 - timing-function (easing)

border
	- color (color) 
	- size (dimension)
	- radius (dimensen / ratio)
	- style (string: none, hidden, dotted, dashed, solid, double, groove, ridge, inset, outset)

color

dimension / sizes (number + unit)

easing
	- built-in (string: ease, ease-in etc.)
	- cubic-bezier (string)

filter (composite, functions)

function (https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Functions)
	- calc
	- clamp
	- min
	- max
	- etc.

font-family (string)
font-size / font-size-fluid (dimension / function)
font-weight (number, 100-950)
letter-spacing (dimension)
line-height (dimension)
hyphenation and overflow?

gradient (string: linear-gradient)

number

ratio

shadow (composite)
	- box-shadow (inner, outer)
	- drop-shadow
	- text-shadow

shape (clip-path etc.)

transform (function, individual properties)

url (file)

---

## Raw types

color
dimension
function
number
url


---

"shadow": {
    "--bxsh-medium": {
      "type": "shadow",
      "description": "A composite token where some sub-values are references to tokens that have the correct type and others are explicit values",
      "value": {
        "color": "{color.shadow-050}",
        "offsetX": "{space.small}",
        "offsetY": "{space.small}",
        "blur": "1.5rem",
        "spread": "0rem"
      }
    }
  },

box-shadow: {
	inset, /* boolean keyword */
	offset-x.
	offset-y,
	blu-radius,
	spread-radius,
	color
}

text-shadow: {
	color,
	offset-x
	offset-y,
	blur-radius
}