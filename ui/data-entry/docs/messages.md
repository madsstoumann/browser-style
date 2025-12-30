
# Messages

In **DataEntry**, messages provide valuable feedback to the user, offering insights into various actions, errors, or warnings that occur during interactions with the form. These messages can be loaded from an external endpoint using the `messages` attribute or extended directly within the schema.

Messages are typically displayed as **Toasts** in the UI, offering brief and non-intrusive notifications.

As a fallback, if the `debug` flag is set on **DataEntry**, messages are logged in the console.

## Sample Messages from the Messages Endpoint

A typical response from a messages endpoint might look like this:

```json
[
  {
    "code": 400,
    "message": "Bad Request - Please check your inputs.",
    "type": "info"
  },
  {
    "code": 404,
    "message": "Product not found.",
    "type": "warning"
  },
  {
    "code": 405,
    "message": "Could not save data",
    "type": "error"
  },
  {
    "code": 1105,
    "message": "Could not save data",
    "type": "error"
  }
]
```

### Fields in a Message:
- **code**: The status code or identifier for the message.
- **message**: The text that will be displayed to the user.
- **type**: The type of message, which affects how it is displayed. Common types include:
  - `success`: Action performed succesfully
  - `info`: General information messages.
  - `warning`: Warnings that indicate a potential issue.
  - `error`: Errors indicating that something went wrong.

### Example Usage in DataEntry:

```html
<data-entry
  data="your.api/data"
  schema="your.api/schema"
  messages="your.api/messages"
  debug>
</data-entry>
```

In this example:
- The `messages` attribute points to an endpoint that contains an array of messages like the one shown above.
- These messages will be used to provide feedback to the user during interactions.

## Overriding or Extending Messages in the Schema

You can also override or extend messages directly in the **DataEntry** schema. This is useful when specific fields or actions in the form require custom messages.

### Example of Extending Messages in the Schema:

```json
{
  "messages": [
    {
      "code": 405,
      "message": "Could not save data AT all!",
      "type": "error"
    }
  ]
}
```

In this example:
- The schema extends the messages by providing a custom message for the `405` code, overriding the one from the messages endpoint.
- The custom message reads "Could not save data AT all!" and is of type `error`.

## Displaying Messages

Messages are primarily displayed in two ways:
1. **Toast Notifications**: Messages are shown as toasts in the UI for a short duration.
2. **Console Logging (Debug Mode)**: When the `debug` flag is set on **DataEntry**, any message that would normally appear as a toast is also logged in the console.

The built-in `<snack-bar>`-component exposes `::part`´s and can thus be custom styled. 

For more information, see [browser.style/ui/snack-bar](https://browser.style/ui/snack-bar)

---

## Built-in Error Codes

Error Codes (1001–1008):

	1.	1001: Error fetching a resource
	•	Message: "Error fetching [resource name]: [error message]"
	2.	1002: Path does not reference an array
	•	Message: "Path [path] does not reference an array in the data."
	3.	1003: Object marked for removal
	•	Message: "Marked object at path [name] for removal."
	4.	1004: Element with the specified selector not found
	•	Message: "Element with selector [selector] not found within the fieldset."
	5.	1005: Data submission success
	•	Message: "Data submitted successfully!"
	6.	1006: Network issue detected
	•	Message: "Network issue detected"
	7.	1007: HTTP error during form submission
	•	Message: "HTTP error! status: [statusText]"
	8.	1008: Validation failed
	•	Message: "Schema validation failed."