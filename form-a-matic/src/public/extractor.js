import rdf from 'rdf-ext';
import N3Writer from '@rdfjs/parser-n3';
import formatsPretty from '@rdfjs/formats/pretty.js'

/*
/home/danny/github-other/rdf-ext/rdf-ext-examples/examples/browser/io-dataset.js
*/
export class RDFNodeCreator {
    constructor(rdf) {
        this.rdf = rdf;
    }

    createNode(item) {
        console.log('Creating node for item:', item);
        let node;
        if (item.type === 'LITERAL') {
            node = this.rdf.literal(item.value);
        } else if (item.type === 'URI') {
            node = this.rdf.namedNode(item.value);
        } else {
            node = this.rdf.blankNode();
        }
        console.log('Created node:', node.toString());
        return node;
    }
}


export class DatasetBuilder {
    constructor(rdf, nodeCreator) {
        this.rdf = rdf;
        this.nodeCreator = nodeCreator;
    }

    build(data, parentSubject = null) {
        const dataset = this.rdf.dataset();
        const subject = parentSubject || this.rdf.blankNode();

        data.forEach(item => {
            const predicate = this.rdf.namedNode(item.namespace + item.term);
            const object = this.nodeCreator.createNode(item);
            const quad = this.rdf.quad(subject, predicate, object);
            console.log('Adding quad:', quad.toString());
            dataset.add(quad);
        });

        return dataset;
    }
}

export class FormDataExtractor {
    extract(form) {
        const elements = form.querySelectorAll('input, textarea');
        console.log('Found form elements:', elements);
        const data = Array.from(elements).map(element => this.extractElementData(element));
        console.log('Extracted form data:', data);
        return this.groupData(data);
    }

    extractElementData(element) {
        const data = this.extractDataAttributes(element);
        data.value = element.value;
        data.type = element.type === 'number' ? 'LITERAL' : 'LITERAL';  // You might want to add more specific type handling here
        console.log('Extracted element data:', data);
        return data;
    }

    extractDataAttributes(element) {
        console.log("element = " + element)
        const data = {};
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-')) {
                const key = attr.name.slice(5);
                console.log("key = " + key)
                console.log("attr.value = " + attr.value)
                data[key] = attr.value;
            }
        }
        return data;
    }

    parseAttributeValue(value) {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    extractFieldsetEntries(fieldset) {
        return Array.from(fieldset.querySelectorAll('.nested-entry'))
            .map(entry => {
                const entryData = {};
                entry.querySelectorAll('input, textarea').forEach(input => {
                    const inputData = this.extractElementData(input);
                    entryData[inputData.term] = inputData;
                });
                return entryData;
            });
    }

    groupData(data) {
        return data.reduce((acc, item) => {
            if (item.children) {
                const parentIndex = acc.findIndex(d => d.term === item.term);
                if (parentIndex !== -1) {
                    acc[parentIndex].children = item.children;
                } else {
                    acc.push(item);
                }
            } else {
                acc.push(item);
            }
            return acc;
        }, []);
    }
}

import Serializer from '@rdfjs/serializer-turtle'



export class TurtleSerializer {
    async serialize(dataset) {
        /*
        const serializer = new Serializer()
        const output = serializer.import(dataset.stream)

        output.pipe(process.stdout)
        */
        /////////////////////////////////////////////////////////
        // clone the default environment
        const rdfPretty = rdf.clone()

        // import pretty print serializers
        rdfPretty.formats.import(formatsPretty)

        const ttl = await rdfPretty.io.dataset.toText('text/turtle', dataset)



        console.log('**********************')
        // console.log(ttl)
        console.log('**********************')
        return ttl

        /*
        return new Promise((resolve, reject) => {
            let result = '';
            dataset.forEach(quad => {
                result += this.serializeQuad(quad) + '\n';
            });
            console.log('Serialized result:', result);
            resolve(result);
        });
        */
    }

    serializeQuad(quad) {
        return `${this.serializeTerm(quad.subject)} ${this.serializeTerm(quad.predicate)} ${this.serializeTerm(quad.object)} .`;
    }

    serializeTerm(term) {
        if (term.termType === 'NamedNode') {
            return `<${term.value}>`;
        } else if (term.termType === 'BlankNode') {
            return `_:${term.value}`;
        } else if (term.termType === 'Literal') {
            return `"${term.value}"`;
        }
    }
}

export class RDFExtractor {
    constructor(rdf, N3Writer) {
        this.rdf = rdf;
        this.formDataExtractor = new FormDataExtractor();
        this.nodeCreator = new RDFNodeCreator(rdf);
        this.datasetBuilder = new DatasetBuilder(rdf, this.nodeCreator);
        this.turtleSerializer = new TurtleSerializer();
    }

    async extract(document) {
        console.log('Extract called');
        try {
            const form = document.querySelector('form');
            console.log('Form found:', form);
            const data = this.formDataExtractor.extract(form);
            console.log('Extracted data:', data);
            const dataset = this.datasetBuilder.build(data);
            console.log('Built dataset:', dataset);
            const serialized = await this.turtleSerializer.serialize(dataset);
            console.log('Serialized data:', serialized);
            return serialized; // Make sure to return the serialized data
        } catch (error) {
            console.error('Extraction failed:', error);
            throw error;
        }
    }
}

/*
export extract = extract(document){


    extractor.extract(document).then((value) => {
        console.log(value);
        return value
        // Expected output: 123
    });
}
    */


async function extract(document) {
    const extractor = new RDFExtractor(rdf, N3Writer);
    const turtle = await extractor.extract(document);
    return turtle; // Make sure to return the result
}
export default extract

