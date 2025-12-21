Read these official W3C Design Tokens Community Group reports for detailed information on design tokens:

https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
https://www.w3.org/community/reports/design-tokens/CG-FINAL-color-20251028/
https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/

Next, explore these resources for a deeper understanding of CSS properties:
https://dev.to/madsstoumann/extending-emmet-and-vs-code-and-discovering-415-css-properties-1dfo
https://github.com/mdn/data/blob/main/css/properties.json

To start with, I'd like a complete list of all design token *types*.

Next, I'd like a complete list of CSS properties mapped to deisgn tokens types.

A lot of properties can probably be omitted because they don't relate to design tokens. Focus on the most relevant ones.

In ui/web-config-tokens I've played around with various ways of displaying design tokens.

The official specs are here:
https://www.designtokens.org/tr/third-editors-draft/

Read those and follow the links to the specific color and format specs.

In the subfolder /data you find `design-tokens-sample.json`. This contains both "raw " tokens (like a single color) and "semantic tokens", 
which are tokens combined of multiple values.

I want to create a custom element that can both be used to *display* and *edit* a design token.

Something like:

<design-token
	type=""
	display=""
	property=""
	name=""
	description=""
	value=""
></design-token>

In ui/color-token, I've played around with an idea of how to handle color-specific tokens.
Check index.js and spaces.js.

Semantic color-tokens can be combined using a CSS function with arguments:

- func = light-dark
- args = $ref.color.light, $ref.color.dark

But could also be *other* CSS functions like clamp, min and max - used with — as an example — font-size or margin.

In ui/web-config-tokens, the index.js represents an even older format for displaying tokens, including section names as headlines.

Here, the `display` attribute could be used for, as an example, the list of characters displayed in a font-family token.

Now, I want to *combine* all these ideas into one, clean way of handling design tokens visualization. 

Within the custom element, the display element *could* be a button like we have in color-token, that, when clicked, opens a popover with an editor.

I like that idea, but let's see how it fits into your plan.

In ui/web-config-tokens/tokens.md is an earlier draft of the various *types* of tokens we have in CSS.

I'd like the component to always have an object as state, that is exactly like the specs and the sample JSON.

The properties in this object can be updated/set via properties (like "name", "value" etc.), but the component should always update this state, and deliver it "onchange"/"oninput".

We need to decide, whether "type" is only used for "raw" tokens and `type="semantic"` for combined/semantic tokens. However, this might raise a challenge when presenting/rendering the token.

Later on — in a separate project, we'll use the same JSON to generate a "storybook"-like page of design tokens with groups/headlines and types.

We need to consider this in the JSON structure, which *strictly* should follow the official specs.

Even later on, we'll render CSS custom properties from the tokens, similar to:

https://open-props.style/

Carefully read/inspect all these files and create a plan for how to implement this under:

ui/design-token/plan.md