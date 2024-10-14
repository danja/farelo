import assert from 'assert';
import { JSDOM } from 'jsdom';

import {
  RDFNodeCreator,
  DatasetBuilder,
  FormDataExtractor,
  TurtleSerializer,
  RDFExtractor
} from '../src/public/extractor.js';
import rdf from 'rdf-ext';


async function runTests() {
  console.log('Testing RDFNodeCreator...');
  const nodeCreator = new RDFNodeCreator(rdf);
  const literalNode = nodeCreator.createNode({ type: 'LITERAL', value: 'test' });
  assert.strictEqual(literalNode.termType, 'Literal');
  assert.strictEqual(literalNode.value, 'test');

  console.log('Testing DatasetBuilder...');
  const datasetBuilder = new DatasetBuilder(rdf, new RDFNodeCreator(rdf));
  const data = [{ namespace: 'http://xmlns.com/foaf/0.1/', term: 'name', type: 'LITERAL', value: 'John Doe' }];
  const dataset = datasetBuilder.build(data);
  assert.strictEqual(dataset.size, 1);

  console.log('Testing FormDataExtractor...');
  const formDataExtractor = new FormDataExtractor();
  const mockDocument = new JSDOM(`
    <form>
      <textarea data-term="name" data-namespace="http://xmlns.com/foaf/0.1/">John Doe</textarea>
      <input data-term="age" data-namespace="http://xmlns.com/foaf/0.1/" type="number" value="30">
    </form>
  `).window.document;
  const extractedData = formDataExtractor.extract(mockDocument.querySelector('form'));
  assert.strictEqual(extractedData.length, 2);

  console.log('Testing TurtleSerializer...');
  const turtleSerializer = new TurtleSerializer();
  const serializedDataset = rdf.dataset();
  serializedDataset.add(rdf.quad(
    rdf.blankNode(),
    rdf.namedNode('http://xmlns.com/foaf/0.1/name'),
    rdf.literal('John Doe')
  ));
  const turtle = await turtleSerializer.serialize(serializedDataset);
  // assert(turtle.includes('_:'));
  // assert(turtle.includes('<http://xmlns.com/foaf/0.1/name>'));
  assert(turtle.includes('"John Doe"'));

  console.log('Testing RDFExtractor...');
  const rdfExtractor = new RDFExtractor(rdf);
  const result = await rdfExtractor.extract(mockDocument);
  assert(result.includes('<http://xmlns.com/foaf/0.1/name>'));
  assert(result.includes('"John Doe"'));
  assert(result.includes('<http://xmlns.com/foaf/0.1/age>'));
  assert(result.includes('"30"'));

  console.log('All extractor unit tests passed.');
}

export default runTests;