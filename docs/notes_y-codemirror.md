# Bundling up Codemirror to use instead of textarea in HKMS (and later add y.js)

from :

https://nathanielknight.ca/articles/codemirror_in_30.html

needs bundler :

https://esbuild.github.io/

npm install --save-exact esbuild


npm run esbuild --minify --bundle main.js --outfile=editor.js

didn't work, but this did :

./node_modules/.bin/esbuild --minify --bundle main.js --outfile=editor.js

[[
This document has:

a form with a textarea that we're going to submit
the editor.js script that esbuild built for us
When the page is first loaded, we mark the textarea as hidden and append a CodeMirror editor to the form. As the form gets submitted, we copy the contents of the editor into the textarea so that it gets sent along with the rest of the form.
]]

FROM log.md

./node_modules/.bin/esbuild --minify --bundle y/src/index.js --outfile=ye.js



