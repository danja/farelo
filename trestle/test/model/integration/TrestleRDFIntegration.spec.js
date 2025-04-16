// test/integration/TrestleRDFIntegration.spec.js
import { expect } from 'chai'
import { EventBus } from '../../../src/js/utils/EventBus.js'
import { TrestleModel } from '../../../src/js/model/TrestleModel.js'
import RDFModel from '../../../src/domain/rdf/RDFModel.js'
import { JSDOM } from 'jsdom'

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window
global.document = dom.window.document

describe('TrestleModel with RDFModel Integration', () => {
    let trestleModel
    let rdfModel
    let eventBus
    let mockEndpoint = 'http://mock-endpoint/sparql'
    let mockBaseUri = 'http://example.org/trestle/'

    beforeEach(() => {
        eventBus = new EventBus()
        rdfModel = new RDFModel()

        // Mock fetch
        global.fetch = async (url, options) => {
            // Return empty result by default
            return {
                ok: true,
                json: async () => ({ results: { bindings: [] } })
            }
        }
    })

    afterEach(() => {
        // Clean up
        delete global.fetch
    })

    // This test would be relevant after refactoring
    it.skip('should integrate TrestleModel with RDFModel', async () => {
        // Initialize the model
        trestleModel = new TrestleModel(mockEndpoint, mockBaseUri, eventBus, rdfModel)
        await trestleModel.initialize()

        // Add some nodes
        const rootId = trestleModel.getRootNode().id
        const node1 = trestleModel.addNode(rootId, 'Node 1', 0)
        const node2 = trestleModel.addNode(rootId, 'Node 2', 1)
        const node3 = trestleModel.addNode(node1.id, 'Child Node', 0)

        // Test that nodes were added correctly
        expect(trestleModel.getNode(node1.id)).to.exist
        expect(trestleModel.getNode(node2.id)).to.exist
        expect(trestleModel.getNode(node3.id)).to.exist

        // Test hierarchical structure
        const root = trestleModel.getRootNode()
        expect(root.children).to.include(node1.id)
        expect(root.children).to.include(node2.id)

        const parent = trestleModel.getNode(node1.id)
        expect(parent.children).to.include(node3.id)

        // Test serialization to Turtle
        const turtle = trestleModel.toTurtle()
        expect(turtle).to.include(node1.id)
        expect(turtle).to.include(node2.id)
        expect(turtle).to.include(node3.id)
        expect(turtle).to.include('Node 1')
        expect(turtle).to.include('Node 2')
        expect(turtle).to.include('Child Node')
    })
})