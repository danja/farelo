The easiest way to check the language of literals is to use the lang() function. Using this, your query can be written as:

PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX test: <http://test#>
SELECT ?label ?preferredLabel
WHERE {
test:thing rdfs:label ?label
OPTIONAL {
test:thing rdfs:label ?preferredLabel .
FILTER (lang(?preferredLabel) = "" || lang(?preferredLabel) = "fr")
}
}
