# Text Editor

## Toolbar



## Allowed event.inputType
The configuration-object expects a key, `inputTypes` with value set to a comma-separated list of allowed events. By default, _all_ events are allowed.

Example:
```js
{
  inputTypes: 'formatBold, formatItalic'
}
```

This can also be set as a `data-attribute` on the tag:

```html
  <div class="ui-text-editor"
    data-input-types="formatBold,formatItalic">
    ...
  </div>
```
---

### List of types:

| inputType | Description |
|---|---|
| deleteByContent | Deletes the content specified by the range. |
| deleteByCut | Deletes the content specified by the range and cuts it to the clipboard. |
| deleteByDrag | Deletes the content specified by the range and drags it to the specified location. |
| deleteContentBackward | Deletes the content between the current cursor position and the beginning of the selection. |
| deleteContentForward | Deletes the content between the current cursor position and the end of the selection. |
| deleteEntireSoftLine | Deletes the entire soft line, including the cursor and any whitespace following it. |
| deleteHardLineBackward | Deletes the hard line before the cursor. |
| deleteHardLineForward | Deletes the hard line after the cursor. |
| deleteSoftLineBackward | Deletes the soft line before the cursor, excluding the cursor and any whitespace following it. |
| deleteSoftLineForward | Deletes the soft line after the cursor, excluding the cursor and any whitespace following it. |
| deleteWordBackward | Deletes the word behind the cursor. |
| deleteWordForward | Deletes the word in front of the cursor. |
| formatBackColor | Formats the background color of the selected text. |
| formatBold | Formats the selected text as bold. |
| formatFontColor | Formats the font color of the selected text. |
| formatFontName | Formats the font name of the selected text. |
| formatIndent | Indents the selected text. |
| formatItalic | Formats the selected text as italic. |
| formatJustifyCenter | Justifies the selected text to the center. |
| formatJustifyFull | Justifies the selected text to the full width of the available space. |
| formatJustifyLeft | Justifies the selected text to the left. |
| formatJustifyRight | Justifies the selected text to the right. |
| formatOutdent | Outdents the selected text. |
| formatRemove | Removes all formatting from the selected text. |
| formatSetBlockTextDirection | Sets the text direction of the selected block of text. |
| formatSetInlineTextDirection | Sets the text direction of the selected inline text. |
| formatStrikethrough | Formats the selected text with a strikethrough. |
| formatSubscript | Formats the selected text as subscript. |
| formatSuperscript | Formats the selected text as superscript. |
| formatUnderline | Formats the selected text with an underline. |
| historyRedo | Redoes the last undone action. |
| historyUndo | Undoes the last performed action. |
| insertCompositionText | Inserts the composition text at the current cursor position. |
| insertFromComposition | Inserts the content from the composition at the current cursor position. |
| insertFromDrop | Inserts the content from the drop at the current cursor position. |
| insertFromPaste | Inserts the content from the clipboard at the current cursor position. |
| insertFromYank | Inserts the content from the yank buffer at the current cursor position. |
| insertHorizontalRule | Inserts a horizontal rule at the current cursor position. |
| insertLineBreak | Inserts a line break at the current cursor position. |
| insertLink | Inserts a hyperlink at the current cursor position. |
| insertOrderedList | Inserts an ordered list at the current cursor position. |
| insertParagraph | Inserts a paragraph at the current cursor position. |
| insertReplacementText | Inserts the replacement text for the current selection. |
| insertText | Inserts the specified text at the current cursor position. |
| insertTranspose | Transposes the two characters before and after the cursor. |
| insertUnorderedList | Inserts an unordered list at the current cursor position. |