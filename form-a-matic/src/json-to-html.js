import { JSDOM } from 'jsdom';
import fs from 'fs/promises';

class JsonToHtmlForm {
    constructor() {
        this.extractRDFScript = '';
    }

    async loadExtractRDFScript() {
        this.extractRDFScript = await fs.readFile('src/extractRDF.js', 'utf-8');
    }

    async initDOM(templatePath) {
        // <link rel="stylesheet" href="styles.css">
        const templateString = await fs.readFile(templatePath, 'utf-8')
        this.dom = new JSDOM(templateString)
        this.document = this.dom.window.document
    }

    // Create a single form element based on property
    createFormElement(property) {
        const label = this.document.createElement('label');
        label.textContent = property.term;

        let input;

        // Create input based on property type and subtype
        if (property.type === 'LITERAL' && property.subtype === 'BOOLEAN') {
            input = this.document.createElement('input');
            input.type = 'checkbox';
        } else if (property.type === 'LITERAL' && property.subtype === 'INTEGER') {
            input = this.document.createElement('input');
            input.type = 'number';
        } else if (property.type === 'LITERAL' || property.type === 'URI') {
            input = this.document.createElement('textarea');
        } else {
            // For other types, create a placeholder input
            input = this.document.createElement('input');
            input.type = 'text';
        }

        if (property.type === 'BNODE' && property.children) {
            const fieldset = this.document.createElement('fieldset');
            const legend = this.document.createElement('legend');
            legend.textContent = property.term;
            fieldset.appendChild(legend);

            const addButton = this.document.createElement('button');
            addButton.textContent = `Add ${property.term}`;
            addButton.type = 'button';
            addButton.onclick = () => this.addNestedEntry(fieldset, property);
            fieldset.appendChild(addButton);

            this.addNestedEntry(fieldset, property); // Add initial entry
            input = fieldset;
        }

        // Set data attributes
        Object.entries(property).forEach(([key, value]) => {
            input.dataset[key] = typeof value === 'object' ? JSON.stringify(value) : value;
        });

        const formGroup = this.document.createElement('div');
        formGroup.classList.add('form-group');
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        return { formGroup, input };
    }

    // Create form elements for a set of properties
    createFormElements(properties) {
        const fragment = this.document.createDocumentFragment();

        properties.forEach(property => {
            //  const { label, input } = this.createFormElement(property);
            const { formGroup, input } = this.createFormElement(property);
            fragment.appendChild(formGroup);
            //  fragment.appendChild(label);
            fragment.appendChild(input);
            //    fragment.appendChild(this.document.createElement('br'));

            // Handle nested properties
            if (property.children && property.children.properties) {
                const fieldset = this.document.createElement('fieldset');
                const legend = this.document.createElement('legend');
                legend.textContent = property.term;
                fieldset.appendChild(legend);
                fieldset.appendChild(this.createFormElements(property.children.properties));
                fragment.appendChild(fieldset);
            }
        });

        return fragment;
    }

    addNestedEntry(fieldset, property) {
        const entryDiv = this.document.createElement('div');
        entryDiv.classList.add('nested-entry');

        property.children.properties.forEach(childProp => {
            const { formGroup } = this.createFormElement(childProp);
            entryDiv.appendChild(formGroup);
        });

        const removeButton = this.document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.type = 'button';
        removeButton.onclick = () => fieldset.removeChild(entryDiv);
        entryDiv.appendChild(removeButton);

        fieldset.insertBefore(entryDiv, fieldset.lastElementChild);
    }

    // Transform JSON to HTML form
    jsonToHtmlForm(jsonData) {
        const form = this.document.createElement('form');
        form.appendChild(this.createFormElements(jsonData.ROOT.properties));
        return form;
    }

    // Read JSON from file and transform to HTML form
    async jsonFileToHtmlForm(templatePath, filePath) {
        try {
            await this.loadExtractRDFScript();

            this.initDOM(templatePath)

            const jsonString = await fs.readFile(filePath, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            const formElement = this.jsonToHtmlForm(jsonData);

            const submitButton = this.document.createElement('button');
            submitButton.textContent = 'Submit';
            submitButton.type = 'button';
            submitButton.onclick = function () {
                const output = extract(document);
                document.getElementById('output').value = output;
            };
            const form = formElement//////////////////TODO
            form.appendChild(submitButton);

            const outputLabel = this.document.createElement('label');
            outputLabel.textContent = 'Output';
            outputLabel.htmlFor = 'output';
            form.appendChild(outputLabel);

            const outputTextarea = this.document.createElement('textarea');
            outputTextarea.id = 'output';
            outputTextarea.rows = 10;
            form.appendChild(outputTextarea);

            // Add the extractRDF.js script to the document
            const script = this.document.createElement('script');
            script.textContent = this.extractRDFScript;
            this.document.head.appendChild(script);

            this.document.body.appendChild(formElement);
            return this.dom.serialize();
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
            throw error;
        }
    }
}

export default JsonToHtmlForm;