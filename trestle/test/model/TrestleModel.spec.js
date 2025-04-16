// test/model/TrestleModel.fixed.spec.js
import { expect } from 'chai'
import { EventBus } from '../../src/js/utils/EventBus.js'
import { TrestleModel } from '../../src/js/model/TrestleModel.js'
import { JSDOM } from 'jsdom'

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window
global.document = dom.window.document

describe('TrestleModel', () => {
    let model
    let eventBus
    let mockEndpoint = 'http://mock-endpoint/sparql'
    let mockBaseUri = 'http://example.org/trestle/'

    beforeEach(() => {
        eventBus = new EventBus()

        // Mock fetch
        global.fetch = async () => ({
            ok: true,
            json: async () => ({ results: { bindings: [] } })
        })

        // Create model
        model = new TrestleModel(mockEndpoint, mockBaseUri, eventBus)
    })

    afterEach(() => {
        delete global.fetch
    })

    describe('initialization', () => {
        it('should initialize with model:loaded event', async () => {
            let loadedCalled = false
            eventBus.subscribe('model:loaded', () => {
                loadedCalled = true
            })

            await model.initialize()

            expect(loadedCalled).to.be.true
        })


        it('should initialize nodes map when loaded', async () => {
            // With mocked empty SPARQL results
            await model.initialize()

            // Test if nodes map exists (might be empty with no errors)
            expect(model.nodes).to.exist
            // Note: model only creates nodes when SPARQL errors, not on empty results
        })
    })

    describe('CRUD operations', () => {
        beforeEach(async () => {
            await model.initialize()
            // Create a root node manually for testing
            if (!model.rootId) {
                model.createEmptyModel()
            }
        })

        it('should add node correctly', () => {
            const rootId = model.rootId
            expect(rootId).to.exist

            const newNode = model.addNode(rootId, 'Test Node', 0)

            expect(newNode).to.exist
            expect(newNode.title).to.equal('Test Node')
            expect(newNode.parent).to.equal(rootId)
            expect(newNode.index).to.equal(0)

            const rootNode = model.getNode(rootId)
            expect(rootNode.children).to.include(newNode.id)
        })

        it('should update node correctly', () => {
            const rootId = model.rootId
            const newNode = model.addNode(rootId, 'Test Node', 0)

            model.updateNode(newNode.id, { title: 'Updated Title' })

            const updatedNode = model.getNode(newNode.id)
            expect(updatedNode.title).to.equal('Updated Title')
        })

        it('should delete node correctly', () => {
            const rootId = model.rootId
            const newNode = model.addNode(rootId, 'Test Node', 0)

            model.deleteNode(newNode.id)

            const deletedNode = model.getNode(newNode.id)
            expect(deletedNode).to.be.undefined

            const rootNode = model.getNode(rootId)
            expect(rootNode.children).to.not.include(newNode.id)
        })

        it('should delete node and all its children', () => {
            const rootId = model.rootId
            const parentNode = model.addNode(rootId, 'Parent Node', 0)
            const childNode = model.addNode(parentNode.id, 'Child Node', 0)

            model.deleteNode(parentNode.id)

            expect(model.getNode(parentNode.id)).to.be.undefined
            expect(model.getNode(childNode.id)).to.be.undefined
        })
    })

    describe('Hierarchical operations', () => {
        let rootId, node1, node2, node3

        beforeEach(async () => {
            await model.initialize()
            if (!model.rootId) {
                model.createEmptyModel()
            }
            rootId = model.rootId
            node1 = model.addNode(rootId, 'Node 1', 0)
            node2 = model.addNode(rootId, 'Node 2', 1)
            node3 = model.addNode(rootId, 'Node 3', 2)
        })

        it('should move node to a new parent', () => {
            model.moveNode(node3.id, node1.id, 0)

            const updatedNode3 = model.getNode(node3.id)
            expect(updatedNode3.parent).to.equal(node1.id)
            expect(updatedNode3.index).to.equal(0)

            const updatedNode1 = model.getNode(node1.id)
            expect(updatedNode1.children).to.include(node3.id)

            const rootNode = model.getNode(rootId)
            expect(rootNode.children).to.not.include(node3.id)
        })

        it('should reorder nodes within the same parent', () => {
            model.moveNode(node3.id, rootId, 0)

            const updatedRoot = model.getNode(rootId)
            expect(updatedRoot.children[0]).to.equal(node3.id)
            expect(updatedRoot.children[1]).to.equal(node1.id)
            expect(updatedRoot.children[2]).to.equal(node2.id)

            expect(model.getNode(node3.id).index).to.equal(0)
            expect(model.getNode(node1.id).index).to.equal(1)
            expect(model.getNode(node2.id).index).to.equal(2)
        })
    })

    describe('RDF serialization', () => {
        beforeEach(async () => {
            await model.initialize()
            if (!model.rootId) {
                model.createEmptyModel()
            }
            const rootId = model.rootId
            model.addNode(rootId, 'Test Node 1', 0)
            const node2 = model.addNode(rootId, 'Test Node 2', 1)
            model.addNode(node2.id, 'Child Node', 0)
        })

        it('should generate valid Turtle representation', () => {
            const turtle = model.toTurtle()

            expect(turtle).to.include('@prefix dc:')
            expect(turtle).to.include('@prefix ts:')
            expect(turtle).to.include('a ts:RootNode')
            expect(turtle).to.include('a ts:Node')
            expect(turtle).to.include('dc:title "Test Node 1"')
            expect(turtle).to.include('dc:title "Test Node 2"')
            expect(turtle).to.include('dc:title "Child Node"')
            expect(turtle).to.include('ts:index "0"')
            expect(turtle).to.include('ts:parent')
        })

        it('should escape special characters in Turtle strings', () => {
            const rootId = model.rootId
            model.addNode(rootId, 'Node with "quotes" and \\ backslash', 2)

            const turtle = model.toTurtle()

            expect(turtle).to.include('dc:title "Node with \\"quotes\\" and \\\\ backslash"')
        })
    })

    describe('Event handling', () => {
        beforeEach(async () => {
            await model.initialize()
            if (!model.rootId) {
                model.createEmptyModel()
            }
        })

        it('should handle node:updated events', () => {
            const rootId = model.rootId
            const node = model.addNode(rootId, 'Original Title', 0)

            eventBus.publish('node:updated', {
                nodeId: node.id,
                properties: { title: 'Updated via Event' }
            })

            const updatedNode = model.getNode(node.id)
            expect(updatedNode.title).to.equal('Updated via Event')
        })

        it('should handle node:moved events', () => {
            const rootId = model.rootId
            const node1 = model.addNode(rootId, 'Node 1', 0)
            const node2 = model.addNode(rootId, 'Node 2', 1)

            eventBus.publish('node:moved', {
                nodeId: node2.id,
                newParentId: node1.id,
                newIndex: 0
            })

            const movedNode = model.getNode(node2.id)
            expect(movedNode.parent).to.equal(node1.id)

            const parentNode = model.getNode(node1.id)
            expect(parentNode.children).to.include(node2.id)
        })

        it('should handle node:deleted events', () => {
            const rootId = model.rootId
            const node = model.addNode(rootId, 'Node to Delete', 0)

            eventBus.publish('node:deleted', {
                nodeId: node.id
            })

            expect(model.getNode(node.id)).to.be.undefined

            const rootNode = model.getNode(rootId)
            expect(rootNode.children).to.not.include(node.id)
        })
    })
})