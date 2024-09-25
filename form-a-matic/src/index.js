// index.js
import fs from 'fs/promises'
import path from 'path'
import beautify from 'simply-beautiful'

// local
import TurtleTemplateToJSON from './tt-to-json.js'
import JsonToHtmlForm from './json-to-html.js'


async function main() {
    const file = 'src/test-data/foaf-template.ttl'
    const turtleString = await fs.readFile(file, 'utf-8')
    const tj = new TurtleTemplateToJSON()
    const result = await tj.turtle2json(turtleString)

    const jsonFile = file.replace('.ttl', '.json')

    const jsonString = JSON.stringify(result, null, 2)
    // console.log(JSON.stringify(result, null, 2))

    try {
        await fs.writeFile(jsonFile, jsonString, 'utf-8')
        console.log(`JSON file saved: ${jsonFile}`)
    } catch (error) {
        console.error(`Error saving JSON file: ${error.message}`)
    }

    // const htmlTemplate = jsonFile.replace('.json', '.html')
    const htmlTemplate = path.join(jsonFile, '../', 'html-template.html')
    const htmlFile = jsonFile.replace('template.json', 'form.html')

    const converter = new JsonToHtmlForm()
    var htmlString = await converter.jsonFileToHtmlForm(htmlTemplate, jsonFile)
    htmlString = beautify.html(htmlString)


    // console.log(htmlFile)
    // process.exit()
    try {
        await fs.writeFile(htmlFile, htmlString, 'utf-8')
        console.log(`HTML file saved: ${htmlFile}`)
    } catch (error) {
        console.error(`Error saving HTML file: ${error.message}`)
    }

    //.then(htmlString => console.log(htmlString))
    //  .catch(error => console.error('Error:', error))
}

main().catch(console.error);