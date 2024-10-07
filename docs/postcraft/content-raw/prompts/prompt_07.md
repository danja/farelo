The job is to create a script, `src/extractRDF.js` that will be attached to the form created by `src/index.js`. This will be done in a series of steps, please address in turn :

1. Show me the necessary modifications to `form-a-matic/src/json-to-html.js` to use `<div>` elements instead of `<br>`, as well as what's needed for the CSS.
2. Please give me the necessary additions to `form-a-matic/src/json-to-html.js` to associate `src/extractRDF.js` and insert a 'Submit' button. Also add a textarea labelled 'Output'. On clicking, the button will call a function `extract(document)` in ``src/extractRDF.js` and place it's string return value in the output field.
3. Make a helper function `extractElementData(element)` that will pull out the data attributes from a form element, placing this in a JSON object.
4. Make a function that will step through the form elements in turn, and call `extractElementData(element)`
5. Using `rdfjs-basics.js` as an example of RDF node creation, write a function that will create these from the data values
6. Return the RDF as a string in Turtle format.
