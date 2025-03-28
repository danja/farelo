The goal is to create the app described below. There is already a basic skeleton in place.

Please read this, review the code under `src`, think deeply and create a plan of action.

# Squirt

Squirt is a Progressive Web App designed to make posting information to the Web easy across all devices.

It will maintain a local representation of immediate data, a remote SPARQL store will be used for long-term persistence.  

It is an updated, combined revision of the following :

* legacy/foolicious - a link poster
* legacy/gnam - a link poster, same
* legacy/foowiki - a wiki
* legacy/trellis - a tree-based organiser

there was an attempt to revise before, under

* legacy/sparql-diamonds - towards a lib for the SPARQL comms
* legacy/heditor - a start with

## Coding Environment

- Languages : HTML, CSS, vanilla JavaScript
- Dev tools : npm, WebPack, Jasmine, Chai, loglevel, nodejs using es modules

The legacy versions used lots of jquery with hogan for templating. The new version should replace jquery with modern vanilla js and nunjucks for templating. Internally data will use the RDF model, persisted as RDF-Ext datasets in JSON objects.

The text editor component should be based on CodeMirror. There was an attempt at this in `legacy/heditor`.

There needs to be support for markdown extensions, as in `legacy/heditor`. If necessary use the `marked` lib for text translations.

## Data Model

 Items to be posted will be given a unique node id generated from the date an a hash of the content fields, eg. `http://purl.org/stuff/squirt/nid_2024-12-03_a3C5`. See the files under `squirt/legacy/turtle-examples` for legacy use of RDF.

Provision should be made to support Named Graphs.

## Current Status

### Directory Structure

* /public: Contains the built/bundled files
* /src: Contains the source code
* /css: Stylesheet files
* /html: HTML templates
* /js: JavaScript source code

* /core: Core functionality (errors, state management)
* /services: Backend-like services, including RDF and SPARQL
* /ui: Frontend components and views
* /utils: Utility functions

## Protocols

In increasing order of priority, the following should be supported :

- SPARQL query & update (over HTTP)
- SPARQL protocol
- Direct HTTP GET, POST, PATCH

## UI

- The PWA should be built in such a way that mobile devices can use their system 'Share' functionality to eg. post a link directly from a browser.
- A "hamburger" icon will show at all times in the top-right corner, on clicking a context menu will be shown allowing navigation between windows
- It should be visually appealing, using vanilla JS, CSS & HTML, no frameworks

### Windows

1. Input Form (user)
2. Input Form (advanced, for developers, sparql tools for query & update)
3. Link post/Twitter-style client (user)
4. Wiki/blog post client
5. Chat-style client (user)
6. User Profile (mostly FOAF fields)
7. Settings

#### 1. HTML Form

A drop-down list allows the type of message to be decided. This will be taken from an internal RDF representation of the apps capabilities.
Initially three forms will be available :

## Deployment

Squirt is be available directly from our site, https://hyperdata.it/squirt as well as being packaged for Google Play and F-Droid. It is open source, MIT license.

SPARQL endpoint details can be found in `squirt/endpoint.json`
