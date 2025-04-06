```
./a

cd ~/hyperdata/farelo/form-a-matic
npm run build
npm run fam
npm run rp

repopack --verbose -c repopack.config.json .
```

http://localhost/FORM-A-MATIC/src/public/foaf-form.html

in browser :

duplexify.js:41 Uncaught TypeError: Class extends value undefined is not a constructor or null
at duplexify.js:41:25
(anonymous) @ duplexify.js:41
duplexify.js:44 Uncaught TypeError: Class extends value undefined is not a constructor or null
at duplexify.js:44:25

```
cd ~/github-danny/hyperdata/packages/farelo/form-a-matic

node src/index.js

node src/index.js > src/test-data/foaf-template.json
```

```
repopack --verbose -c repopack.config.json src
```

```
repopack --verbose -c repopack.config.json .
```

danny@danny-desktop:~/github-danny/hyperdata/packages/farelo/form-a-matic$ node src/index.js

"scripts": {
"build": "webpack --mode development",
"test": "node src/fam-test.js"
