/**
 * TrellisController - Mediates between model and view
 */
export class TrellisController {
    /**
     * @param {TrellisModel} model - Data model
     * @param {TrellisView} view - UI view
     * @param {EventBus} eventBus - Event bus for component communication
     */
    constructor(model, view, eventBus) {
        this.model = model;
        this.view = view;
        this.eventBus = eventBus;

        // Register event handlers
        this.setupEventHandlers();
    }

    /**
     * Initialize the controller and application
     */
    initialize() {
        this.model.initialize();
    }

    /**
     * Set up event handlers for view events
     */
    setupEventHandlers() {
        // View events
        this.eventBus.subscribe('view:addChild', this.handleAddChild.bind(this));
        this.eventBus.subscribe('view:addSibling', this.handleAddSibling.bind(this));
        this.eventBus.subscribe('view:updateNode', this.handleUpdateNode.bind(this));
        this.eventBus.subscribe('view:deleteNode', this.handleDeleteNode.bind(this));
        this.eventBus.subscribe('view:moveNode', this.handleMoveNode.bind(this));
        this.eventBus.subscribe('view:indentNode', this.handleIndentNode.bind(this));
        this.eventBus.subscribe('view:outdentNode', this.handleOutdentNode.bind(this));
        this.eventBus.subscribe('view:getNodeData', this.handleGetNodeData.bind(this));
    }

    /**
     * Save data to SPARQL endpoint
     */
    async saveData() {
        const success = await this.model.saveData();
        if (success) {
            alert('Data saved successfully');
        } else {
            alert('Failed to save data');
        }
    }

    /**
     * Add a new root-level item
     */
    addRootItem() {
        const rootNode = this.model.getRootNode();
        if (!rootNode) return;

        const node = this.model.addNode(rootNode.id, 'New Item', rootNode.children.length);

        this.eventBus.publish('node:added', {
            node,
            parentId: 'trellis-root'
        });
    }

    /**
     * Update a node's description
     * @param {string} nodeId - Node ID
     * @param {string} description - New description (markdown text)
     */
    updateNodeDescription(nodeId, description) {
        this.model.updateNodeDescription(nodeId, description);
    }

    // Event handlers

    /**
     * Handle request to add a child node
     * @param {Object} data - Event data
     */
    handleAddChild(data) {
        const { parentId } = data;
        const parent = this.model.getNode(parentId);
        if (!parent) return;

        const childIndex = parent.children ? parent.children.length : 0;
        const node = this.model.addNode(parentId, 'New Item', childIndex);

        this.eventBus.publish('node:added', {
            node,
            parentId
        });
    }

    /**
     * Handle request to add a sibling node
     * @param {Object} data - Event data
     */
    handleAddSibling(data) {
        const { nodeId } = data;
        const node = this.model.getNode(nodeId);
        if (!node) return;

        // Get parent
        const parentId = node.parent;
        const parent = this.model.getNode(parentId);
        if (!parent) return;

        // Find current index
        const siblingIndex = parent.children.indexOf(nodeId);
        if (siblingIndex === -1) return;

        // Add new node after the current one
        const newNode = this.model.addNode(parentId, 'New Item', siblingIndex + 1);

        this.eventBus.publish('node:added', {
            node: newNode,
            parentId
        });
    }

    /**
     * Handle request to update a node
     * @param {Object} data - Event data
     */
    handleUpdateNode(data) {
        const { nodeId, properties } = data;

        this.model.updateNode(nodeId, properties);

        this.eventBus.publish('node:updated', {
            nodeId,
            properties
        });
    }

    /**
     * Handle request to delete a node
     * @param {Object} data - Event data
     */
    handleDeleteNode(data) {
        const { nodeId } = data;

        this.model.deleteNode(nodeId);

        this.eventBus.publish('node:deleted', {
            nodeId
        });
    }

    /**
     * Handle request to move a node
     * @param {Object} data - Event data
     */
    handleMoveNode(data) {
        const { nodeId, newParentId, newIndex } = data;

        this.model.moveNode(nodeId, newParentId, newIndex);

        // The view already updated itself based on the drag and drop action
    }

    /**
     * Handle request to indent a node
     * @param {Object} data - Event data
     */
    handleIndentNode(data) {
        const { nodeId } = data;
        const node = this.model.getNode(nodeId);
        if (!node || !node.parent) return;

        const parent = this.model.getNode(node.parent);
        if (!parent || !parent.children) return;

        // Find current index in parent
        const index = parent.children.indexOf(nodeId);
        if (index <= 0) return; // Can't indent first child

        // Previous sibling becomes new parent
        const newParentId = parent.children[index - 1];
        const newParent = this.model.getNode(newParentId);
        if (!newParent) return;

        // Move the node to the new parent
        this.model.moveNode(nodeId, newParentId, newParent.children ? newParent.children.length : 0);

        // Notify view to update
        this.eventBus.publish('view:nodeIndented', {
            nodeId,
            newParentId
        });
    }

    /**
     * Handle request to outdent a node
     * @param {Object} data - Event data
     */
    handleOutdentNode(data) {
        const { nodeId } = data;
        const node = this.model.getNode(nodeId);
        if (!node || !node.parent) return;

        const parent = this.model.getNode(node.parent);
        if (!parent || !parent.parent) return; // Can't outdent if parent is root

        const grandparentId = parent.parent;
        const grandparent = this.model.getNode(grandparentId);
        if (!grandparent) return;

        // Find parent's index in grandparent
        const parentIndex = grandparent.children.indexOf(parent.id);
        if (parentIndex === -1) return;

        // Move the node after its parent in the grandparent's children
        this.model.moveNode(nodeId, grandparentId, parentIndex + 1);

        // Notify view to update
        this.eventBus.publish('view:nodeOutdented', {
            nodeId,
            newParentId: grandparentId
        });
    }

    /**
     * Handle request to get node data
     * @param {Object} data - Event data with callback
     */
    handleGetNodeData(data) {
        const { nodeId, callback } = data;

        const node = this.model.getNode(nodeId);
        if (node && callback) {
            callback(node);
        }
    }
}