/**
 * TrestleModel - Manages the data structure and SPARQL persistence
 */
import { Config } from '../config.js'
import { generateID, generateDate } from '../utils/utils.js'

export class TrestleModel {
    /**
     * @param {string} endpoint - SPARQL endpoint URL
     * @param {string} baseUri - Base URI for RDF data
     * @param {EventBus} eventBus - Event bus for component communication
     */
    constructor(endpoint, baseUri, eventBus) {
        this.endpoint = endpoint
        this.baseUri = baseUri
        this.eventBus = eventBus
        this.rootId = null
        this.nodes = new Map()

        // Register event handlers
        this.eventBus.subscribe('node:updated', this.handleNodeUpdate.bind(this))
        this.eventBus.subscribe('node:moved', this.handleNodeMove.bind(this))
        this.eventBus.subscribe('node:deleted', this.handleNodeDelete.bind(this))
    }

    /**
     * Initialize the model and load data
     */
    async initialize() {
        try {
            await this.loadData()
            this.eventBus.publish('model:loaded', { nodes: Array.from(this.nodes.values()) })
        } catch (error) {
            console.error('Failed to initialize model:', error)
            // Create a new empty model if none exists
            this.createEmptyModel()
        }
    }

    /**
     * Creates a new, empty data model
     */
    createEmptyModel() {
        const rootId = this.generateNodeId('root')
        this.rootId = rootId

        // Create root node
        this.nodes.set(rootId, {
            id: rootId,
            type: 'RootNode',
            children: []
        })

        this.eventBus.publish('model:created', {
            rootId: this.rootId,
            nodes: Array.from(this.nodes.values())
        })
    }

    /**
     * Generate a unique node ID
     * @param {string} prefix - Optional prefix for the ID
     * @returns {string} - The generated ID
     */
    generateNodeId(prefix = 'nid') {
        return `${prefix}-${generateID()}`
    }

