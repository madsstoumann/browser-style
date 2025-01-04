In this epub-reader folder, create a web component: <epub-reader>
In the shadowDOM of this component, render a <haeader>-tag, a <main>-tag with 2 <aside>-tags within.
The first <aside>-tag should contain a <ul> and <input type="file">
When adding an epub-file to the input (change-event), run the FileReader API to read the file.
Store a unique key based on the file-name and file-size.
Then unzip the file using JSZip or similar.
Store the unzipped collection of files/folders using the unique key, in indexedDB.
Extract the book-name from the toc xhtml-file.
The list, <ul> shoud populate a list of stored epubs in indexedDB, using the book-names of the stored epubs.

Next, create a openBook-method.
We also need a method to render/display a single xhtml-page within the book.
Populate the other <aside> with the TOC of the book, if it exists.