
# Messages in DataEntry

In **DataEntry**, messages provide valuable feedback to the user, offering insights into various actions, errors, or warnings that occur during interactions with the form. These messages can be loaded from an external endpoint using the `messages` attribute or extended directly within the schema.

Messages are typically displayed as **Toasts** in the UI, offering brief and non-intrusive notifications. As a fallback, if the `debug` flag is set on **DataEntry**, messages are logged in the console.

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
  - `success`: DESCRIBE
  - `info`: General information messages.
  - `warning`: Warnings that indicate a potential issue.
  - `error`: Errors indicating that something went wrong.

### Example Usage in DataEntry:

```html
<data-entry
  data="data/product.json"
  schema="data/schema.json"
  messages="data/messages.json"
  lang="en"
  novalidate
  debug>
</data-entry>
```

In this example:
- The `messages` attribute points to a JSON file (`messages.json`) that contains an array of messages like the one shown above.
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
  ],
  "properties": {
    "name": {
      "type": "string",
      "title": "Name"
    }
  }
}
```

In this example:
- The schema extends the messages by providing a custom message for the `405` code, overriding the one from the messages endpoint.
- The custom message reads "Could not save data AT all!" and is of type `error`.

## Displaying Messages

Messages are primarily displayed in two ways:
1. **Toast Notifications**: Messages are shown as toasts in the UI for a short duration.
2. **Console Logging (Debug Mode)**: When the `debug` flag is set on **DataEntry**, any message that would normally appear as a toast is also logged in the console.

## Toast Example:

```html
<ui-toast></ui-toast>
```

The toast component is used within **DataEntry** to display messages of type `info`, `warning`, `error`, or `success`. Toast notifications are brief and non-intrusive, typically appearing at the bottom of the screen and disappearing automatically after a few seconds.

### Example of a Toast Displaying an Error Message:
- If a user tries to save a product but encounters a 405 error (e.g., "Could not save data"), a toast will display this message, notifying the user of the failure.

## Key Takeaways:
- Messages provide important feedback in **DataEntry** either as toasts or console logs.
- You can load messages via the `messages` attribute or override/extend them in the schema.
- Messages are categorized by types such as `info`, `warning`, and `error`, and are displayed based on these types.
- **Toast Notifications** are the primary way of displaying messages to the user, while console logs are used as a fallback when `debug` mode is enabled.