    /**
     * Loads trestle data from SPARQL endpoint
     */
    async loadData() {
        try {
            const fURL = `${this.endpoint}?query=${encodeURIComponent(this.buildLoadQuery())}`
            //    console.log(`fURL = ${decodeURI(fURL)}`)
            const response = await fetch(fURL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`SPARQL query failed: ${response.statusText}`)
            }

            const data = await response.json()
            //    console.log(`data = ${JSON.stringify(data)}`)
            this.processLoadedData(data)

            return true
        } catch (error) {
            console.error('Error loading data:', error)
            throw error
        }
    }

    /**
     * Build SPARQL query to load all data
     */
    buildLoadQuery() {
        return `
            PREFIX dc: <${Config.PREFIXES.dc}>
            PREFIX ts: <${Config.PREFIXES.ts}>

            SELECT ?node ?type ?title ?created ?index ?parent WHERE {
                ?node a ?type .
                OPTIONAL { ?node dc:title ?title } .
                OPTIONAL { ?node dc:created ?created } .
                OPTIONAL { ?node ts:index ?index } .
                OPTIONAL { ?node ts:parent ?parent } .
             #   FILTER(STRSTARTS(STR(?type), "${Config.PREFIXES.ts}"))
            }
        `
    }

    /**
     * Process data loaded from SPARQL endpoint
     * @param {Object} data - JSON data from SPARQL endpoint
     */
    processLoadedData(data) {
        // Reset current data
        this.nodes.clear()
        this.rootId = null

        // Process all nodes
        const nodesMap = new Map()

        // First pass: create all nodes
        for (const binding of data.results.bindings) {
            const nodeUri = binding.node.value
            const nodeId = this.extractLocalId(nodeUri)
            const type = this.extractLocalType(binding.type.value)

            // Create or update node
            let node = nodesMap.get(nodeId) || { id: nodeId, children: [] }
            node.type = type

            if (binding.title) {
                node.title = binding.title.value
            }

            if (binding.created) {
                node.created = binding.created.value
            }

            if (binding.index) {
                node.index = parseInt(binding.index.value, 10)
            }

            if (binding.parent) {
                node.parent = this.extractLocalId(binding.parent.value)
            }

            // Check if root node
            if (type === 'RootNode') {
                this.rootId = nodeId
            }

            nodesMap.set(nodeId, node)
        }

        // Second pass: build parent-child relationships
        for (const [id, node] of nodesMap.entries()) {
            if (node.parent) {
                const parentNode = nodesMap.get(node.parent)
                if (parentNode) {
                    if (!parentNode.children) {
                        parentNode.children = []
                    }
                    parentNode.children.push(id)
                }
            }
        }

        // Sort children by index
        for (const node of nodesMap.values()) {
            if (node.children && node.children.length > 0) {
                node.children.sort((a, b) => {
                    const nodeA = nodesMap.get(a)
                    const nodeB = nodesMap.get(b)
                    return (nodeA.index || 0) - (nodeB.index || 0)
                })
            }
        }

        // Set the nodes in our model
        this.nodes = nodesMap
    }

    /**
     * Extract local ID from full URI
     * @param {string} uri - Full URI
     * @returns {string} - Local ID portion
     */
    extractLocalId(uri) {
        const parts = uri.split('/')
        return parts[parts.length - 1]
    }

    /**
     * Extract local type from full URI
     * @param {string} uri - Full URI
     * @returns {string} - Local type portion
     */
    extractLocalType(uri) {
        const parts = uri.split('/')
        return parts[parts.length - 1]
    }

    /**
     * Add a new node to the model
     * @param {string} parentId - Parent node ID
     * @param {string} title - Node title
     * @param {number} index - Position in parent's children
     * @returns {Object} - New node object
     */
    addNode(parentId, title, index) {
        const nodeId = this.generateNodeId()
        const now = generateDate()

        const newNode = {
            id: nodeId,
            type: 'Node',
            // danny      title: title || 'New Item',
            title: title || '',
            created: now,
            parent: parentId,
            index: index,
            children: []
        }

        // Add to model
        this.nodes.set(nodeId, newNode)

        // Update parent's children
        const parentNode = this.nodes.get(parentId)
        if (parentNode) {
            if (!parentNode.children) {
                parentNode.children = []
            }

            if (typeof index === 'number') {
                parentNode.children.splice(index, 0, nodeId)

                // Update indices for siblings
                this.updateChildIndices(parentNode)
            } else {
                // Add to end
                newNode.index = parentNode.children.length
                parentNode.children.push(nodeId)
            }
        }

        return newNode
    }

    /**
     * Update indices for all children of a node
     * @param {Object} parentNode - Parent node
     */
    updateChildIndices(parentNode) {
        if (parentNode.children) {
            parentNode.children.forEach((childId, index) => {
                const child = this.nodes.get(childId)
                if (child) {
                    child.index = index
                }
            })
        }
    }

    /**
     * Move a node to a new parent or position
     * @param {string} nodeId - ID of node to move
     * @param {string} newParentId - ID of new parent
     * @param {number} newIndex - New position in parent's children
     */
    moveNode(nodeId, newParentId, newIndex) {
        const node = this.nodes.get(nodeId)
        if (!node) return

        const oldParentId = node.parent
        const oldParent = this.nodes.get(oldParentId)

        // Remove from old parent
        if (oldParent && oldParent.children) {
            const oldIndex = oldParent.children.indexOf(nodeId)
            if (oldIndex !== -1) {
                oldParent.children.splice(oldIndex, 1)
                this.updateChildIndices(oldParent)
            }
        }

        // Add to new parent
        const newParent = this.nodes.get(newParentId)
        if (newParent) {
            if (!newParent.children) {
                newParent.children = []
            }

            if (typeof newIndex === 'number') {
                newParent.children.splice(newIndex, 0, nodeId)
            } else {
                newParent.children.push(nodeId)
                newIndex = newParent.children.length - 1
            }

            // Update node parent and index
            node.parent = newParentId
            node.index = newIndex

            // Update indices for new siblings
            this.updateChildIndices(newParent)
        }
    }

    /**
     * Delete a node and its children
     * @param {string} nodeId - ID of node to delete
     */
    deleteNode(nodeId) {
        const node = this.nodes.get(nodeId)
        if (!node) return

        // First recursively delete all children
        if (node.children && node.children.length > 0) {
            // Create a copy to avoid modifying during iteration
            const childrenToDelete = [...node.children]
            for (const childId of childrenToDelete) {
                this.deleteNode(childId)
            }
        }

        // Remove from parent's children array
        const parentId = node.parent
        if (parentId) {
            const parent = this.nodes.get(parentId)
            if (parent && parent.children) {
                const index = parent.children.indexOf(nodeId)
                if (index !== -1) {
                    parent.children.splice(index, 1)
                    this.updateChildIndices(parent)
                }
            }
        }

        // Remove from nodes map
        this.nodes.delete(nodeId)
    }

    /**
     * Update a node's properties
     * @param {string} nodeId - ID of node to update
     * @param {Object} properties - Properties to update
     */
    updateNode(nodeId, properties) {
        const node = this.nodes.get(nodeId)
        if (!node) return

        // Update properties
        Object.assign(node, properties)
    }

    /**
     * Update a node's description (stored in markdown)
     * @param {string} nodeId - ID of node to update
     * @param {string} description - Markdown description
     */
    updateNodeDescription(nodeId, description) {
        const node = this.nodes.get(nodeId)
        if (!node) return

        node.description = description
    }

    /**
     * Get a node by ID
     * @param {string} nodeId - Node ID
     * @returns {Object|undefined} - Node object or undefined
     */
    getNode(nodeId) {
        return this.nodes.get(nodeId)
    }

    /**
     * Get all nodes
     * @returns {Array} - Array of node objects
     */
    getAllNodes() {
        return Array.from(this.nodes.values())
    }

    /**
     * Get the root node
     * @returns {Object|undefined} - Root node or undefined
     */
    getRootNode() {
        return this.nodes.get(this.rootId)
    }

    /**
     * Convert model to Turtle format for saving
     * @returns {string} - Turtle representation of the model
     */
    toTurtle() {
        let turtle = `@prefix dc: <${Config.PREFIXES.dc}> .\n`
        turtle += `@prefix ts: <${Config.PREFIXES.ts}> .\n\n`

        // Add root node
        const rootNode = this.nodes.get(this.rootId)
        if (rootNode) {
            turtle += `<${this.baseUri}${rootNode.id}> a ts:RootNode .\n`
        }

        // Add all other nodes
        for (const [id, node] of this.nodes.entries()) {
            // Skip root node, already added
            if (id === this.rootId) continue

            if (node.type === 'Node') {
                turtle += `<${this.baseUri}${node.id}> a ts:Node;\n`

                // Add title if present
                if (node.title) {
                    turtle += `   dc:title "${this.escapeTurtle(node.title)}" ;\n`
                }

                // Add created date if present
                if (node.created) {
                    turtle += `   dc:created "${node.created}" ;\n`
                }

                // Add index
                turtle += `   ts:index "${node.index}" ;\n`

                // Add parent
                if (node.parent) {
                    turtle += `   ts:parent <${this.baseUri}${node.parent}> .\n`
                } else {
                    // Fallback to root if no parent
                    turtle += `   ts:parent <${this.baseUri}${this.rootId}> .\n`
                }

                // Add description if present (as a separate triple)
                if (node.description) {
                    turtle += `<${this.baseUri}${node.id}> dc:description """${this.escapeTurtle(node.description)}""" .\n`
                }
            }
        }

        return turtle
    }

    /**
     * Escape special characters for Turtle format
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeTurtle(text) {
        if (!text) return ''
        return text
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
    }

    /**
     * Save the current model to the SPARQL endpoint
     * @returns {Promise<boolean>} - True if save successful
     */
    async saveData() {
        try {
            const turtle = this.toTurtle()

            const response = await fetch(this.endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'text/turtle'
                },
                body: turtle
            })

            if (!response.ok) {
                throw new Error(`Failed to save data: ${response.statusText}`)
            }

            return true
        } catch (error) {
            console.error('Error saving data:', error)
            this.eventBus.publish('model:error', { message: 'Failed to save data', error })
            return false
        }
    }

    // Event handlers

    /**
     * Handle node update event
     * @param {Object} data - Event data
     */
    handleNodeUpdate(data) {
        const { nodeId, properties } = data
        this.updateNode(nodeId, properties)
    }

    /**
     * Handle node move event
     * @param {Object} data - Event data
     */
    handleNodeMove(data) {
        const { nodeId, newParentId, newIndex } = data
        this.moveNode(nodeId, newParentId, newIndex)
    }

    /**
     * Handle node delete event
     * @param {Object} data - Event data
     */
    handleNodeDelete(data) {
        const { nodeId } = data
        this.deleteNode(nodeId)
    }
}