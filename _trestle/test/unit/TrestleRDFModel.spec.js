// test/model/TrestleRDFModel.spec.js
import { expect } from 'chai'
import { EventBus } from '../../src/js/utils/EventBus.js'
import TrestleRDFModel from '../../src/js/model/TrestleRDFModel.js'
import { JSDOM } from 'jsdom'

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window
global.document = dom.window.document

describe('TrestleRDFModel', () => {
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
        model = new TrestleRDFModel(mockEndpoint, mockBaseUri, eventBus)
    })

    afterEach(() => {
        delete global.fetch
    })

    describe('initialization', () => {
        it('should initialize with an RDF dataset', async () => {
            await model.initialize()
            model.createEmptyModel() // Force empty model creation

            expect(model.rdfDataset).to.exist

            // Force create a root node
            const rootId = model.rootId
            expect(rootId).to.exist

            // Dataset should have quads for the root node
            const quads = Array.from(model.rdfDataset)
            expect(quads.length).to.be.at.least(1)

            // At least one quad should be about the root node
            const rootQuads = quads.filter(quad =>
                quad.subject.value.includes(rootId)
            )
            expect(rootQuads.length).to.be.at.least(1)
        })
    })

    describe('CRUD operations with RDF', () => {
        beforeEach(async () => {
            await model.initialize()
            model.createEmptyModel() // Force empty model creation
        })

        it('should add node with RDF representation', () => {
            const rootId = model.rootId
            const newNode = model.addNode(rootId, 'Test Node', 0)

            // Check in-memory model
            expect(newNode).to.exist
            expect(newNode.title).to.equal('Test Node')

            // Check RDF representation
            const quads = Array.from(model.rdfDataset)
            const nodeQuads = quads.filter(quad =>
                quad.subject.value.includes(newNode.id)
            )

            expect(nodeQuads.length).to.be.at.least(1)

            // Should have title triple
            const titleQuad = nodeQuads.find(quad =>
                quad.predicate.value.includes('title')
            )
            expect(titleQuad).to.exist
            expect(titleQuad.object.value).to.equal('Test Node')

            // Should have parent triple
            const parentQuad = nodeQuads.find(quad =>
                quad.predicate.value.includes('parent')
            )
            expect(parentQuad).to.exist
            expect(parentQuad.object.value).to.include(rootId)
        })

        it('should update node with RDF representation', () => {
            const rootId = model.rootId
            const newNode = model.addNode(rootId, 'Original Title', 0)

            // Update the node
            model.updateNode(newNode.id, { title: 'Updated Title' })

            // Check in-memory model
            const updatedNode = model.getNode(newNode.id)
            expect(updatedNode.title).to.equal('Updated Title')

            // Check RDF representation
            const quads = Array.from(model.rdfDataset)
            const titleQuad = quads.find(quad =>
                quad.subject.value.includes(newNode.id) &&
                quad.predicate.value.includes('title')
            )

            expect(titleQuad).to.exist
            expect(titleQuad.object.value).to.equal('Updated Title')
        })

        it('should delete node with RDF representation', () => {
            const rootId = model.rootId
            const newNode = model.addNode(rootId, 'Node to Delete', 0)

            // Verify node exists in RDF
            let quads = Array.from(model.rdfDataset)
            let nodeQuads = quads.filter(quad =>
                quad.subject.value.includes(newNode.id)
            )
            expect(nodeQuads.length).to.be.at.least(1)

            // Delete the node
            model.deleteNode(newNode.id)

            // Check in-memory model
            expect(model.getNode(newNode.id)).to.be.undefined

            // Check RDF representation
            quads = Array.from(model.rdfDataset)
            nodeQuads = quads.filter(quad =>
                quad.subject.value.includes(newNode.id)
            )
            expect(nodeQuads.length).to.equal(0)
        })

        it('should delete node and all its children from RDF', () => {
            const rootId = model.rootId
            const parentNode = model.addNode(rootId, 'Parent Node', 0)
            const childNode = model.addNode(parentNode.id, 'Child Node', 0)

            // Verify nodes exist in RDF
            let quads = Array.from(model.rdfDataset)
            let parentQuads = quads.filter(quad =>
                quad.subject.value.includes(parentNode.id)
            )
            let childQuads = quads.filter(quad =>
                quad.subject.value.includes(childNode.id)
            )

            expect(parentQuads.length).to.be.at.least(1)
            expect(childQuads.length).to.be.at.least(1)

            // Delete parent node
            model.deleteNode(parentNode.id)

            // Check in-memory model
            expect(model.getNode(parentNode.id)).to.be.undefined
            expect(model.getNode(childNode.id)).to.be.undefined

            // Check RDF representation
            quads = Array.from(model.rdfDataset)
            parentQuads = quads.filter(quad =>
                quad.subject.value.includes(parentNode.id)
            )
            childQuads = quads.filter(quad =>
                quad.subject.value.includes(childNode.id)
            )

            expect(parentQuads.length).to.equal(0)
            expect(childQuads.length).to.equal(0)
        })

        it('should update node description in RDF', () => {
            const rootId = model.rootId
            const newNode = model.addNode(rootId, 'Node with Description', 0)

            // Add description
            model.updateNodeDescription(newNode.id, 'Test description')

            // Check in-memory model
            const updatedNode = model.getNode(newNode.id)
            expect(updatedNode.description).to.equal('Test description')

            // Check RDF representation
            const quads = Array.from(model.rdfDataset)
            const descQuad = quads.find(quad =>
                quad.subject.value.includes(newNode.id) &&
                quad.predicate.value.includes('description')
            )

            expect(descQuad).to.exist
            expect(descQuad.object.value).to.equal('Test description')
        })
    })

    describe('Hierarchical operations with RDF', () => {
        let rootId, node1, node2, node3

        beforeEach(async () => {
            await model.initialize()
            model.createEmptyModel()
            rootId = model.rootId
            node1 = model.addNode(rootId, 'Node 1', 0)
            node2 = model.addNode(rootId, 'Node 2', 1)
            node3 = model.addNode(rootId, 'Node 3', 2)
        })

        it('should update RDF when moving nodes', () => {
            // Move node3 to be a child of node1
            model.moveNode(node3.id, node1.id, 0)

            // Check in-memory model
            const updatedNode3 = model.getNode(node3.id)
            expect(updatedNode3.parent).to.equal(node1.id)

            // Check RDF representation
            const quads = Array.from(model.rdfDataset)

            // Find the parent triple for node3
            const parentQuad = quads.find(quad =>
                quad.subject.value.includes(node3.id) &&
                quad.predicate.value.includes('parent')
            )

            expect(parentQuad).to.exist
            expect(parentQuad.object.value).to.include(node1.id)

            // Find the index triple for node3
            const indexQuad = quads.find(quad =>
                quad.subject.value.includes(node3.id) &&
                quad.predicate.value.includes('index')
            )

            expect(indexQuad).to.exist
            expect(indexQuad.object.value).to.equal('0')
        })
    })

    describe('RDF dataset operations', () => {
        beforeEach(async () => {
            await model.initialize()
            model.createEmptyModel()
        })

        it('should provide access to the RDF dataset', () => {
            const rootId = model.rootId
            model.addNode(rootId, 'Test Node', 0)

            const dataset = model.getRDFDataset()
            expect(dataset).to.exist

            const quads = Array.from(dataset)
            expect(quads.length).to.be.at.least(2) // Root node + test node
        })

        it('should generate Turtle output', () => {
            const rootId = model.rootId
            model.addNode(rootId, 'Test Node 1', 0)
            const node2 = model.addNode(rootId, 'Test Node 2', 1)
            model.addNode(node2.id, 'Child Node', 0)

            const turtle = model.toTurtle()

            expect(turtle).to.include('@prefix dc:')
            expect(turtle).to.include('@prefix ts:')
            expect(turtle).to.include('a ts:RootNode')
            expect(turtle).to.include('a ts:Node')
            expect(turtle).to.include('dc:title "Test Node 1"')
            expect(turtle).to.include('dc:title "Test Node 2"')
            expect(turtle).to.include('dc:title "Child Node"')
        })
    })
})