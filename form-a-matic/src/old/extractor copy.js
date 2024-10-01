import rdf from 'rdf-ext';
import N3Writer from '@rdfjs/parser-n3';


function createRDFNodes(data, parentSubject = null) {
    const dataset = rdf.dataset();
    const subject = parentSubject || rdf.blankNode();

    data.forEach(item => {
        const predicate = rdf.namedNode(item.namespace + item.term);

        if (item.entries) {
            // Handle multiple nested entries
            item.entries.forEach(entry => {
                const entrySubject = rdf.blankNode();
                dataset.add(rdf.quad(subject, predicate, entrySubject));
                const nestedDataset = createRDFNodes(Object.values(entry), entrySubject);
                dataset.addAll(nestedDataset);
            });
        } else {
            let object;
            if (item.type === 'LITERAL') {
                object = rdf.literal(item.value);
            } else if (item.type === 'URI') {
                object = rdf.namedNode(item.value);
            } else {
                object = rdf.blankNode();
            }
            dataset.add(rdf.quad(subject, predicate, object));
        }
    });

    return dataset;
}

function extractAllElementsData(form) {
    const elements = form.querySelectorAll('input, textarea');
    const data = Array.from(elements).map(extractElementData);

    // Group nested properties
    const groupedData = data.reduce((acc, item) => {
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

    return groupedData;
}

function extractElementData(element) {
    const data = {};
    for (const attr of element.attributes) {
        if (attr.name.startsWith('data-')) {
            const key = attr.name.slice(5); // Remove 'data-' prefix
            try {
                // Try to parse as JSON for nested structures
                data[key] = JSON.parse(attr.value);
            } catch {
                // If not JSON, store as is
                data[key] = attr.value;
            }
        }
    }
    data.value = element.value;
    if (element.tagName === 'FIELDSET') {
        data.entries = Array.from(element.querySelectorAll('.nested-entry'))
            .map(entry => {
                const entryData = {};
                entry.querySelectorAll('input, textarea').forEach(input => {
                    const inputData = extractElementData(input);
                    entryData[inputData.term] = inputData;
                });
                return entryData;
            });
    }
    return data;
}


function datasetToTurtle(dataset) {
    const writer = new N3Writer();
    let turtleString = '';

    writer.import(dataset.toStream())
        .on('data', (chunk) => { turtleString += chunk; })
        .on('end', () => {
            console.log('Serialization complete');
        });

    return turtleString;
}

// Main extract function
function extract(document) {
    const form = document.querySelector('form');
    const data = extractAllElementsData(form);
    const dataset = createRDFNodes(data);
    return datasetToTurtle(dataset);
}

// Make sure to export the extract function
export { extract };