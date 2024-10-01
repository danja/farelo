import { extract } from './public/extractor.js';

window.extract = extract;

console.log('browser-entry.js loaded');
window.extract = extract;
console.log('Extract function assigned to window:', typeof window.extract);

