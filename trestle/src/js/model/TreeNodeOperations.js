// src/js/model/TreeNodeOperations.js
/**
 * Utility class for tree node operations that avoids recursion
 * to prevent call stack issues with deep hierarchies
 */
export class TreeNodeOperations {
    /**
     * Gets all descendant IDs of a node using iteration instead of recursion
     * @param {Map<string, Object>} nodesMap - Map of all nodes
     * @param {string} nodeId - ID of the node to get descendants of
     * @returns {Array<string>} - Array of descendant node IDs
     */
    static getAllDescendantIds(nodesMap, nodeId) {
        const descendantIds = []
        const stack = []
        const node = nodesMap.get(nodeId)

        // Return empty array if node doesn't exist or has no children
        if (!node || !node.children || node.children.length === 0) {
            return descendantIds
        }

        // Initialize stack with direct children
        for (const childId of node.children) {
            stack.push(childId)
        }

        // Process stack until empty
        while (stack.length > 0) {
            const currentId = stack.pop()
            descendantIds.push(currentId)

            const currentNode = nodesMap.get(currentId)
            if (currentNode && currentNode.children && currentNode.children.length > 0) {
                for (const childId of currentNode.children) {
                    stack.push(childId)
                }
            }
        }

        return descendantIds
    }

    /**
     * Deletes a node and all its descendants using iteration
     * @param {Map<string, Object>} nodesMap - Map of all nodes
     * @param {string} nodeId - ID of the node to delete
     * @param {Function} removeNodeFn - Function to call for each node being removed
     * @returns {Array<string>} - IDs of all deleted nodes
     */
    static deleteNodeTree(nodesMap, nodeId, removeNodeFn = null) {
        const deletedIds = [nodeId]
        const node = nodesMap.get(nodeId)

        if (!node) return deletedIds

        // Get all descendants first (non-recursive)
        const descendantIds = this.getAllDescendantIds(nodesMap, nodeId)
        deletedIds.push(...descendantIds)

        // Remove all descendants (bottom-up to avoid orphaned references)
        for (let i = descendantIds.length - 1; i >= 0; i--) {
            const currentId = descendantIds[i]
            if (removeNodeFn) {
                removeNodeFn(currentId)
            }
            nodesMap.delete(currentId)
        }

        // Remove the node from its parent's children array
        const parentId = node.parent
        if (parentId) {
            const parent = nodesMap.get(parentId)
            if (parent && parent.children) {
                const index = parent.children.indexOf(nodeId)
                if (index !== -1) {
                    parent.children.splice(index, 1)
                    // Update indices of siblings
                    for (let i = index; i < parent.children.length; i++) {
                        const sibling = nodesMap.get(parent.children[i])
                        if (sibling) {
                            sibling.index = i
                        }
                    }
                }
            }
        }

        // Finally remove the node itself
        if (removeNodeFn) {
            removeNodeFn(nodeId)
        }
        nodesMap.delete(nodeId)

        return deletedIds
    }

    /**
     * Processes a tree in chunks to avoid blocking the UI thread
     * @param {Map<string, Object>} nodesMap - Map of all nodes
     * @param {string} rootId - ID of the root node
     * @param {Function} processNodeFn - Function to process each node
     * @param {number} chunkSize - Number of nodes to process per chunk
     * @returns {Promise<void>} - Resolves when processing is complete
     */
    static async processTreeInChunks(nodesMap, rootId, processNodeFn, chunkSize = 100) {
        // Get all nodes to process (root + all descendants)
        const allIds = [rootId, ...this.getAllDescendantIds(nodesMap, rootId)]

        // Process in chunks
        for (let i = 0; i < allIds.length; i += chunkSize) {
            const chunk = allIds.slice(i, i + chunkSize)

            // Process chunk
            for (const id of chunk) {
                const node = nodesMap.get(id)
                if (node) {
                    processNodeFn(node)
                }
            }

            // Yield to UI thread after each chunk
            // This creates a microtask that allows the browser to update the UI
            await new Promise(resolve => setTimeout(resolve, 0))
        }
    }

    /**
     * Creates a tree structure from a flat list of nodes
     * Uses iteration instead of recursion
     * @param {Array<Object>} nodes - Array of node objects
     * @param {string} rootId - ID of the root node
     * @returns {Object} - Tree structure
     */
    static buildTreeStructure(nodes, rootId) {
        const nodesMap = new Map()

        // First pass - create map of nodes
        for (const node of nodes) {
            nodesMap.set(node.id, { ...node, children: [] })
        }

        // Second pass - build tree structure
        for (const node of nodesMap.values()) {
            if (node.parent && node.id !== rootId) {
                const parent = nodesMap.get(node.parent)
                if (parent) {
                    if (!parent.children) {
                        parent.children = []
                    }
                    parent.children.push(node.id)
                }
            }
        }

        // Third pass - sort children by index
        for (const node of nodesMap.values()) {
            if (node.children && node.children.length > 0) {
                node.children.sort((a, b) => {
                    const nodeA = nodesMap.get(a)
                    const nodeB = nodesMap.get(b)
                    return (nodeA?.index || 0) - (nodeB?.index || 0)
                })
            }
        }

        return {
            rootId,
            nodes: nodesMap
        }
    }
}