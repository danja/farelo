Please show me the code needed for the following, after `result` is created, to swap the extension in `file` from `.ttl` to `.json` and save the stringified result asynchronously as a file. In this example the filename will be `src/test-data/foaf-template.json`.

```
    const file = 'src/test-data/foaf-template.ttl'
    const turtleString = await fs.readFile(file, 'utf-8')
    const tj = new TurtleTemplateToJSON()
    const result = await tj.turtle2json(turtleString)
    console.log(JSON.stringify(result, null, 2))
```
