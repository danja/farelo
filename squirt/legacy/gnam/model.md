# Data Model

Although supporting multiple users isn't a priority, I think that can be covered by simply using a per-user named graph for the data.

So I can play with it, internal model compatible with m-ld. _No blank nodes._

```
@prefix w: <http://hyperdata.it/wiki/> .
@prefix tag: <http://hyperdata.it/tags/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
<http:\_\_test> a w:Bookmark ;
w:url <http://test> ;
dc:title "the title";
dc:description """some description""";
dc:creator <http:\_\_danja> ;

dc:topic tag:tag1 ;
dc:topic tag:tag2 ;
dc:topic tag:tag3 ;
dc:created "2018-07-24T12:16:57Z" .

tag:tag1 rdfs:label "tag1".
tag:tag2 rdfs:label "tag2".
tag:tag3 rdfs:label "tag3".

<http:\_\_danja> a foaf:Person ;
foaf:nick "danja" .

```

---

#### OLD

The bookmark model I came up with for https://github.com/danja/foolicious looked like this :

with note ... change Bookmark -nick-> "danja" to Bookmark -creator-> [Person] -nick-> danja

```
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
```
