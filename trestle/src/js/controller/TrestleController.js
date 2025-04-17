// src/js/controller/TrestleController.js
import { AsyncOperations } from '../utils/AsyncOperations.js'

export class TrestleController {
    constructor(model, view, eventBus) {
        this.model = model
        this.view = view
        this.eventBus = eventBus

        // Performance tracking counters
        this.operations = {
            nodeAdded: 0,
            nodeUpdated: 0,
            nodeDeleted: 0,
            nodeMoved: 0
        }

        this.setupEventHandlers()
    }

    initialize() {
        // Use AsyncOperations to defer initialization to avoid blocking UI
        return AsyncOperations.deferOperation(() => {
            return this.model.initialize()
        })
    }

    setupEventHandlers() {
        // Use handler references to allow potential cleanup later
        this.handlers = {
            addChild: this.handleAddChild.bind(this),
            addSibling: this.handleAddSibling.bind(this),
            updateNode: this.handleUpdateNode.bind(this),
            deleteNode: this.handleDeleteNode.bind(this),
            moveNode: this.handleMoveNode.bind(this),
            indentNode: this.handleIndentNode.bind(this),
            outdentNode: this.handleOutdentNode.bind(this),
            getNodeData: this.handleGetNodeData.bind(this)
        }

        // Subscribe to events
        this.eventBus.subscribe('view:addChild', this.handlers.addChild)
        this.eventBus.subscribe('view:addSibling', this.handlers.addSibling)
        this.eventBus.subscribe('view:updateNode', this.handlers.updateNode)
        this.eventBus.subscribe('view:deleteNode', this.handlers.deleteNode)
        this.eventBus.subscribe('view:moveNode', this.handlers.moveNode)
        this.eventBus.subscribe('view:indentNode', this.handlers.indentNode)
        this.eventBus.subscribe('view:outdentNode', this.handlers.outdentNode)
        this.eventBus.subscribe('view:getNodeData', this.handlers.getNodeData)
    }

    // Cleanup event handlers to prevent memory leaks
    cleanup() {
        // Unsubscribe from all events
        Object.keys(this.handlers).forEach(eventName => {
            this.eventBus.unsubscribe(`view:${eventName}`, this.handlers[eventName])
        })
    }

    async saveData() {
        // Track operation performance
        performance.mark('save-start')

        try {
            // Show saving indicator to user
            this.eventBus.publish('model:saving', { message: 'Saving data...' })

            // Save data with a timeout to prevent hanging
            const savePromise = this.model.saveData()
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Save operation timed out after 30 seconds')), 30000)
            })

            const success = await Promise.race([savePromise, timeoutPromise])

            if (success) {
                this.eventBus.publish('model:saved', { message: 'Data saved successfully' })
            } else {
                this.eventBus.publish('model:error', { message: 'Failed to save data' })
            }

