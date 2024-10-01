import { JSDOM } from 'jsdom';
import fs from 'fs/promises';

class FormElementFactory {
    constructor(document) {
        this.document = document;
    }

    createElement(property) {
        const label = this.createLabel(property.term);
        const input = this.createInput(property);
        return this.wrapInFormGroup(label, input);
    }

    createLabel(text) {
        const label = this.document.createElement('label');
        label.textContent = text;
        return label;
    }

    createInput(property) {
        if (property.type === 'BNODE' && property.children) {
            return this.createFieldset(property);
        }

        const inputElement = this.getInputElement(property);
        this.setInputAttributes(inputElement, property);
        return inputElement;
    }

    getInputElement(property) {
        if (property.type === 'LITERAL') {
            if (property.subtype === 'BOOLEAN') {
                const input = this.document.createElement('input');
                input.type = 'checkbox';
                return input;
            } else if (property.subtype === 'INTEGER') {
                const input = this.document.createElement('input');
                input.type = 'number';
                return input;
            }
        }

        if (property.type === 'LITERAL' || property.type === 'URI') {
            return this.document.createElement('textarea');
        }

        const input = this.document.createElement('input');
        input.type = 'text';
        return input;
    }

    // The setInputAttributes method now skips 'type' and 'subtype' properties, only setting custom data attributes.
    setInputAttributes(input, property) {
        Object.entries(property).forEach(([key, value]) => {
            if (key !== 'type' && key !== 'subtype') {
                input.dataset[key] = typeof value === 'object' ? JSON.stringify(value) : value;
            }
        });
    }


    createFieldset(property) {
        const fieldset = this.document.createElement('fieldset');
        fieldset.appendChild(this.createLegend(property.term));
        fieldset.appendChild(this.createAddButton(property));
        this.addNestedEntry(fieldset, property);
        return fieldset;
    }

    createLegend(text) {
        const legend = this.document.createElement('legend');
        legend.textContent = text;
        return legend;
    }

    createAddButton(property) {
        const addButton = this.document.createElement('button');
        addButton.textContent = `Add ${property.term}`;
        addButton.type = 'button';
        addButton.onclick = () => this.addNestedEntry(addButton.parentNode, property);
        return addButton;
    }

    addNestedEntry(fieldset, property) {
        const entryDiv = this.document.createElement('div');
        entryDiv.classList.add('nested-entry');

        property.children.properties.forEach(childProp => {
            const { formGroup } = this.createElement(childProp);
            entryDiv.appendChild(formGroup);
        });

        entryDiv.appendChild(this.createRemoveButton(fieldset, entryDiv));
        fieldset.insertBefore(entryDiv, fieldset.lastElementChild);
    }

    createRemoveButton(fieldset, entryDiv) {
        const removeButton = this.document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.type = 'button';
        removeButton.onclick = () => fieldset.removeChild(entryDiv);
        return removeButton;
    }

    wrapInFormGroup(label, input) {
        const formGroup = this.document.createElement('div');
        formGroup.classList.add('form-group');
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        return { formGroup, input };
    }
}

class JsonToHtmlForm {
    constructor() {
        this.dom = null;
        this.document = null;
        this.formElementFactory = null;
    }

    async initDOM(templatePath) {
        const templateString = await fs.readFile(templatePath, 'utf-8');
        this.dom = new JSDOM(templateString);
        this.document = this.dom.window.document;
        this.formElementFactory = new FormElementFactory(this.document);
    }

    createFormElements(properties) {
        const fragment = this.document.createDocumentFragment();
        properties.forEach(property => {
            const { formGroup } = this.formElementFactory.createElement(property);
            fragment.appendChild(formGroup);

            if (property.children && property.children.properties) {
                const fieldset = this.createNestedFieldset(property);
                fragment.appendChild(fieldset);
            }
        });
        return fragment;
    }

    createNestedFieldset(property) {
        const fieldset = this.document.createElement('fieldset');
        fieldset.appendChild(this.formElementFactory.createLegend(property.term));
        fieldset.appendChild(this.createFormElements(property.children.properties));
        return fieldset;
    }

    jsonToHtmlForm(jsonData) {
        const form = this.document.createElement('form');
        form.appendChild(this.createFormElements(jsonData.ROOT.properties));
        return form;
    }

    createSubmitButton() {
        const submitButton = this.document.createElement('button');
        submitButton.textContent = 'Submit';
        submitButton.type = 'button';
        submitButton.id = 'submitButton';
        return submitButton;
    }

    createOutputElements() {
        const outputLabel = this.document.createElement('label');
        outputLabel.textContent = 'Output';
        outputLabel.htmlFor = 'output';

        const outputTextarea = this.document.createElement('textarea');
        outputTextarea.id = 'output';
        outputTextarea.rows = 10;

        return { outputLabel, outputTextarea };
    }

    createClientScript() {
        const script = this.document.createElement('script');
        script.textContent = `
            console.log('Script loaded');
            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOM fully loaded');
                console.log('window.extract:', window.extract);
                var button = document.getElementById('submitButton');
                console.log('Submit button:', button);
                if (button) {
                    button.addEventListener('click', function() {
                        console.log('Button clicked');
                        if (typeof window.extract === 'function') {
                            console.log('Calling extract function');
                            var output = window.extract(document);
                            document.getElementById('output').value = output;
                            console.log('Output set');
                        } else {
                            console.error('window.extract is not a function. window.extract:', window.extract);
                        }
                    });
                    console.log('Click event listener added');
                } else {
                    console.error('Submit button not found');
                }
            });
        `;
        return script;
    }

    async jsonFileToHtmlForm(templatePath, filePath) {
        try {
            await this.initDOM(templatePath);

            const jsonString = await fs.readFile(filePath, 'utf-8');
            const jsonData = JSON.parse(jsonString);

            if (!jsonData || !jsonData.ROOT || !Array.isArray(jsonData.ROOT.properties)) {
                throw new Error('Invalid JSON structure: ROOT.properties array is missing');
            }

            const formElement = this.jsonToHtmlForm(jsonData);

            formElement.appendChild(this.createSubmitButton());

            const { outputLabel, outputTextarea } = this.createOutputElements();
            formElement.appendChild(outputLabel);
            formElement.appendChild(outputTextarea);

            this.document.body.appendChild(formElement);
            this.document.head.appendChild(this.createClientScript());

            return this.dom.serialize();
        } catch (error) {
            console.error('Error in jsonFileToHtmlForm:', error);

            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`);
            } else if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${error.path}`);
            } else {
                throw new Error(`Failed to process form: ${error.message}`);
            }
        }
    }
}

export default JsonToHtmlForm;