I had to do :

```sh
rm -rf node_modules package-lock.json
npm install
npm cache clean --force
```

from transmissions :

```sh
    "test": "jasmine --config=jasmine.json --reporter=tests/helpers/reporter.js",
    "cov": "nyc -a --include=src --reporter=lcov npm run test",
    "docs": "jsdoc -c jsdoc.json",
    "build": "webpack --mode=production --node-env=production",
    "build:dev": "webpack --mode=development",
    "build:prod": "webpack --mode=production --node-env=production",
    "rp": "repomix -c repomix.config-small.json . && repomix -c repomix.config-large.json . ",
    "watch": "webpack --watch",
    "serve": "webpack serve"

```
