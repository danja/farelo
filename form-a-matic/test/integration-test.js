// test/integration-test.js
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { extract } from '../src/public/extractor.js';
import assert from 'assert';

async function runIntegrationTest() {
    try {
        // Read the mock HTML file
        const htmlContent = await fs.readFile('./test/mock-form.html', 'utf-8');

        // Create a JSDOM instance
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        // Extract data using the extractor function
        const extractedData = await extract(document);

        // Parse the extracted data (assuming it's in Turtle format)
        const parsedData = parseTurtle(extractedData);

        // Perform assertions
        assert(parsedData.name === 'John Doe', 'Name should be "John Doe"');
        assert(parsedData.mbox === 'mailto:john@example.com', 'Email should be "mailto:john@example.com"');
        assert(parsedData.homepage === 'http://example.com/john', 'Homepage should be "http://example.com/john"');
        // Add more assertions as needed

        console.log('Integration test passed successfully!');
    } catch (error) {
        console.error('Integration test failed:', error);
    }
}

// Simple function to parse Turtle format (replace with a proper parser if needed)
function parseTurtle(turtleString) {
    const result = {};
    const lines = turtleString.split('\n');
    for (const line of lines) {
        const [subject, predicate, object] = line.split(' ').map(item => item.trim());
        if (predicate && object) {
            const key = predicate.split('#')[1] || predicate.split('/').pop();
            result[key] = object.replace(/[<>"]/g, '');
        }
    }
    return result;
}

runIntegrationTest();