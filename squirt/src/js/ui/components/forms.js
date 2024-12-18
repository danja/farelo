import { state } from '../../core/state.js';
import { ErrorHandler } from '../../core/errors.js';
import { postToSparql } from '../../services/sparql/sparql.js';
import rdf from 'rdf-ext';
import { generateNid } from '../../utils/utils.js';

export function setupForms() {
  setupPostForm();
}

function setupPostForm() {
  const form = document.getElementById('post-form');
  if (!form) {
    ErrorHandler.handle(new Error('Post form not found'));
    return;
  }

  initializeFormFields(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    try {
      await submitPost(formData);
      form.reset();
      state.update('lastPostStatus', 'success');
    } catch (error) {
      ErrorHandler.handle(error);
      state.update('lastPostStatus', 'error');
    }
  });
}

function initializeFormFields(form) {
  if (!form.querySelector('#content-field')) {
    const textarea = document.createElement('textarea');
    textarea.id = 'content-field';
    textarea.name = 'content';
    textarea.required = true;
    textarea.placeholder = 'Enter your content here...';
    form.appendChild(textarea);
  }
}

async function submitPost(formData) {
  state.update('postSubmitting', true);
  
  try {
    const dataset = rdf.dataset();
    const content = formData.get('content');
    const postType = formData.get('post-type');
    
    // Create unique identifier for the post
    const subject = rdf.namedNode(generateNid(content));
    
    // Add post type
    dataset.add(rdf.quad(
      subject,
      rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      rdf.namedNode(`http://purl.org/stuff/squirt/${postType}`)
    ));
    
    // Add content
    dataset.add(rdf.quad(
      subject,
      rdf.namedNode('http://rdfs.org/sioc/ns#content'),
      rdf.literal(content)
    ));
    
    // Add timestamp
    dataset.add(rdf.quad(
      subject,
      rdf.namedNode('http://purl.org/dc/terms/created'),
      rdf.literal(new Date().toISOString())
    ));

    // Post to SPARQL endpoint
    await postToSparql(dataset);
    
    state.update('lastPost', {
      type: postType,
      content: content,
      timestamp: new Date().toISOString()
    });
  } finally {
    state.update('postSubmitting', false);
  }
}
