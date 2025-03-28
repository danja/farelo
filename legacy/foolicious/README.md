# Foolicious
SPARQL Store-backed bookmarker (Delicious clone)

### Status
**2018-07-25** Full-page version basically working.

2018-07-23 Just started. Lifting bits of code from [FooWiki](https://github.com/danja/foowiki)

## Description

Browser toolbar button (bookmarklet) to capture current page URL, title, description, tags, user nickname, date. Format at Turtle or SPARQL,  Post to Fuseki server.

## TODO

Fix
Bookmark -nick-> "danja"
to
Bookmark -creator-> [Person] -nick-> danja

(check foowiki, make sure not made same mistake)

Either:

Trim down to totally work in a bookmarklet

and/or

Make bookmarklet load pop-up version of full page
