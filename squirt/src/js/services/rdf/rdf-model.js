import rdf from 'rdf-ext';
import N3Parser from '@rdfjs/parser-n3';
import { namespaces, generateNid } from '../../utils/utils.js';
import { state } from '../../core/state.js';
import { querySparql, postToSparql } from '../sparql/sparql.js';

export class RDFModel {
  constructor() {
    this.parser = new N3Parser();
    this.ns = {};
    
    // Initialize namespaces
    Object.entries(namespaces).forEach(([prefix, uri]) => {
      this.ns[prefix] = rdf.namespace(uri);
    });

    // Load any cached data on initialization
    this.loadCachedData();
  }

  async loadCachedData() {
    try {
      const cachedData = localStorage.getItem('squirt_rdf_cache');
      if (cachedData) {
        const dataset = await this.parseFromString(cachedData);
        state.update('rdfDataset', dataset);
      } else {
        state.update('rdfDataset', rdf.dataset());
      }
    } catch (error) {
      console.error('Error loading cached RDF data:', error);
      state.update('rdfDataset', rdf.dataset());
    }
  }

  saveToCache(dataset) {
    try {
      localStorage.setItem('squirt_rdf_cache', dataset.toString());
    } catch (error) {
      console.error('Error caching RDF data:', error);
    }
  }

  async parseFromString(turtleString) {
    try {
      const quads = [];
      const parser = this.parser;
      
      return new Promise((resolve, reject) => {
        const stream = parser.import(rdf.stringToStream(turtleString));
        
        stream.on('data', quad => {
          quads.push(quad);
        });
        
        stream.on('error', error => {
          reject(error);
        });
        
        stream.on('end', () => {
          resolve(rdf.dataset(quads));
        });
      });
    } catch (error) {
      console.error('Error parsing RDF data:', error);
      throw error;
    }
  }

  /**
   * Create a new post in the RDF dataset
   * @param {Object} postData - The post data
   * @param {string} postData.type - The post type (e.g., 'link', 'entry')
   * @param {string} postData.content - The content of the post
   * @param {string} [postData.title] - Optional title
   * @param {string[]} [postData.tags] - Optional array of tags
   * @returns {string} The ID of the created post
   */
  createPost(postData) {
    const dataset = state.get('rdfDataset') || rdf.dataset();
    const postId = generateNid(postData.content);
    const subject = rdf.namedNode(postId);
    
    // Add RDF type
    dataset.add(rdf.quad(
      subject,
      this.ns.rdf('type'),
      this.ns.squirt(postData.type)
    ));
    
    // Add content
    dataset.add(rdf.quad(
      subject,
      this.ns.squirt('content'),
      rdf.literal(postData.content)
    ));
    
    // Add creation date
    dataset.add(rdf.quad(
      subject,
      this.ns.dc('created'),
      rdf.literal(new Date().toISOString(), rdf.namedNode('http://www.w3.org/2001/XMLSchema#dateTime'))
    ));
    
    // Add title if provided
    if (postData.title) {
      dataset.add(rdf.quad(
        subject,
        this.ns.dc('title'),
        rdf.literal(postData.title)
      ));
    }
    
    // Add tags if provided
    if (postData.tags && Array.isArray(postData.tags)) {
      postData.tags.forEach(tag => {
        dataset.add(rdf.quad(
          subject,
          this.ns.squirt('tag'),
          rdf.literal(tag)
        ));
      });
    }
    
    // Add URL if it's a link post and has a URL
    if (postData.type === 'link' && postData.url) {
      dataset.add(rdf.quad(
        subject,
        this.ns.squirt('url'),
        rdf.namedNode(postData.url)
      ));
    }
    
    // Update state with new dataset
    state.update('rdfDataset', dataset);
    
    // Save to cache
    this.saveToCache(dataset);
    
    return postId;
  }

