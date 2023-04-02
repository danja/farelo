var commonPrefixes = `
PREFIX rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
PREFIX rdfs:    <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl:     <http://www.w3.org/2002/07/owl#>
PREFIX dc:      <http://purl.org/dc/elements/1.1/> 
PREFIX schema: <http://schema.org/>
PREFIX x:     <http://purl.org/stuff/> 
PREFIX prj:     <http://purl.org/stuff/project#>`

var classesQT = function () {
  return (
    commonPrefixes +
    `
             SELECT DISTINCT ?class ?label WHERE {
  
             ?class a rdfs:Class ;
             rdfs:label ?label
          }`
  )
}

var instancesQT = function (klass) {
  return `SELECT DISTINCT ?instance WHERE { ?instance a <${klass}> }`
}

var property_objectQT = function (subject) {
  return `SELECT DISTINCT ?property ?object WHERE { <${subject}> ?property ?object }`
}

var subject_propertyQT = function (object) {
  return `SELECT DISTINCT ?subject ?property WHERE { ?subject ?property <${object}> }`
}

var wikidatanameQT = function (name) {
  return (
    commonPrefixes +
    `
           SELECT DISTINCT ?link WHERE {

           ?link schema:name "${name}"@en .
        }`
  )
}

var postTriplesQT = function (triples) {
  console.log('triple = ' + triples)
  return `INSERT DATA { ${triples} }`
}
