import rdf from 'rdf-ext';
import N3Writer from '@rdfjs/parser-n3';

export class RDFNodeCreator {
    constructor(rdf) {
        this.rdf = rdf;
    }

    createNode(item) {
        if (item.type === 'LITERAL') {
            return this.rdf.literal(item.value);
        } else if (item.type === 'URI') {
            return this.rdf.namedNode(item.value);
        } else {
            return this.rdf.blankNode();
        }
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

            if (item.entries) {
                this.handleEntries(dataset, subject, predicate, item.entries);
            } else {
                const object = this.nodeCreator.createNode(item);
                dataset.add(this.rdf.quad(subject, predicate, object));
            }
        });

        return dataset;
    }

    handleEntries(dataset, subject, predicate, entries) {
        entries.forEach(entry => {
            const entrySubject = this.rdf.blankNode();
            dataset.add(this.rdf.quad(subject, predicate, entrySubject));
            const nestedDataset = this.build(Object.values(entry), entrySubject);
            dataset.addAll(nestedDataset);
        });
    }
}

export class FormDataExtractor {
    extract(form) {
        const elements = form.querySelectorAll('input, textarea');
        const data = Array.from(elements).map(element => this.extractElementData(element));
        return this.groupData(data);
    }

    extractElementData(element) {
        const data = this.extractDataAttributes(element);
        data.value = element.value;

        if (element.tagName === 'FIELDSET') {
            data.entries = this.extractFieldsetEntries(element);
        }

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
                //   data[key] = this.parseAttributeValue(attr.value); broken below?
            }
        }
        return data;
    }

    parseAttributeValue(value) { // broken?
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

export class TurtleSerializer {
    constructor(N3Writer) {
        this.N3Writer = N3Writer;
    }

    serialize(dataset) {
        return new Promise((resolve, reject) => {
            const writer = new this.N3Writer();
            let turtleString = '';

            writer.import(dataset.toStream())
                .on('data', (chunk) => { turtleString += chunk; })
                .on('end', () => resolve(turtleString))
                .on('error', reject);
        });
    }
}

export class RDFExtractor {
    constructor(rdf, N3Writer) {
        this.rdf = rdf;
        this.formDataExtractor = new FormDataExtractor();
        this.nodeCreator = new RDFNodeCreator(rdf);
        this.datasetBuilder = new DatasetBuilder(rdf, this.nodeCreator);
        this.turtleSerializer = new TurtleSerializer(N3Writer);
    }

    /*
    writable.js:268 Uncaught TypeError: The "chunk" argument must be of type string or an instance of Buffer or Uint8Array. Received an instance of Quad
    */

    async extract(document) {
        console.log('Extract called')
        try {
            const form = document.querySelector('form');
            console.log('A')
            const data = this.formDataExtractor.extract(form);
            console.log('B')
            const dataset = this.datasetBuilder.build(data);
            console.log('C')
            const serialized = await this.turtleSerializer.serialize(dataset);
            console.log('D')
            return serialized
        } catch (error) {
            console.error('Extraction failed:', error);
            throw error;
        }
    }
}

const extractor = new RDFExtractor(rdf, N3Writer);
export const extract = (document) => extractor.extract(document);
export default extract;