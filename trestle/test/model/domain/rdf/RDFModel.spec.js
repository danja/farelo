// test/domain/rdf/RDFModel.spec.js
import { expect } from 'chai'
import RDFModel from '../../../../src/domain/rdf/RDFModel.js'

describe('RDFModel', () => {
    let rdfModel

    beforeEach(() => {
        rdfModel = new RDFModel()
    })

    describe('createPostData', () => {
        it('should create basic post data with required fields', () => {
            const postData = {
                content: 'Test content',
                type: 'entry'
            }

            const result = rdfModel.createPostData(postData)

            expect(result).to.have.property('id')
            expect(result).to.have.property('dataset')
            expect(result).to.have.property('subject')
            expect(result.originalData).to.deep.equal(postData)

            // Test the dataset contains the right quads
            const quads = Array.from(result.dataset)
            expect(quads).to.have.length.at.least(2) // Type and content quads

            // Verify content quad
            const contentQuad = quads.find(quad =>
                quad.predicate.value.includes('content')
            )
            expect(contentQuad).to.exist
            expect(contentQuad.object.value).to.equal('Test content')

            // Verify type quad
            const typeQuad = quads.find(quad =>
                quad.predicate.value.includes('type')
            )
            expect(typeQuad).to.exist
            expect(typeQuad.object.value).to.include('entry')
        })

        it('should handle custom ID', () => {
            const postData = {
                customId: 'custom-id-123',
                content: 'Test with custom ID'
            }

            const result = rdfModel.createPostData(postData)

            expect(result.id).to.equal('custom-id-123')
            expect(result.subject.value).to.include('custom-id-123')
        })

        it('should handle title property', () => {
            const postData = {
                content: 'Test content',
                title: 'Test Title'
            }

            const result = rdfModel.createPostData(postData)

            // Find the title quad
            const quads = Array.from(result.dataset)
            const titleQuad = quads.find(quad =>
                quad.predicate.value.includes('title')
            )

            expect(titleQuad).to.exist
            expect(titleQuad.object.value).to.equal('Test Title')
        })

        it('should handle tags array', () => {
            const postData = {
                content: 'Test content',
                tags: ['tag1', 'tag2', '']
            }

            const result = rdfModel.createPostData(postData)

            // Find the tag quads
            const quads = Array.from(result.dataset)
            const tagQuads = quads.filter(quad =>
                quad.predicate.value.includes('tag')
            )

            expect(tagQuads).to.have.length(2) // Should skip empty tag
            expect(tagQuads[0].object.value).to.equal('tag1')
            expect(tagQuads[1].object.value).to.equal('tag2')
        })

        it('should handle custom properties', () => {
            const postData = {
                content: 'Test content',
                customProp: 'Custom value'
            }

            const result = rdfModel.createPostData(postData)

            // Find the custom property quad
            const quads = Array.from(result.dataset)
            const customQuad = quads.find(quad =>
                quad.predicate.value.includes('customProp')
            )

            expect(customQuad).to.exist
            expect(customQuad.object.value).to.equal('Custom value')
        })

        it('should treat URLs as named nodes', () => {
            const postData = {
                content: 'Test content',
                link: 'https://example.com'
            }

            const result = rdfModel.createPostData(postData)

            // Find the link quad
            const quads = Array.from(result.dataset)
            const linkQuad = quads.find(quad =>
                quad.predicate.value.includes('link')
            )

            expect(linkQuad).to.exist
            expect(linkQuad.object.termType).to.equal('NamedNode')
            expect(linkQuad.object.value).to.equal('https://example.com')
        })
    })
})