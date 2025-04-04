/**
 * TrellisView - Responsible for rendering the UI and handling DOM interactions
 */
import { marked } from 'marked';

export class TrellisView {
    /**
     * @param {HTMLElement} rootElement - The root DOM element for the trellis
     * @param {EventBus} eventBus - Event bus for component communication
     */
    constructor(rootElement, eventBus) {
        this.rootElement = rootElement;
        this.eventBus = eventBus;
        this.template = document.getElementById('entry-template');
        this.nodeElements = new Map();
        this.selectedNodeId = null;
        this.draggedNodeId = null;
        this.dragTarget = null;
        
        // Register event handlers
        this.eventBus.subscribe('model:loaded', this.renderTree.bind(this));
        this.eventBus.subscribe('model:created', this.renderTree.bind(this));
        this.eventBus.subscribe('node:added', this.handleNodeAdded.bind(this));
        this.eventBus.subscribe('node:updated', this.handleNodeUpdated.bind(this));
        this.eventBus.subscribe('node:deleted', this.handleNodeDeleted.bind(this));
    }
    
    /**
     * Renders the entire tree structure
     * @param {Object} data - The loaded model data
     */
    renderTree(data) {
        // Clear existing content
        this.rootElement.innerHTML = '';
        this.nodeElements.clear();
        
        const rootNode = data.nodes.find(node => node.type === 'RootNode');
        if (!rootNode) {
            console.error('No root node found');
            return;
        }
        
        // Build tree structure
        const tree = this.buildTreeStructure(data.nodes, rootNode.id);
        
        // Render the tree
        const rootUl = document.createElement('ul');
        rootUl.className = 'ts-root';
        this.rootElement.appendChild(rootUl);
        
        // Render each child of the root
        for (const childId of tree.children || []) {
            this.renderNode(childId, rootUl, tree.nodes);
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize drag and drop
        this.initDragAndDrop();
    }
    
    /**
     * Builds a hierarchical tree structure from flat nodes list
     * @param {Array} nodes - List of nodes from the model
     * @param {string} rootId - ID of the root node
     * @returns {Object} - Tree structure with nodes and hierarchy
     */
    buildTreeStructure(nodes, rootId) {
        const nodesMap = new Map();
        
        // First pass: create a map of all nodes
        for (const node of nodes) {
            nodesMap.set(node.id, { ...node });
        }
        
        // Second pass: build parent-child relationships
        for (const node of nodesMap.values()) {
            if (node.children) {
                // Ensure children exist in the map
                node.children = node.children.filter(childId => nodesMap.has(childId));
            } else {
                node.children = [];
            }
        }
        
        return {
            rootId,
            nodes: nodesMap
        };
    }
    
    /**
     * Renders a single node and its children
     * @param {string} nodeId - ID of the node to render
     * @param {HTMLElement} parentElement - Parent DOM element
     * @param {Map} nodesMap - Map of all nodes
     * @returns {HTMLElement} - The created node element
     */
    renderNode(nodeId, parentElement, nodesMap) {
        const node = nodesMap.get(nodeId);
        if (!node) return null;
        
        // Create list item
        const li = document.createElement('li');
        li.dataset.nodeId = nodeId;
        
        // Create dropzone
        const dropzone = document.createElement('div');
        dropzone.className = 'dropzone';
        li.appendChild(dropzone);
        
        // Clone entry template
        const entry = this.template.content.cloneNode(true).querySelector('.ts-entry');
        entry.id = nodeId;
        
        // Set node title
        const titleElement = entry.querySelector('.ts-title');
        titleElement.textContent = node.title || '';
        
        // Set created date (hidden)
        const dateElement = entry.querySelector('.date');
        dateElement.textContent = node.created || '';
        
        // Append entry to list item
        li.appendChild(entry);
        
        // Add to nodeElements map
        this.nodeElements.set(nodeId, li);
        
        // Render children if any
        if (node.children && node.children.length > 0) {
            const ul = document.createElement('ul');
            li.appendChild(ul);
            li.classList.add('ts-open');
            
            for (const childId of node.children) {
                this.renderNode(childId, ul, nodesMap);
            }
        } else {
            li.classList.add('ts-closed');
        }
        
        // Append to parent
        parentElement.appendChild(li);
        
        return li;
    }
    
    /**
     * Setup event listeners for trellis interactions
     */
    setupEventListeners() {
        // Delegate events from the root element
        this.rootElement.addEventListener('click', this.handleClick.bind(this));
        this.rootElement.addEventListener('dblclick', this.handleDblClick.bind(this));
        this.rootElement.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Listen for focus/blur on contenteditable elements
        this.rootElement.addEventListener('focus', this.handleFocus.bind(this), true);
        this.rootElement.addEventListener('blur', this.handleBlur.bind(this), true);
    }
    
    /**
     * Handle click events within the trellis
     * @param {Event} event - The click event
     */
    handleClick(event) {
        const target = event.target;
        
        // Handle expander clicks
        if (target.classList.contains('ts-expander')) {
            const li = target.closest('li');
            li.classList.toggle('ts-closed');
            li.classList.toggle('ts-open');
            event.stopPropagation();
            return;
        }
        
        // Handle action button clicks
        if (target.classList.contains('ts-card')) {
            this.showCard(target.closest('.ts-entry').id);
            event.stopPropagation();
            return;
        }
        
        if (target.classList.contains('ts-addChild')) {
            const entryId = target.closest('.ts-entry').id;
            this.eventBus.publish('view:addChild', { parentId: entryId });
            event.stopPropagation();
            return;
        }
        
        if (target.classList.contains('ts-delete')) {
            const entryId = target.closest('.ts-entry').id;
            if (confirm('Are you sure you want to delete this item and all its children?')) {
                this.eventBus.publish('view:deleteNode', { nodeId: entryId });
            }
            event.stopPropagation();
            return;
        }
        
        // Handle entry selection
        if (target.classList.contains('ts-entry') || target.classList.contains('ts-title')) {
            const entry = target.classList.contains('ts-entry') ? target : target.closest('.ts-entry');
            this.selectNode(entry.id);
            event.stopPropagation();
            return;
        }
    }
    
    /**
     * Handle double-click events for editing
     * @param {Event} event - The double-click event
     */
    handleDblClick(event) {
        const target = event.target;
        
        // Make title editable on double-click
        if (target.classList.contains('ts-title')) {
            target.contentEditable = true;
            target.focus();
            
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(target);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            event.stopPropagation();
        }
    }
    
    /**
     * Handle keyboard events for navigation and editing
     * @param {KeyboardEvent} event - The keydown event
     */
    handleKeyDown(event) {
        // Only handle events on editable elements
        if (!event.target.isContentEditable) return;
        
        const entry = event.target.closest('.ts-entry');
        if (!entry) return;
        
        switch (event.key) {
            case 'Enter':
                if (!event.shiftKey) {
                    // Prevent default to avoid adding a new line
                    event.preventDefault();
                    
                    // Finish editing
                    event.target.contentEditable = false;
                    
                    // Save the changes
                    const nodeId = entry.id;
                    const newTitle = event.target.textContent.trim();
                    this.eventBus.publish('view:updateNode', { nodeId, properties: { title: newTitle } });
                    
                    // Insert new node after current
                    this.eventBus.publish('view:addSibling', { nodeId });
                }
                break;
                
            case 'Tab':
                event.preventDefault();
                if (event.shiftKey) {
                    // Outdent
                    this.eventBus.publish('view:outdentNode', { nodeId: entry.id });
                } else {
                    // Indent
                    this.eventBus.publish('view:indentNode', { nodeId: entry.id });
                }
                break;
                
            case 'Escape':
                // Cancel editing
                event.preventDefault();
                
                // Restore original content (could be enhanced with a stored original value)
                event.target.contentEditable = false;
                this.selectNode(entry.id);
                break;
                
            case 'ArrowUp':
                // Navigate up
                event.preventDefault();
                this.navigateUp(entry.id);
                break;
                
            case 'ArrowDown':
                // Navigate down
                event.preventDefault();
                this.navigateDown(entry.id);
                break;
        }
    }
    
    /**
     * Handle focus events on editable elements
     * @param {FocusEvent} event - The focus event
     */
    handleFocus(event) {
        if (event.target.classList.contains('ts-title')) {
            const entry = event.target.closest('.ts-entry');
            this.selectNode(entry.id);
        }
    }
    
    /**
     * Handle blur events on editable elements
     * @param {FocusEvent} event - The blur event
     */
    handleBlur(event) {
        if (event.target.classList.contains('ts-title') && event.target.isContentEditable) {
            // Save changes when focus is lost
            event.target.contentEditable = false;
            
            const entry = event.target.closest('.ts-entry');
            const nodeId = entry.id;
            const newTitle = event.target.textContent.trim();
            
            this.eventBus.publish('view:updateNode', { nodeId, properties: { title: newTitle } });
        }
    }
    
    /**
     * Set up drag and drop functionality
     */
    initDragAndDrop() {
        // Add drag start event to handles
        const handles = this.rootElement.querySelectorAll('.ts-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', this.handleDragStart.bind(this));
            handle.setAttribute('draggable', 'true');
            handle.addEventListener('dragstart', this.handleDragStart.bind(this));
        });
        
