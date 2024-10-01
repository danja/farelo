import { extract } from '../public/extractor.js';

const FormAMatic = {
    extract: extract
};

if (typeof window !== 'undefined') {
    window.FormAMatic = FormAMatic;
    window.extract = extract;
}

export default FormAMatic;