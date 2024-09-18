## rename summary, label in schema.json?

displayKey or displayField: Instead of label, this name can reflect that it’s the key or field used to display the value in the UI.
summaryKey or summaryField: Instead of summary, this reflects that it’s the field used to display summary information, which could apply to dynamic values or a summary of an entry.
displayProperty or summaryProperty: Using property emphasizes that these are schema properties, which can map to different values depending on the render method or data.
renderLabel and renderSummary: Keeping some familiarity but prefixing with render indicates these are specific to rendering logic, making them more flexible for multiple render methods.