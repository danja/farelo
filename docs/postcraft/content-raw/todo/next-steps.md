# Farelo Next Steps

- Publish at `https://hyperdata.it/2024/farelo`

http://localhost/GITHUB-DANNY/hyperdata/packages/farelo/src/form-a-matic/src/test-data/foaf-form.html

---

Make JSON-LDX, MD-LDX, [GRDDL](https://www.w3.org/TR/grddl/)-style for JSON, Markdown.

Publish at :

```
https://hyperdata.it/2024/xmlns/md-ldx
https://hyperdata.it/2024/xmlns/json-ldx
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
