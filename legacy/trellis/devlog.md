## Trellis Development Log

**2021-04-26**


Ah, there's an index-preloaded.html which has existing data. UI full of holes, but seems good enou to build on. Basic outlining is there + per-node cards (each currently with the sae preset text).


Quick glance at the code. Seems fairly readable...

Golly, I'm using a lib by Hitoshi Uchida uchida@w3.org :'Triplestore wrapper for HTML5 WebStorage', also got a 'Save' button which does a PUT to a SPARQL store.
Somewhere this is hardcoded at http://server:3030/trellis
- looks like my laptop is running the code from Docker container, hmm...

**2021-03-31** Picking up again.

It seems the SPARQL endpoint was hardcoded in index.html, that'll need a tweak. Also, it appears to need to require a pre-existing graph contain the Trellis-tree root node.
