/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "?f4a3":
/*!*************************************!*\
  !*** rdf-canonize-native (ignored) ***!
  \*************************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "./src/browser-entry.js":
/*!******************************************!*\
  !*** ./src/browser-entry.js + 1 modules ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

"use strict";

// EXTERNAL MODULE: ./node_modules/rdf-ext/index.js + 127 modules
var rdf_ext = __webpack_require__("./node_modules/rdf-ext/index.js");
// EXTERNAL MODULE: ./node_modules/@rdfjs/parser-n3/index.js + 6 modules
var parser_n3 = __webpack_require__("./node_modules/@rdfjs/parser-n3/index.js");
;// ./src/public/extractor.js



class RDFNodeCreator {
    constructor(rdf) {
        this.rdf = rdf;
    }

    createNode(item) {
        if (item.type === 'LITERAL') {
            return this.rdf.literal(item.value);
        } else if (item.type === 'URI') {
            return this.rdf.namedNode(item.value);
        } else {
            return this.rdf.blankNode();
        }
    }
}

class DatasetBuilder {
    constructor(rdf, nodeCreator) {
        this.rdf = rdf;
        this.nodeCreator = nodeCreator;
    }

    build(data, parentSubject = null) {
        const dataset = this.rdf.dataset();
        const subject = parentSubject || this.rdf.blankNode();

        data.forEach(item => {
            const predicate = this.rdf.namedNode(item.namespace + item.term);

            if (item.entries) {
                this.handleEntries(dataset, subject, predicate, item.entries);
            } else {
                const object = this.nodeCreator.createNode(item);
                dataset.add(this.rdf.quad(subject, predicate, object));
            }
        });

        return dataset;
    }

    handleEntries(dataset, subject, predicate, entries) {
        entries.forEach(entry => {
            const entrySubject = this.rdf.blankNode();
            dataset.add(this.rdf.quad(subject, predicate, entrySubject));
            const nestedDataset = this.build(Object.values(entry), entrySubject);
            dataset.addAll(nestedDataset);
        });
    }
}

class FormDataExtractor {
    extract(form) {
        const elements = form.querySelectorAll('input, textarea');
        const data = Array.from(elements).map(this.extractElementData);
        return this.groupData(data);
    }

    extractElementData(element) {
        const data = this.extractDataAttributes(element);
        data.value = element.value;

        if (element.tagName === 'FIELDSET') {
            data.entries = this.extractFieldsetEntries(element);
        }

        return data;
    }

    extractDataAttributes(element) {
        const data = {};
        for (const attr of element.attributes) {
            if (attr.name.startsWith('data-')) {
                const key = attr.name.slice(5);
                data[key] = this.parseAttributeValue(attr.value);
            }
        }
        return data;
    }

    parseAttributeValue(value) {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    extractFieldsetEntries(fieldset) {
        return Array.from(fieldset.querySelectorAll('.nested-entry'))
            .map(entry => {
                const entryData = {};
                entry.querySelectorAll('input, textarea').forEach(input => {
                    const inputData = this.extractElementData(input);
                    entryData[inputData.term] = inputData;
                });
                return entryData;
            });
    }

    groupData(data) {
        return data.reduce((acc, item) => {
            if (item.children) {
                const parentIndex = acc.findIndex(d => d.term === item.term);
                if (parentIndex !== -1) {
                    acc[parentIndex].children = item.children;
                } else {
                    acc.push(item);
                }
            } else {
                acc.push(item);
            }
            return acc;
        }, []);
    }
}

class TurtleSerializer {
    constructor(N3Writer) {
        this.N3Writer = N3Writer;
    }

    serialize(dataset) {
        return new Promise((resolve, reject) => {
            const writer = new this.N3Writer();
            let turtleString = '';

            writer.import(dataset.toStream())
                .on('data', (chunk) => { turtleString += chunk; })
                .on('end', () => resolve(turtleString))
                .on('error', reject);
        });
    }
}

class RDFExtractor {
    constructor(rdf, N3Writer) {
        this.rdf = rdf;
        this.formDataExtractor = new FormDataExtractor();
        this.nodeCreator = new RDFNodeCreator(rdf);
        this.datasetBuilder = new DatasetBuilder(rdf, this.nodeCreator);
        this.turtleSerializer = new TurtleSerializer(N3Writer);
    }

    async extract(document) {
        try {
            const form = document.querySelector('form');
            const data = this.formDataExtractor.extract(form);
            const dataset = this.datasetBuilder.build(data);
            return await this.turtleSerializer.serialize(dataset);
        } catch (error) {
            console.error('Extraction failed:', error);
            throw error;
        }
    }
}

const extractor = new RDFExtractor(rdf_ext["default"], parser_n3["default"]);
const extract = (document) => extractor.extract(document);
;// ./src/browser-entry.js


window.extract = extract;

console.log('browser-entry.js loaded');
window.extract = extract;
console.log('Extract function assigned to window:', typeof window.extract);



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkform_a_matic"] = self["webpackChunkform_a_matic"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_rdf-ext_index_js"], () => (__webpack_require__("./src/browser-entry.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.bundle.js.map