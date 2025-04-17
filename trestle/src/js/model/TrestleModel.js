// src/js/model/TrestleModel.js
import { Config } from '../config.js'
import { generateID, generateDate } from '../utils/utils.js'
import { TreeNodeOperations } from './TreeNodeOperations.js'
import { AsyncOperations } from '../utils/AsyncOperations.js'

export class TrestleModel {
    constructor(endpoint, baseUri, eventBus) {
        this.endpoint = endpoint
        this.baseUri = baseUri
        this.eventBus = eventBus
        this.rootId = null
        this.nodes = new Map()

        // Setup debounced save
        this.debouncedSave = AsyncOperations.debounce(this.saveData.bind(this), 2000)

        this.eventBus.subscribe('node:updated', this.handleNodeUpdate.bind(this))
        this.eventBus.subscribe('node:moved', this.handleNodeMove.bind(this))
        this.eventBus.subscribe('node:deleted', this.handleNodeDelete.bind(this))
    }

    async initialize() {
        try {
            await this.loadData()
            this.eventBus.publish('model:loaded', { nodes: Array.from(this.nodes.values()) })
        } catch (error) {
            console.error('Failed to initialize model:', error)
            this.createEmptyModel()
        }
    }

    createEmptyModel() {
        const rootId = this.generateNodeId('root')
        this.rootId = rootId

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

    generateNodeId(prefix = 'nid') {
        return `${prefix}-${generateID()}`
    }

    async loadData() {
        try {
            const fURL = `${this.endpoint}?query=${encodeURIComponent(this.buildLoadQuery())}`

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

            // Process data in chunks to avoid UI blocking
            await AsyncOperations.deferOperation(() => {
                this.processLoadedData(data)
            })

            return true
        } catch (error) {
            console.error('Error loading data:', error)
            throw error
        }
    }

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
            }
        `
    }

    processLoadedData(data) {
        this.nodes.clear()
        this.rootId = null

        const nodesMap = new Map()

        for (const binding of data.results.bindings) {
            const nodeUri = binding.node.value
            const nodeId = this.extractLocalId(nodeUri)
            const type = this.extractLocalType(binding.type.value)

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

            if (type === 'RootNode') {
                this.rootId = nodeId
            }

            nodesMap.set(nodeId, node)
        }

        // Using TreeNodeOperations to build the tree structure efficiently
        const treeStructure = TreeNodeOperations.buildTreeStructure(Array.from(nodesMap.values()), this.rootId)
        this.nodes = treeStructure.nodes
    }

    extractLocalId(uri) {
        const parts = uri.split('/')
        return parts[parts.length - 1]
    }

    extractLocalType(uri) {
        const parts = uri.split('/')
        return parts[parts.length - 1]
    }

    addNode(parentId, title, index) {
        const nodeId = this.generateNodeId()
        const now = generateDate()

        const newNode = {
            id: nodeId,
            type: 'Node',
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
                this.updateChildIndices(parentNode)
            } else {
                newNode.index = parentNode.children.length
                parentNode.children.push(nodeId)
            }
        }

        // Trigger debounced save if auto-save is enabled
        if (Config.AUTO_SAVE) {
            this.debouncedSave()
        }

        return newNode
    }

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

    moveNode(nodeId, newParentId, newIndex) {
        const node = this.nodes.get(nodeId)
        if (!node) return

        const oldParentId = node.parent
        const oldParent = this.nodes.get(oldParentId)

        if (oldParent && oldParent.children) {
            const oldIndex = oldParent.children.indexOf(nodeId)
            if (oldIndex !== -1) {
                oldParent.children.splice(oldIndex, 1)
                this.updateChildIndices(oldParent)
            }
        }

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

            node.parent = newParentId
            node.index = newIndex

            this.updateChildIndices(newParent)
        }

        // Trigger debounced save if auto-save is enabled
        if (Config.AUTO_SAVE) {
            this.debouncedSave()
        }
    }

    // Using TreeNodeOperations for non-recursive deletion
    deleteNode(nodeId) {
        const deletedIds = TreeNodeOperations.deleteNodeTree(this.nodes, nodeId)

        // Trigger debounced save if auto-save is enabled
        if (Config.AUTO_SAVE && deletedIds.length > 0) {
            this.debouncedSave()
        }

        return deletedIds
    }

    updateNode(nodeId, properties) {
        const node = this.nodes.get(nodeId)
        if (!node) return

        Object.assign(node, properties)

        // Trigger debounced save if auto-save is enabled
        if (Config.AUTO_SAVE) {
            this.debouncedSave()
        }
    }

    updateNodeDescription(nodeId, description) {
        const node = this.nodes.get(nodeId)
        if (!node) return

        node.description = description

        // Trigger debounced save if auto-save is enabled
        if (Config.AUTO_SAVE) {
            this.debouncedSave()
        }
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId)
    }

    getAllNodes() {
        return Array.from(this.nodes.values())
    }

    getRootNode() {
        return this.nodes.get(this.rootId)
    }

    // Using AsyncOperations to generate Turtle in chunks to avoid UI blocking
    async toTurtle() {
        // Defer to next tick to avoid blocking UI
        return AsyncOperations.deferOperation(() => {
            let turtle = `@prefix dc: <${Config.PREFIXES.dc}> .\n`
            turtle += `@prefix ts: <${Config.PREFIXES.ts}> .\n\n`

            const rootNode = this.nodes.get(this.rootId)
            if (rootNode) {
                turtle += `<${this.baseUri}${rootNode.id}> a ts:RootNode .\n`
            }

            // Process nodes in chunks
            const nodeIds = Array.from(this.nodes.keys()).filter(id => id !== this.rootId)
            const chunkSize = 100

            for (let i = 0; i < nodeIds.length; i += chunkSize) {
                const chunk = nodeIds.slice(i, i + chunkSize)

                for (const id of chunk) {
                    const node = this.nodes.get(id)
                    if (node && node.type === 'Node') {
                        turtle += `<${this.baseUri}${node.id}> a ts:Node;\n`

                        if (node.title) {
                            turtle += `   dc:title "${this.escapeTurtle(node.title)}" ;\n`
                        }

                        if (node.created) {
                            turtle += `   dc:created "${node.created}" ;\n`
                        }

                        turtle += `   ts:index "${node.index}" ;\n`

                        if (node.parent) {
                            turtle += `   ts:parent <${this.baseUri}${node.parent}> .\n`
                        } else {
                            turtle += `   ts:parent <${this.baseUri}${this.rootId}> .\n`
                        }

                        if (node.description) {
                            turtle += `<${this.baseUri}${node.id}> dc:description """${this.escapeTurtle(node.description)}""" .\n`
                        }
                    }
                }
            }

            return turtle
        })
    }

    escapeTurtle(text) {
        if (!text) return ''
        return text
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
    }

    async saveData() {
        try {
            // Show saving indicator or notify user that save is in progress
            this.eventBus.publish('model:saving', { message: 'Saving data...' })

            // Generate Turtle asynchronously to avoid UI blocking
            const turtle = await this.toTurtle()

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

            // Notify success
            this.eventBus.publish('model:saved', { message: 'Data saved successfully' })
            return true
        } catch (error) {
            console.error('Error saving data:', error)
            this.eventBus.publish('model:error', { message: 'Failed to save data', error })
            return false
        }
    }

    handleNodeUpdate(data) {
        const { nodeId, properties } = data
        this.updateNode(nodeId, properties)
    }

    handleNodeMove(data) {
        const { nodeId, newParentId, newIndex } = data
        this.moveNode(nodeId, newParentId, newIndex)
    }

    handleNodeDelete(data) {
        const { nodeId } = data
        this.deleteNode(nodeId)
    }
}