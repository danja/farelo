// index.js
import fs from 'fs/promises'
import TurtleToJSON from './turtletojson.js'
import JsonToHtmlForm from './jsontohtml.js'





async function main() {
    const file = 'src/test-data/foaf-template.ttl'
    // const file = 'reference/doap-doap.ttl'
    const turtleString = await fs.readFile(file, 'utf-8');
    const tj = new TurtleToJSON();
    const result = await tj.turtle2json(turtleString);
    console.log(JSON.stringify(result, null, 2));

    const converter = new JsonToHtmlForm()
    converter.jsonFileToHtmlForm('src/test-data/foaf-template.json')
        .then(htmlString => console.log(htmlString))
        .catch(error => console.error('Error:', error))
}

main().catch(console.error);