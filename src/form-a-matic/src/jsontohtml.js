import { JSDOM } from 'jsdom';
import fs from 'fs/promises';

class JsonToHtmlForm {
    constructor() {
        // Initialize JSDOM
        this.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        this.document = this.dom.window.document;
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

        // Set data attributes
        Object.entries(property).forEach(([key, value]) => {
            input.dataset[key] = typeof value === 'object' ? JSON.stringify(value) : value;
        });

        return { label, input };
    }

    // Create form elements for a set of properties
    createFormElements(properties) {
        const fragment = this.document.createDocumentFragment();

        properties.forEach(property => {
            const { label, input } = this.createFormElement(property);
            fragment.appendChild(label);
            fragment.appendChild(input);
            fragment.appendChild(this.document.createElement('br'));

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

    // Transform JSON to HTML form
    jsonToHtmlForm(jsonData) {
        const form = this.document.createElement('form');
        form.appendChild(this.createFormElements(jsonData.ROOT.properties));
        return form;
    }

    // Read JSON from file and transform to HTML form
    async jsonFileToHtmlForm(filePath) {
        try {
            const jsonString = await fs.readFile(filePath, 'utf-8');
            const jsonData = JSON.parse(jsonString);
            const formElement = this.jsonToHtmlForm(jsonData);
            this.document.body.appendChild(formElement);
            return this.dom.serialize();
        } catch (error) {
            console.error('Error reading or parsing JSON file:', error);
            throw error;
        }
    }
}

export default JsonToHtmlForm;