import assert from 'assert';
import TurtleTemplateToJSON from './src/tt-to-json.js';
import JsonToHtmlForm from './src/json-to-html.js';
import { extract } from './src/public/extractor.js';

async function runTests() {
    console.log('Running tests...');

    // TurtleTemplateToJSON tests
    await testTurtleTemplateToJSON();

    // JsonToHtmlForm tests
    await testJsonToHtmlForm();

    // Extractor tests
    testExtractor();

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

    const htmlString = await jsonToHtml.jsonFileToHtmlForm('path/to/template.html', 'path/to/mock.json');

    assert.strictEqual(typeof htmlString, 'string', 'Result should be a string');
    assert.ok(htmlString.includes('<form'), 'HTML should contain a form');
    assert.ok(htmlString.includes('data-term="name"'), 'HTML should contain name input');
    assert.ok(htmlString.includes('data-term="age"'), 'HTML should contain age input');

    console.log('JsonToHtmlForm tests passed.');
}

function testExtractor() {
    console.log('Testing Extractor...');

    // Mock document object
    const mockDocument = {
        querySelector: () => ({
            querySelectorAll: () => [
                {
                    tagName: 'INPUT',
                    value: 'John Doe',
                    attributes: [
                        { name: 'data-term', value: 'name' },
                        { name: 'data-namespace', value: 'http://xmlns.com/foaf/0.1/' }
                    ]
                }
            ]
        })
    };

    const result = extract(mockDocument);

    assert.strictEqual(typeof result, 'string', 'Result should be a string');
    assert.ok(result.includes('John Doe'), 'Result should contain the input value');
    assert.ok(result.includes('http://xmlns.com/foaf/0.1/name'), 'Result should contain the full predicate URI');

    console.log('Extractor tests passed.');
}

runTests().catch(console.error);