select distinct ?p WHERE {
?sub ?p ?obj .
}

select distinct ?o WHERE {
?sub a ?o .
}

## farelo/trellis

<http://hyperdata.it/trellis/RootNode>
2
<http://hyperdata.it/trellis/Node>

<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>
2
<http://purl.org/dc/terms/title>
3
<http://purl.org/dc/terms/created>
4
<http://hyperdata.it/trellis/index>
5
<http://hyperdata.it/trellis/parent>

## foowiki

http://purl.org/stuff/wiki#Page
http://rdfs.org/sioc/ns#Post

http://xmlns.com/foaf/0.1/nick
http://www.w3.org/2000/01/rdf-schema#label
http://www.w3.org/1999/02/22-rdf-syntax-ns#type
http://purl.org/dc/terms/created
http://purl.org/dc/terms/format
http://purl.org/dc/terms/modified
http://purl.org/dc/terms/title
http://purl.org/dc/terms/topic
http://rdfs.org/sioc/ns#content
http://xmlns.com/foaf/0.1/maker

## foolicious

@prefix w: <http://hyperdata.it/wiki/> .
@prefix tag: <http://hyperdata.it/tags/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
<http:\_\_test> a w:Bookmark ;
w:url <http://test> ;
dc:title "the title";
dc:description """some description""";
foaf:nick "danja";
dc:topic tag:tag1 ;
dc:topic tag:tag2 ;
dc:topic tag:tag3 ;
dc:created "2018-07-24T12:16:57.716Z" .
tag:tag1 rdfs:label "tag1".
tag:tag2 rdfs:label "tag2".
tag:tag3 rdfs:label "tag3".
