import assert from 'assert';
import { JSDOM } from 'jsdom';
import TurtleTemplateToJSON from './src/tt-to-json.js';
import JsonToHtmlForm from './src/json-to-html.js';
import extract from './src/public/extractor.js';
import rdf from 'rdf-ext';

// Import the extractor unit tests function
import runExtractorUnitTests from './test/extractor-unit-tests.js';

async function runTests() {
    console.log('Running tests...');

    // TurtleTemplateToJSON tests
    // await testTurtleTemplateToJSON(); TODO BROKEN!!

    // JsonToHtmlForm tests
    // await testJsonToHtmlForm();  TODO BROKEN!!

    // Run extractor unit tests
    console.log('Running extractor unit tests...');
    await runExtractorUnitTests();


    // Extractor tests
    await testExtractor();


    console.log('All tests completed.');
}

async function testTurtleTemplateToJSON() {
    console.log('Testing TurtleTemplateToJSON...');
    const tt2json = new TurtleTemplateToJSON();

    const turtleString = `
        @prefix : <http://example.org/> .
        @prefix foaf: <http://xmlns.com/foaf/0.1/> .
        
        :person a foaf:Person ;
            foaf:name "John Doe" ;
            foaf:age "30"^^<http://www.w3.org/2001/XMLSchema#integer> .
    `;

    const result = await tt2json.turtle2json(turtleString);

    assert.strictEqual(typeof result, 'object', 'Result should be an object');
    assert.strictEqual(result.ROOT.type, 'Person', 'Root type should be Person');
    assert.strictEqual(result.ROOT.properties.length, 2, 'Should have 2 properties');

    console.log('TurtleTemplateToJSON tests passed.');
}

async function testJsonToHtmlForm() {
    console.log('Testing JsonToHtmlForm...');
    const jsonToHtml = new JsonToHtmlForm();

    const mockJsonData = {
        ROOT: {
            properties: [
                { term: 'name', type: 'LITERAL', namespace: 'http://xmlns.com/foaf/0.1/' },
                { term: 'age', type: 'LITERAL', namespace: 'http://xmlns.com/foaf/0.1/', subtype: 'INTEGER' }
            ]
        }
    };

    // Note: This might need adjustment based on how your JsonToHtmlForm actually works
    const htmlString = await jsonToHtml.jsonFileToHtmlForm('./src/templates/html-template.html', JSON.stringify(mockJsonData));

    assert.strictEqual(typeof htmlString, 'string', 'Result should be a string');
    assert.ok(htmlString.includes('<form'), 'HTML should contain a form');
    assert.ok(htmlString.includes('data-term="name"'), 'HTML should contain name input');
    assert.ok(htmlString.includes('data-term="age"'), 'HTML should contain age input');

    console.log('JsonToHtmlForm tests passed.');
}

async function testExtractor() {
    console.log('Testing Extractor...');

    const mockDocument = new JSDOM(`
        <form>
            <textarea data-term="name" data-namespace="http://xmlns.com/foaf/0.1/">John Doe</textarea>
            <input data-term="age" data-namespace="http://xmlns.com/foaf/0.1/" type="number" value="30">
        </form>
    `).window.document;

    const result = await extract(mockDocument);
    console.log('RESULT = ' + result)
    assert(typeof result === 'string', 'Result should be a string');
    assert(result.includes('John Doe'), 'Result should contain the input value');
    assert(result.includes('http://xmlns.com/foaf/0.1/name'), 'Result should contain the full predicate URI');
    assert(result.includes('http://xmlns.com/foaf/0.1/age'), 'Result should contain the age predicate');
    assert(result.includes('30'), 'Result should contain the age value');

    console.log('Extractor tests passed.');
}

runTests().catch(console.error);