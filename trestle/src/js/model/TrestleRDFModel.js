// src/js/model/TrestleRDFModel.js
import { TrestleModel } from './TrestleModel.js'
import { Config } from '../config.js'
import rdf from 'rdf-ext'

/**
 * Extension of TrestleModel that uses RDF-Ext for data representation
 */
class TrestleRDFModel extends TrestleModel {
    /**
     * Creates a new TrestleRDFModel instance
     * @param {string} endpoint - SPARQL endpoint URL
     * @param {string} baseUri - Base URI for RDF resources
     * @param {EventBus} eventBus - Event bus for communication
     */
    constructor(endpoint, baseUri, eventBus) {
        // Call parent constructor
        super(endpoint, baseUri, eventBus)

        // Create empty RDF dataset
        this.rdfDataset = rdf.dataset()
    }

    /**
     * Initialize the model by loading data or creating an empty structure
     * Overrides parent method to add RDF functionality
     */
    async initialize() {
        try {
            // Call parent implementation
            await super.initialize()

            // Build RDF dataset from loaded nodes
            this.buildRDFDataset()
        } catch (error) {
            console.error('Error in RDF initialization:', error)
            // Parent already handles errors
        }
    }

    /**
     * Create an empty model structure with just a root node
     * Overrides parent method to add RDF representation
     */
    createEmptyModel() {
        // Call parent implementation first
        super.createEmptyModel()

        // Build RDF dataset
        this.buildRDFDataset()
    }

    /**
     * Build RDF dataset from the current nodes
     */
    buildRDFDataset() {
        // Clear existing dataset
        this.rdfDataset = rdf.dataset()

        // Add all nodes to dataset
        for (const [nodeId, node] of this.nodes.entries()) {
            this.addNodeToRDF(node)
        }
    }