        // Add drop targets
        const dropzones = this.rootElement.querySelectorAll('.dropzone');
        dropzones.forEach(dropzone => {
            dropzone.addEventListener('dragover', this.handleDragOver.bind(this));
            dropzone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            dropzone.addEventListener('drop', this.handleDrop.bind(this));
        });
        
        // Add dragenter to li elements to handle nesting
        const items = this.rootElement.querySelectorAll('li');
        items.forEach(item => {
            item.addEventListener('dragenter', this.handleDragEnter.bind(this));
        });
    }
    
    /**
     * Handle the start of drag operations
     * @param {DragEvent} event - The dragstart event
     */
    handleDragStart(event) {
        const entry = event.target.closest('.ts-entry');
        if (!entry) return;
        
        // Set dragged node
        this.draggedNodeId = entry.id;
        
        // Set drag image and data
        if (event.dataTransfer) {
            event.dataTransfer.setData('text/plain', entry.id);
            event.dataTransfer.effectAllowed = 'move';
            
            // Create drag image
            const dragImage = entry.cloneNode(true);
            dragImage.style.width = `${entry.offsetWidth}px`;
            dragImage.style.opacity = '0.7';
            document.body.appendChild(dragImage);
            event.dataTransfer.setDragImage(dragImage, 10, 10);
            
            // Clean up the clone after drag starts
            setTimeout(() => {
                document.body.removeChild(dragImage);
            }, 0);
        }
        
        // Add dragging class
        entry.classList.add('ts-dragging');
        
        // Select the node
        this.selectNode(entry.id);
    }
    
    /**
     * Handle dragover events for drop targets
     * @param {DragEvent} event - The dragover event
     */
    handleDragOver(event) {
        // Prevent default to allow drop
        event.preventDefault();
        
        if (!this.draggedNodeId) return;
        
        // Add active class to dropzone
        event.target.classList.add('active');
        
        // Set drop effect
        event.dataTransfer.dropEffect = 'move';
    }
    
    /**
     * Handle dragleave events for drop targets
     * @param {DragEvent} event - The dragleave event
     */
    handleDragLeave(event) {
        // Remove active class
        event.target.classList.remove('active');
    }
    
    /**
     * Handle dragenter events for potential parent elements
     * @param {DragEvent} event - The dragenter event
     */
    handleDragEnter(event) {
        const li = event.target.closest('li');
        if (!li || !this.draggedNodeId) return;
        
        // Store potential drop target for nesting
        this.dragTarget = li;
        
        // Highlight the potential parent
        li.classList.add('ts-highlight');
        
        // Cancel any existing timers
        if (this.dragEnterTimer) {
            clearTimeout(this.dragEnterTimer);
        }
        
        // Set a delay to open the node if hovered
        this.dragEnterTimer = setTimeout(() => {
            if (li.classList.contains('ts-closed')) {
                li.classList.remove('ts-closed');
                li.classList.add('ts-open');
            }
        }, 700); // 700ms delay to open
    }
    
    /**
     * Handle drop events
     * @param {DragEvent} event - The drop event
     */
    handleDrop(event) {
        // Prevent default action
        event.preventDefault();
        
        // Get dropzone and its parent li
        const dropzone = event.target;
        dropzone.classList.remove('active');
        
        if (!this.draggedNodeId) return;
        
        const draggedLi = this.nodeElements.get(this.draggedNodeId);
        if (!draggedLi) return;
        
        // Get target li (the one containing the dropzone)
        const targetLi = dropzone.closest('li');
        if (!targetLi) return;
        
        // Prevent dropping onto a child of the dragged element
        if (draggedLi.contains(targetLi)) {
            console.warn('Cannot drop onto a child element');
            return;
        }
        
        // Get parent ul
        const parentUl = targetLi.parentElement;
        
        // Determine insert position and parent
        const isDropAfter = dropzone === targetLi.querySelector('.dropzone');
        
        let newParentId;
        let newIndex;
        
        if (isDropAfter) {
            // Dropping between items: same parent as target, just before target
            newParentId = targetLi.parentElement.closest('li')?.dataset.nodeId || 'trellis-root';
            
            // Find all children of the parent and get the index
            const siblings = Array.from(parentUl.children);
            newIndex = siblings.indexOf(targetLi);
        } else {
            // Dropping onto an item: becomes a child of target
            newParentId = targetLi.dataset.nodeId;
            
            // Get the target's child list or create one
            let childUl = targetLi.querySelector('ul');
            if (!childUl) {
                childUl = document.createElement('ul');
                targetLi.appendChild(childUl);
                targetLi.classList.remove('ts-closed');
                targetLi.classList.add('ts-open');
            }
            
            // Add to end of children
            newIndex = childUl.children.length;
        }
        
        // Publish move event
        this.eventBus.publish('view:moveNode', {
            nodeId: this.draggedNodeId,
            newParentId: newParentId,
            newIndex: newIndex
        });
        
        // Clean up
        this.draggedNodeId = null;
        draggedLi.classList.remove('ts-dragging');
        
        // Remove all highlights
        document.querySelectorAll('.ts-highlight').forEach(el => {
            el.classList.remove('ts-highlight');
        });
    }
    
    /**
     * Select a node and update UI
     * @param {string} nodeId - ID of node to select
     */
    selectNode(nodeId) {
        // Deselect previous node
        if (this.selectedNodeId) {
            const prevSelected = document.getElementById(this.selectedNodeId);
            if (prevSelected) {
                prevSelected.classList.remove('ts-selected');
                
                // Make title not editable
                const prevTitle = prevSelected.querySelector('.ts-title');
                if (prevTitle) {
                    prevTitle.contentEditable = false;
                }
            }
        }
        
        // Select new node
        this.selectedNodeId = nodeId;
        const entry = document.getElementById(nodeId);
        if (entry) {
            entry.classList.add('ts-selected');
        }
    }
    
    /**
     * Navigate to the previous node (up)
     * @param {string} currentNodeId - ID of current node
     */
    navigateUp(currentNodeId) {
        const currentLi = this.nodeElements.get(currentNodeId);
        if (!currentLi) return;
        
        // Try to find previous sibling
        let prevLi = currentLi.previousElementSibling;
        
        if (prevLi) {
            // If previous has children and is open, navigate to last child recursively
            while (prevLi.classList.contains('ts-open') && prevLi.querySelector('ul')?.lastElementChild) {
                prevLi = prevLi.querySelector('ul').lastElementChild;
            }
            
            // Select the previous item
            const prevId = prevLi.querySelector('.ts-entry').id;
            this.selectNode(prevId);
        } else {
            // No previous sibling, go to parent
            const parentLi = currentLi.parentElement.closest('li');
            if (parentLi) {
                const parentId = parentLi.querySelector('.ts-entry').id;
                this.selectNode(parentId);
            }
        }
    }
    
    /**
     * Navigate to the next node (down)
     * @param {string} currentNodeId - ID of current node
     */
    navigateDown(currentNodeId) {
        const currentLi = this.nodeElements.get(currentNodeId);
        if (!currentLi) return;
        
        // If current node has children and is open, go to first child
        if (currentLi.classList.contains('ts-open')) {
            const firstChild = currentLi.querySelector('ul > li');
            if (firstChild) {
                const childId = firstChild.querySelector('.ts-entry').id;
                this.selectNode(childId);
                return;
            }
        }
        
        // Try to find next sibling
        let nextLi = currentLi.nextElementSibling;
        if (nextLi) {
            const nextId = nextLi.querySelector('.ts-entry').id;
            this.selectNode(nextId);
            return;
        }
        
        // No next sibling, go up and find next of parent
        let parent = currentLi.parentElement.closest('li');
        while (parent) {
            const parentNext = parent.nextElementSibling;
            if (parentNext) {
                const nextId = parentNext.querySelector('.ts-entry').id;
                this.selectNode(nextId);
                return;
            }
            parent = parent.parentElement.closest('li');
        }
    }
    
    /**
     * Show the card view for a node
     * @param {string} nodeId - ID of the node
     */
    showCard(nodeId) {
        // Get the node entry
        const entry = document.getElementById(nodeId);
        if (!entry) return;
        
        // Get node data
        const title = entry.querySelector('.ts-title').textContent;
        const date = entry.querySelector('.date').textContent;
        
        // Get description from model via event
        this.eventBus.publish('view:getNodeData', { 
            nodeId, 
            callback: (node) => {
                const card = document.getElementById('card');
                const cardTitle = document.getElementById('card-title');
                const cardNid = document.getElementById('card-nid');
                const cardDate = document.getElementById('card-date');
                const cardDescription = document.getElementById('card-description');
                
                // Set card data
                cardTitle.textContent = title;
                cardNid.textContent = nodeId;
                cardDate.textContent = date;
                
                // Set description (markdown)
                cardDescription.value = node.description || '';
                
                // Store node ID with the card
                card.dataset.nodeId = nodeId;
                
                // Show the card
                card.classList.remove('hidden');
                
                // Focus the description for editing
                cardDescription.focus();
            }
        });
    }
    
    /**
     * Handle node added event
     * @param {Object} data - Event data with node information
     */
    handleNodeAdded(data) {
        const { node, parentId } = data;
        
        // Find parent element
        let parentElement;
        if (parentId === 'trellis-root') {
            parentElement = this.rootElement.querySelector('ul');
        } else {
            const parentLi = this.nodeElements.get(parentId);
            if (!parentLi) {
                console.error('Parent not found:', parentId);
                return;
            }
            
            // Check if parent has a child list
            let ul = parentLi.querySelector('ul');
            if (!ul) {
                ul = document.createElement('ul');
                parentLi.appendChild(ul);
                parentLi.classList.remove('ts-closed');
                parentLi.classList.add('ts-open');
            }
            
            parentElement = ul;
        }
        
        // Create nodes map for rendering
        const nodesMap = new Map();
        nodesMap.set(node.id, node);
        
        // Render the new node
        const newNodeElement = this.renderNode(node.id, parentElement, nodesMap);
        
        // Select and focus the new node
        if (newNodeElement) {
            const titleElement = newNodeElement.querySelector('.ts-title');
            this.selectNode(node.id);
            
            // Make the title editable and focus it
            titleElement.contentEditable = true;
            titleElement.focus();
            
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(titleElement);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        // Set up event listeners for the new node
        this.initDragAndDrop();
    }
    
    /**
     * Handle node updated event
     * @param {Object} data - Event data with updated node information
     */
    handleNodeUpdated(data) {
        const { nodeId, properties } = data;
        
        // Find the node element
        const nodeEntry = document.getElementById(nodeId);
        if (!nodeEntry) return;
        
        // Update title if changed
        if (properties.title !== undefined) {
            const titleElement = nodeEntry.querySelector('.ts-title');
            titleElement.textContent = properties.title;
        }
        
        // Update other properties as needed
    }
    
    /**
     * Handle node deleted event
     * @param {Object} data - Event data with deleted node ID
     */
    handleNodeDeleted(data) {
        const { nodeId } = data;
        
        // Find and remove the node element
        const nodeLi = this.nodeElements.get(nodeId);
        if (nodeLi) {
            nodeLi.remove();
            this.nodeElements.delete(nodeId);
        }
    }
}