  /**
   * Get posts from the dataset
   * @param {Object} [options] - Query options
   * @param {string} [options.type] - Filter by post type
   * @param {string} [options.tag] - Filter by tag
   * @param {number} [options.limit] - Max number of posts to return
   * @returns {Array} Array of post objects
   */
  getPosts(options = {}) {
    const dataset = state.get('rdfDataset');
    if (!dataset) return [];
    
    let posts = new Map();
    
    // Find all posts
    const postTypePattern = this.ns.rdf('type');
    
    // Get all subjects that are posts
    dataset.match(null, postTypePattern).forEach(quad => {
      const postType = quad.object.value.split('/').pop();
      
      // Skip if filtering by type and this doesn't match
      if (options.type && postType !== options.type) return;
      
      const postId = quad.subject.value;
      
      if (!posts.has(postId)) {
        posts.set(postId, {
          id: postId,
          type: postType,
          tags: []
        });
      }
    });
    
    // Now populate post details for the matched posts
    posts.forEach((post, id) => {
      const subject = rdf.namedNode(id);
      
      // Get content
      dataset.match(subject, this.ns.squirt('content')).forEach(quad => {
        post.content = quad.object.value;
      });
      
      // Get title
      dataset.match(subject, this.ns.dc('title')).forEach(quad => {
        post.title = quad.object.value;
      });
      
      // Get created date
      dataset.match(subject, this.ns.dc('created')).forEach(quad => {
        post.created = quad.object.value;
      });
      
      // Get tags
      dataset.match(subject, this.ns.squirt('tag')).forEach(quad => {
        post.tags.push(quad.object.value);
      });
      
      // Get URL for link posts
      dataset.match(subject, this.ns.squirt('url')).forEach(quad => {
        post.url = quad.object.value;
      });
    });
    
    // Filter by tag if needed
    if (options.tag) {
      posts = new Map(
        Array.from(posts.entries()).filter(([_, post]) => 
          post.tags.includes(options.tag)
        )
      );
    }
    
    // Convert to array and sort by date (newest first)
    let postsArray = Array.from(posts.values())
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    // Apply limit if specified
    if (options.limit && options.limit > 0) {
      postsArray = postsArray.slice(0, options.limit);
    }
    
    return postsArray;
  }

  /**
   * Synchronize local RDF data with remote SPARQL endpoint
   */
  async syncWithEndpoint() {
    const dataset = state.get('rdfDataset');
    if (!dataset || dataset.size === 0) return;
    
    try {
      await postToSparql(dataset);
      console.log('Data synchronized with SPARQL endpoint');
    } catch (error) {
      console.error('Failed to sync with SPARQL endpoint:', error);
      throw error;
    }
  }

  /**
   * Load posts from the SPARQL endpoint
   */
  async loadFromEndpoint() {
    try {
      const query = `
        PREFIX rdf: <${namespaces.rdf}>
        PREFIX squirt: <${namespaces.squirt}>
        PREFIX dc: <${namespaces.dc}>
        
        CONSTRUCT {
          ?s ?p ?o .
        }
        WHERE {
          ?s rdf:type ?type .
          FILTER(STRSTARTS(STR(?type), "${namespaces.squirt}"))
          ?s ?p ?o .
        }
      `;
      
      const response = await querySparql(query);
      
      if (response && response.results) {
        const dataset = await this.parseFromString(response.results);
        state.update('rdfDataset', dataset);
        this.saveToCache(dataset);
        console.log('Loaded data from SPARQL endpoint');
      }
    } catch (error) {
      console.error('Failed to load data from SPARQL endpoint:', error);
      throw error;
    }
  }

  /**
   * Delete a post from the dataset
   * @param {string} postId - The ID of the post to delete
   * @returns {boolean} Success status
   */
  deletePost(postId) {
    const dataset = state.get('rdfDataset');
    if (!dataset) return false;
    
    const subject = rdf.namedNode(postId);
    
    // Find all quads with this subject and remove them
    const quadsToRemove = dataset.match(subject);
    
    if (quadsToRemove.size === 0) return false;
    
    quadsToRemove.forEach(quad => {
      dataset.delete(quad);
    });
    
    // Update state
    state.update('rdfDataset', dataset);
    
    // Save to cache
    this.saveToCache(dataset);
    
    return true;
  }
}

// Export a singleton instance
export const rdfModel = new RDFModel();