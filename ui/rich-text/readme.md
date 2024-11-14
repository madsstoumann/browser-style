# Rich Text Editor

## Overview

The **RichText** component is a customizable rich text editor that can be inlined within a form or used as a standalone editor. It allows for extensive customization of the toolbar and commands, supports plaintext editing, and can be tailored through various attributes.

## Usage

### Basic Example
To use the RichText component, add the following HTML code:

```html
<rich-text
  skip-toolbar="Skip toolbar and go to content"
  toolbar="b,i,u,s|sub,sup|ol,ul,blockquote,hr"
  plaintext-toolbar="save">
  Sample content here...
</rich-text>
```

### Attributes
- **event-mode**: Controls event dispatch behavior (`input`, `custom`, `both`).
- **form**: Links the component to a specific form for submission.
- **input-types**: Defines supported editing commands.
- **toolbar**: Customizes toolbar commands. Use a pipe (`|`) to separate groups and comma (`,`) between commands in a group.
- **plaintext-toolbar**: Specifies toolbar items available in plaintext-only mode.
- **plaintext**: Attribute to switch between plaintext and richtext mode.

## Event Modes
The `event-mode` attribute supports the following options:
- **custom**: Dispatches custom events only.
- **input**: Dispatches native `input` events only.
- **both**: Dispatches both `input` and custom events.

## Events

### Dispatched Events
- **input**: Native input event fired on content change when `event-mode` includes `input` (or `both`).
- **rt:content**: Fired whenever the content changes.
- **rt:clear**: Clears all content.
- **rt:reset**: Resets content to the initial state.
- **rt:save**: Custom save event, with the current editor content in the `event.detail`.

### Received Events
- **rt:clear**: Clears editor content.
- **rt:reset**: Resets editor content to the initial loaded state.

## Using in a Form
The `RichText` component can be added to a form:
```html
<form>
  ... other form controls ...
  <rich-text name="rich-content"></rich-text>
  ... other form controls ...
</form>
```
In this mode, the editor will submit the HTML content as encoded data within the form submission.

## Toolbar Customization
The toolbar can be customized by setting the `toolbar` attribute with desired commands:
```html
<rich-text toolbar="bold,italic,underline,link|ul,ol"></rich-text>
```
- **Grouping**: Use `|` to group items in the toolbar.
- **Commands**: Define commands such as `bold`, `italic`, `link`, and list formatting.

## Supported Commands
| Command                  | Key        | Description                                       |
|--------------------------|------------|---------------------------------------------------|
| backColor                | bgc        | Change the background color of the selected text. |
| bold                     | b          | Make the selected text bold.                      |
| clear                    | clear      | Clear the editor content.                         |
| copy                     | copy       | Copy the selected text.                           |
| createLink               | link       | Create a hyperlink to the specified URL.          |
| cut                      | cut        | Cut the selected text.                            |
| fontName                 | fn         | Change the font family of the selected text.      |
| fontSize                 | fs         | Change the font size of the selected text.        |
| foreColor                | fc         | Change the font color of the selected text.       |
| formatBlock (BLOCKQUOTE) | blockquote | Format the selected text as a blockquote.         |
| formatBlock (H1)         | h1         | Format the selected text as a heading 1.          |
| formatBlock (H2)         | h2         | Format the selected text as a heading 2.          |
| formatBlock (H3)         | h3         | Format the selected text as a heading 3.          |
| formatBlock (H4)         | h4         | Format the selected text as a heading 4.          |
| formatBlock (H5)         | h5         | Format the selected text as a heading 5.          |
| formatBlock (H6)         | h6         | Format the selected text as a heading 6.          |
| html                     | html       | Toggle between HTML and rich text modes.          |
| indent                   | indent     | Indent the selected text.                         |
| insertHorizontalRule     | hr         | Insert a horizontal rule into the editor.         |
| insertImage              | img        | Insert an image into the editor.                  |
| insertOrderedList        | ol         | Insert an ordered list into the editor.           |
| insertUnorderedList      | ul         | Insert an unordered list into the editor.         |
| italic                   | i          | Make the selected text italic.                    |
| justifyCenter            | center     | Center the selected text.                         |
| justifyFull              | justify    | Justify the selected text.                        |
| justifyLeft              | left       | Align the selected text to the left.              |
| justifyRight             | right      | Align the selected text to the right.             |
| outdent                  | outdent    | Outdent the selected text.                        |
| paste                    | paste      | Paste the copied or cut text.                     |
| redo                     | redo       | Redo the last undone action.                      |
| removeFormat             | remove     | Remove all formatting from the selected text.     |
| reset                    | reset      | Reset the editor content.                         |
| save                     | save       | Save the editor content.                          |
| strikeThrough            | s          | Strikethrough the selected text.                  |
| subscript                | sub        | Subscript the selected text.                      |
| superscript              | sup        | Superscript the selected text.                    |
| underline                | u          | Underline the selected text.                      |
| unlink                   | unlink     | Remove the hyperlink from the selected text.      |
| undo                     | undo       | Undo the last done action.                        |


### Adding Custom Commands
To add a custom command, use `addCustomCommand` in JavaScript:
```javascript
const editor = document.querySelector('rich-text');
editor.addCustomCommand({
  key: 'customKey',
  command: 'customCommand',
  icon: '<svg>...</svg>',
    fn: (node) => { console.log("Custom command executed"); }
});
```

## Styling
The component uses a CSS stylesheet with the following variables for customization:
- **--richtext-active-bg**: Background color for active buttons.
- **--richtext-active-c**: Text color for active buttons.

Adjust these CSS variables as needed to customize the editor’s appearance.

---

## Advanced: Handling event.inputType

In JavaScript, the `event.inputType` property of the `InputEvent` interface provides a string that specifies the type of change that has been made to the editable content. This property indicates the specific action that triggered the input or beforeinput event, such as 'insertText', 'deleteContentBackward', 'formatBold', and many others.

By utilizing `event.inputType` in the `beforeinput` event handler, the app controls which types of input actions are allowed. 

The configuration-object expects a key, `inputTypes` with value set to a comma-separated list of allowed events. This approach effectively filters out unwanted editing actions, allowing you to restrict or customize the editing capabilities of the RichText editor based on the input types. 

By default, _all_ events are allowed.

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

In the snippets above, only `formatBold` and `formatItalic` are allowed — all other commands will be ignored.

---

### List of types:

| inputType | Description |
| --------- | ------------|
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