            return success
        } catch (error) {
            console.error('Error during save operation:', error)
            this.eventBus.publish('model:error', {
                message: 'Error saving data',
                error: error.message || 'Unknown error'
            })
            return false
        } finally {
            performance.mark('save-end')
            performance.measure('Save operation', 'save-start', 'save-end')
        }
    }

    addRootItem() {
        performance.mark('add-root-start')

        const rootNode = this.model.getRootNode()
        if (!rootNode) return

        // Add node to model
        const node = this.model.addNode(rootNode.id, '', rootNode.children.length)

        // Notify view
        this.eventBus.publish('node:added', {
            node,
            parentId: 'trestle-root'
        })

        this.operations.nodeAdded++

        performance.mark('add-root-end')
        performance.measure('Add root item', 'add-root-start', 'add-root-end')
    }

    updateNodeDescription(nodeId, description) {
        // Use AsyncOperations to defer this operation
        AsyncOperations.deferOperation(() => {
            this.model.updateNodeDescription(nodeId, description)
        })
    }

    handleAddChild(data) {
        performance.mark('add-child-start')

        const { parentId } = data
        const parent = this.model.getNode(parentId)
        if (!parent) return

        const childIndex = parent.children ? parent.children.length : 0
        const node = this.model.addNode(parentId, '', childIndex)

        this.eventBus.publish('node:added', {
            node,
            parentId
        })

        this.operations.nodeAdded++

        performance.mark('add-child-end')
        performance.measure('Add child node', 'add-child-start', 'add-child-end')
    }

    handleAddSibling(data) {
        performance.mark('add-sibling-start')

        const { nodeId } = data
        const node = this.model.getNode(nodeId)
        if (!node) return

        const parentId = node.parent
        const parent = this.model.getNode(parentId)
        if (!parent) return

        const siblingIndex = parent.children.indexOf(nodeId)
        if (siblingIndex === -1) return

        const newNode = this.model.addNode(parentId, '', siblingIndex + 1)

        this.eventBus.publish('node:added', {
            node: newNode,
            parentId
        })

        this.operations.nodeAdded++

        performance.mark('add-sibling-end')
        performance.measure('Add sibling node', 'add-sibling-start', 'add-sibling-end')
    }

    handleUpdateNode(data) {
        // Use debouncing for text updates to avoid excessive operations
        if (!this.debouncedUpdateNode) {
            this.debouncedUpdateNode = AsyncOperations.debounce((nodeId, properties) => {
                performance.mark('update-node-start')

                this.model.updateNode(nodeId, properties)

                this.eventBus.publish('node:updated', {
                    nodeId,
                    properties
                })

                this.operations.nodeUpdated++

                performance.mark('update-node-end')
                performance.measure('Update node', 'update-node-start', 'update-node-end')
            }, 300) // 300ms debounce for smoother typing
        }

        const { nodeId, properties } = data
        this.debouncedUpdateNode(nodeId, properties)
    }

    handleDeleteNode(data) {
        performance.mark('delete-node-start')

        const { nodeId } = data

        // Use AsyncOperations to avoid UI blocking during delete
        AsyncOperations.deferOperation(() => {
            const deletedIds = this.model.deleteNode(nodeId)

            // Notify view of deletion
            this.eventBus.publish('node:deleted', {
                nodeId,
                deletedIds
            })

            this.operations.nodeDeleted++
        })

        performance.mark('delete-node-end')
        performance.measure('Delete node', 'delete-node-start', 'delete-node-end')
    }

    handleMoveNode(data) {
        performance.mark('move-node-start')

        const { nodeId, newParentId, newIndex } = data

        // Use AsyncOperations to defer complex tree operations
        AsyncOperations.deferOperation(() => {
            this.model.moveNode(nodeId, newParentId, newIndex)
            this.operations.nodeMoved++
        })

        performance.mark('move-node-end')
        performance.measure('Move node', 'move-node-start', 'move-node-end')
    }

    handleIndentNode(data) {
        performance.mark('indent-node-start')

        const { nodeId } = data
        const node = this.model.getNode(nodeId)
        if (!node || !node.parent) return

        const parent = this.model.getNode(node.parent)
        if (!parent || !parent.children) return

        const index = parent.children.indexOf(nodeId)
        if (index <= 0) return

        const newParentId = parent.children[index - 1]
        const newParent = this.model.getNode(newParentId)
        if (!newParent) return

        // Use AsyncOperations to defer tree structure changes
        AsyncOperations.deferOperation(() => {
            this.model.moveNode(nodeId, newParentId, newParent.children ? newParent.children.length : 0)

            this.eventBus.publish('view:nodeIndented', {
                nodeId,
                newParentId
            })

            this.operations.nodeMoved++
        })

        performance.mark('indent-node-end')
        performance.measure('Indent node', 'indent-node-start', 'indent-node-end')
    }

    handleOutdentNode(data) {
        performance.mark('outdent-node-start')

        const { nodeId } = data
        const node = this.model.getNode(nodeId)
        if (!node || !node.parent) return

        const parent = this.model.getNode(node.parent)
        if (!parent || !parent.parent) return

        const grandparentId = parent.parent
        const grandparent = this.model.getNode(grandparentId)
        if (!grandparent) return

        const parentIndex = grandparent.children.indexOf(parent.id)
        if (parentIndex === -1) return

        // Use AsyncOperations to defer complex tree operations
        AsyncOperations.deferOperation(() => {
            this.model.moveNode(nodeId, grandparentId, parentIndex + 1)

            this.eventBus.publish('view:nodeOutdented', {
                nodeId,
                newParentId: grandparentId
            })

            this.operations.nodeMoved++
        })

        performance.mark('outdent-node-end')
        performance.measure('Outdent node', 'outdent-node-start', 'outdent-node-end')
    }

    handleGetNodeData(data) {
        const { nodeId, callback } = data

        // This operation should be immediate as it's part of a user interaction
        const node = this.model.getNode(nodeId)
        if (node && callback) {
            callback(node)
        }
    }

    // Get performance statistics
    getStats() {
        return {
            operations: { ...this.operations },
            model: {
                nodes: this.model.nodes.size,
                datasetSize: this.model.rdfDataset ? this.model.rdfDataset.size : 0
            }
        }
    }
}