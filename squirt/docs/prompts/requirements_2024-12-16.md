/home/danny/github-danny/hyperdata/packages/farelo/squirt/knowledge

/home/danny/github-danny/hyperdata/workspaces/farelo/articles/squirt

The goal is to create the app described below. Today all we need to do is to get the basic skeleton built, provide posting of blog posts and links to a SPARQL endpoint.

Please read through and create a plan of action.

The following resources should be used for reference :

* knowledge/form-a-matic_repomix.txt - html form generator with function to extract RDF from form using RDF-Ext
* knowledge/chauvin-repomix.md - mcp server code
* knowledge/repomix-mcp.txt - mcp ontology spec
* knowledge/ns-old-repomix.md - various vocabularies used in the past

# Squirt

Squirt is a Progress Web App designed to make posting information to the Web easy across all devices. Three modes are supported : HTML form posting, interactive chat and Fediverse interaction.

## Coding Environment

* Languages : HTML, CSS, vanilla JavaScript
* Dev tools : npm, WebPack, Jasmine, Chai, nodejs helpers

## Data Model

Internally data will use the RDF model, persisted as RDF-Ext datasets in JSON objects. Items to be posted will be given a unique node id generated from the date an a hash of the content fields, eg.  `http://purl.org/stuff/squirt/nid_2024-12-03_a3C5`.

## Protocols

* SPARQL protocol
* SPARQL query & update (over HTTP)
* Direct HTTP GET, POST, PATCH
* XMPP
* Fediverse (Mastodon & Lemmy)
* Model Context Protocol

## UI

* The PWA should be built in such a way that mobile devices can use their system 'Share' functionality to eg. post a link directly from a browser.
* A "hamburger" icon will show at all times in the top-right corner, on clicking a context menu will be shown allowing navigation between windows

### Windows

1. Input Form (user)
2. Input Form (advanced, for developers, sparql tools for query & update)
3. Fediverse client (user)
4. Fediverse client (advanced, for developers)
5. Chat client (user)
6. Chat client (advanced, for developers)
7. User Profile (mostly FOAF fields)
8. Settings

#### 1. HTML Form

A drop-down list allows the type of message to be decided. This will be taken from an internal RDF representation of the apps capabilities.
Initially three forms will be available :

* Entry :
* Link :

#### 2. Chat client
#### 3. User Profile
#### 4. Settings

## Extension Points

* it will be easy to add support for other protocols

## Deployment

Squirt is be available directly from our site, https://hyperdata.it/squirt as well as being packaged for Google Play and F-Droid. It is open source, MIT license.

Generate complete, individual artifacts for any code or documents
