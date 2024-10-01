# Farelo Next Steps

## Form-a-matic

* fix json-to-html.js
* fix tests
* add comments

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
