# Requirements

Initially just something like a [del.icio.us](https://del.icio.us/danja) clone.

A bookmarklet, a simple POST form and a list view like :

![del.icio.us screenshot](https://github.com/danja/gnamgnam/blob/main/docs/images/delicious.png)

## Architecture

- Typescript/Angular browser code
- remote SPARQL store
- internal model compatible with m-ld

## Storage

1. remote SPARQL store
2. m-ld store
3. render to static pages

- Data integrity is job one

## Views

1. add link form
2. list bookmarks
3. bookmarklet
4. bulk add links
5. mobile

## Plugins

1. link extractor
2. site crawler
3. fs crawler
4. autotagger/summarizer (spacy)