    /**
     * Add a node and its properties directly to the main RDF dataset
     * @param {Object} node - Node object
     */
    addNodeToRDF(node) {
        if (!node) return

        // Define namespaces needed
        const ns = {
            rdf: rdf.namespace(Config.PREFIXES.rdf || 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
            dc: rdf.namespace(Config.PREFIXES.dc),
            ts: rdf.namespace(Config.PREFIXES.ts),
            xsd: rdf.namespace(Config.PREFIXES.xsd || 'http://www.w3.org/2001/XMLSchema#') // Add xsd namespace
        }
        const subject = rdf.namedNode(`${this.baseUri}${node.id}`)

        // Helper to add quads directly to this.rdfDataset
        const add = (p, o) => {
            if (o !== undefined && o !== null) { // Only add if object exists
                this.rdfDataset.add(rdf.quad(subject, p, o))
            }
        }

        // Add type (ts:Node or ts:RootNode)
        add(ns.rdf('type'), ns.ts(node.type))

        // Add title (dc:title)
        if (node.title !== undefined) {
            add(ns.dc('title'), rdf.literal(node.title))
        }

        // Add creation date (dc:created) - Use node.created if available
        if (node.created) {
            add(ns.dc('created'), rdf.literal(node.created, ns.xsd('dateTime'))) // Assume xsd in Config or add default
        } else {
            // Fallback if TrestleModel didn't set it (should not happen ideally)
            add(ns.dc('created'), rdf.literal(new Date().toISOString(), ns.xsd('dateTime')))
        }

        // Add description (ts:description) - Use ts: namespace
        if (node.description !== undefined) {
            add(ns.ts('description'), rdf.literal(node.description))
        }

        // Add parent (ts:parent) - Use ts: namespace
        if (node.parent !== undefined && node.parent !== null) { // Check for null parent (root)
            add(ns.ts('parent'), rdf.namedNode(`${this.baseUri}${node.parent}`))
        }

        // Add index (ts:index) - Use ts: namespace
        if (node.index !== undefined) {
            add(ns.ts('index'), rdf.literal(node.index.toString())) // Ensure literal
        }
    }

    /**
     * Add a new node
     * Overrides parent method to add RDF representation
     * @param {string} parentId - Parent node ID
     * @param {string} title - Node title
     * @param {number} index - Position in parent's children
     * @returns {Object} The created node
     */
    addNode(parentId, title, index) {
        // Use parent implementation to create node
        const newNode = super.addNode(parentId, title, index)

        // Add RDF representation
        this.addNodeToRDF(newNode)

        return newNode
    }

    /**
     * Update node properties
     * Overrides parent method to update RDF representation
     * @param {string} nodeId - Node ID
     * @param {Object} properties - Properties to update
     */
    updateNode(nodeId, properties) {
        // Use parent implementation to update node
        super.updateNode(nodeId, properties)

        // Update RDF representation
        const node = this.getNode(nodeId)
        if (node) {
            // Remove existing quads for this node (original simple approach)
            const quadsToRemove = this.rdfDataset.match(rdf.namedNode(`${this.baseUri}${nodeId}`))
            for (const quad of quadsToRemove) {
                this.rdfDataset.delete(quad)
            }

            // Add updated node
            this.addNodeToRDF(node)
        }
    }

    /**
     * Update node description
     * Overrides parent method to update RDF representation
     * @param {string} nodeId - Node ID
     * @param {string} description - New description
     */
    updateNodeDescription(nodeId, description) {
        // Use parent implementation
        super.updateNodeDescription(nodeId, description)

        // Update RDF representation
        const node = this.getNode(nodeId)
        if (node) {
            // Remove existing description triples
            const descQuads = this.rdfDataset.match(rdf.namedNode(`${this.baseUri}${nodeId}`), rdf.namespace(Config.PREFIXES.dc)('description'))
            for (const quad of descQuads) {
                this.rdfDataset.delete(quad)
            }

            // Add new description
            if (description) {
                this.rdfDataset.add(rdf.quad(
                    rdf.namedNode(`${this.baseUri}${nodeId}`),
                    rdf.namespace(Config.PREFIXES.dc)('description'),
                    rdf.literal(description)
                ))
            }
        }
    }

    /**
     * Delete a node and all its children recursively
     * Overrides parent method to update RDF representation
     * @param {string} nodeId - Node ID to delete
     */
    deleteNode(nodeId) {
        // Get the node and all its descendants BEFORE deleting from the parent model
        const allNodesToDelete = this.getAllDescendantIds(nodeId)
        allNodesToDelete.push(nodeId) // Include the node itself

        // Use parent implementation to delete node and children from the in-memory model
        super.deleteNode(nodeId)

        // Remove all identified nodes from RDF dataset
        for (const idToDelete of allNodesToDelete) {
            this.removeNodeFromRDF(idToDelete)
        }
    }

    /**
     * Helper function to get all descendant IDs of a node
     * @param {string} nodeId - The ID of the node
     * @returns {string[]} - An array of descendant node IDs
     */
    getAllDescendantIds(nodeId) {
        const node = this.getNode(nodeId)
        if (!node || !node.children || node.children.length === 0) {
            return []
        }

        let descendantIds = []
        for (const childId of node.children) {
            descendantIds.push(childId)
            // Recursively get descendants of the child
            descendantIds = descendantIds.concat(this.getAllDescendantIds(childId))
        }
        return descendantIds
    }

    /**
     * Remove a node from the RDF dataset, including triples referencing it
     * @param {string} nodeId - Node ID to remove
     */
    removeNodeFromRDF(nodeId) {
        const subject = rdf.namedNode(`${this.baseUri}${nodeId}`)

        // Collect quads to remove first to avoid modifying dataset while iterating
        const quadsToRemove = []

        // Find quads where the node is the subject
        for (const quad of this.rdfDataset.match(subject)) {
            quadsToRemove.push(quad)
        }

        // Find quads where the node is the object
        for (const quad of this.rdfDataset.match(null, null, subject)) {
            quadsToRemove.push(quad)
        }

        // Now delete the collected quads
        for (const quad of quadsToRemove) {
            this.rdfDataset.delete(quad)
        }
    }

    /**
     * Move a node to a new parent or position
     * Overrides parent method to update RDF representation
     * @param {string} nodeId - Node to move
     * @param {string} newParentId - New parent node ID
     * @param {number} newIndex - Position in new parent's children
     */
    moveNode(nodeId, newParentId, newIndex) {
        // Use parent implementation to move node
        super.moveNode(nodeId, newParentId, newIndex)

        // Update RDF representation for the moved node
        const node = this.getNode(nodeId)
        if (node) {
            // Remove and recreate node's RDF representation
            this.removeNodeFromRDF(nodeId)
            this.addNodeToRDF(node)
        }

        // Also update the order of other nodes that might have changed indices
        const newParent = this.getNode(newParentId)
        if (newParent && newParent.children) {
            for (const childId of newParent.children) {
                const child = this.getNode(childId)
                if (child) { // Check if child exists (might have been the moved node)
                    this.removeNodeFromRDF(childId)
                    this.addNodeToRDF(child)
                }
            }
        }
    }

    /**
     * Convert model to Turtle format
     * Uses RDF dataset instead of manual string construction
     * @returns {string} Turtle representation
     */
    toTurtle() {
        // Fallback to parent (or implement RDF-Ext serialization later)
        return super.toTurtle()
    }

    /**
     * Export the RDF dataset
     * @returns {Dataset} RDF dataset
     */
    getRDFDataset() {
        return this.rdfDataset
    }
}
export default TrestleRDFModel