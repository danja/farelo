import rdf from 'rdf-ext';
import { generateNid } from './utils.js';

export class RDFFormExtractor {
  constructor() {
    this.dataset = rdf.dataset();
  }

  async extract(form) {
    const formData = new FormData(form);
    const subject = rdf.namedNode(generateNid(formData.get('title')));
    
    for (const element of form.elements) {
      if (!element.name) continue;
      
      const predicate = rdf.namedNode(element.dataset.namespace + element.dataset.term);
      const object = this.createObject(element);
      
      if (object) {
        this.dataset.add(rdf.quad(subject, predicate, object));
      }
    }
    
    // Add type and timestamp
    const type = rdf.namedNode('http://purl.org/stuff/squirt/' + form.dataset.type);
    const now = new Date().toISOString();
    
    this.dataset.add(rdf.quad(
      subject,
      rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      type
    ));
    
    this.dataset.add(rdf.quad(
      subject,
      rdf.namedNode('http://purl.org/dc/terms/created'),
      rdf.literal(now, rdf.namedNode('http://www.w3.org/2001/XMLSchema#dateTime'))
    ));

    return this.dataset;
  }

  createObject(element) {
    const value = element.value.trim();
    if (!value) return null;
    
    switch(element.type) {
      case 'url':
        return rdf.namedNode(value);
      case 'number':
        return rdf.literal(value, rdf.namedNode('http://www.w3.org/2001/XMLSchema#decimal'));
      default:
        return rdf.literal(value);
    }
  }
}
