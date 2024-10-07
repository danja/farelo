# Farelo Next Steps

## Form-a-matic

more test, CI/CD bits in

https://claude.ai/chat/3ddadbd1-f74c-4bdf-948e-16b29adc2684

last bits of this has error handling bits :

https://claude.ai/chat/f1beb06d-e2fe-44fa-93e6-07cf784429fd

* fix json-to-html.js
* fix tests
* add comments

writable.js:268 Uncaught TypeError: The "chunk" argument must be of type string or an instance of Buffer or Uint8Array. Received an instance of Quad
    at _write (writable.js:268:13)
    at Writable.write (writable.js:286:10)
    at Readable.ondata (readable.js:705:22)
    at Readable.emit (events.js:153:5)
    at Readable.read (readable.js:505:10)
    at flow (readable.js:929:34)
    at resume_ (readable.js:913:3)
    at Item.run (browser.js:153:14)

## Other

- Publish at `https://hyperdata.it/2024/farelo`

http://localhost/GITHUB-DANNY/hyperdata/packages/farelo/form-a-matic/src/test-data/foaf-form.html

---

Make JSON-LDX, MD-LDX, [GRDDL](https://www.w3.org/TR/grddl/)-style for JSON, Markdown.

Gleaning Resource Linkages from Lightweight Representations
Graph Rendering of Lightweight Linked Resources
Generating RDF from Lightweight Language Resources
Gleaning RDF from Lightweight Linguistic Representations
Graph Resource Linking from Lightweight Renditions

**Gleaning Resources from Lightweight Language Representations**

Publish at :

```
https://hyperdata.it/2024/xmlns/grllr/md-ldx
https://hyperdata.it/2024/xmlns/grllr/json-ldx
```

```
xmlns:data-view="http://www.w3.org/2003/g/data-view#"
data-view:transformation="http://www.w3.org/2003/g/embeddedRDF.xsl"
>

<xs:annotation>
 <xs:appinfo>
   <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
     <rdf:Description rdf:about="http://www.w3.org/2003/g/po-ex">
       <data-view:namespaceTransformation
           rdf:resource="grokPO.xsl" />
```

```json
{
  "dataview": "http://purl.org/stuff/json-ldx",
  "transformation": "https://hyperdata.it/2004/json-ldx.js"
}
```
