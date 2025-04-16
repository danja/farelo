// src/js/model/TrestleRDFModel.js
import { TrestleModel } from './TrestleModel.js'
import RDFModel from '../../domain/rdf/RDFModel.js'
import { Config } from '../config.js'
import rdf from 'rdf-ext'
import { namespaces } from '../../utils/utils.js'

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

        // Create RDF model
        this.rdfModel = new RDFModel()

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
     * Add a node to the RDF dataset
     * @param {Object} node - Node object
     */
    addNodeToRDF(node) {
        if (!node) return

        const nodeData = {
            customId: node.id,
            type: node.type
        }

        if (node.title !== undefined) {
            nodeData.title = node.title
        }

        if (node.created !== undefined) {
            nodeData.created = node.created
        }

        if (node.description !== undefined) {
            nodeData.description = node.description
        }

        if (node.parent !== undefined) {
            nodeData.parent = `${this.baseUri}${node.parent}`
        }

        if (node.index !== undefined) {
            nodeData.index = node.index.toString()
        }

        // Create RDF representation
        const result = this.rdfModel.createPostData(nodeData)

        // Add to dataset
        for (const quad of result.dataset) {
            this.rdfDataset.add(quad)
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
            // Remove existing quads for this node
            const subject = rdf.namedNode(`${this.baseUri}${nodeId}`)
            const quadsToRemove = this.rdfDataset.match(subject)
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
            // Update description in RDF
            const subject = rdf.namedNode(`${this.baseUri}${nodeId}`)
            const dcns = rdf.namespace(Config.PREFIXES.dc)

            // Remove existing description triples
            const descQuads = this.rdfDataset.match(subject, dcns('description'))
            for (const quad of descQuads) {
                this.rdfDataset.delete(quad)
            }

            // Add new description
            if (description) {
                this.rdfDataset.add(rdf.quad(
                    subject,
                    dcns('description'),
                    rdf.literal(description)
                ))
            }
        }
    }

    /**
     * Delete a node and all its children
     * Overrides parent method to update RDF representation
     * @param {string} nodeId - Node ID to delete
     */
    deleteNode(nodeId) {
        // Get children before deletion
        const node = this.getNode(nodeId)
        const childrenIds = node?.children ? [...node.children] : []

        // Use parent implementation to delete node and children
        super.deleteNode(nodeId)

        // Remove node from RDF dataset
        this.removeNodeFromRDF(nodeId)

        // Also remove all children
        for (const childId of childrenIds) {
            this.removeNodeFromRDF(childId)
        }
    }

    /**
     * Remove a node from the RDF dataset
     * @param {string} nodeId - Node ID to remove
     */
    removeNodeFromRDF(nodeId) {
        const subject = rdf.namedNode(`${this.baseUri}${nodeId}`)
        const quadsToRemove = this.rdfDataset.match(subject)
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
                if (child && child.id !== nodeId) {
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
        // Make sure RDF dataset is up to date
        this.buildRDFDataset()

        // For now, fallback to parent implementation to ensure compatibility
        return super.toTurtle()

        // In the future, this could use RDF-Ext serialization:
        // const serializer = new N3Serializer();
        // return serializer.serialize(this.rdfDataset);
    }

    /**
     * Export the RDF dataset
     * @returns {Dataset} RDF dataset
     */
    getRDFDataset() {
        // Make sure dataset is up to date
        this.buildRDFDataset()
        return this.rdfDataset
    }
}
export default TrestleRDFModel