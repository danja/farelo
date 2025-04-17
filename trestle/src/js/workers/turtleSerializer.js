// src/js/workers/turtleSerializer.js

// Fix for Web Worker environment - must come before imports
if (typeof window === 'undefined' && typeof self !== 'undefined') {
    self.window = self
}

import rdf from 'rdf-ext'
import N3Parser from '@rdfjs/parser-n3'
import TurtleSerializer from '@rdfjs/serializer-turtle'
import { Readable } from 'readable-stream'

// Track serialization performance
let startTime = 0
let parsingStartTime = 0
let serializingStartTime = 0
let quadCount = 0

// Initialize worker and notify parent
self.postMessage({ ready: true })

// Add handler for incoming messages
self.addEventListener('message', (event) => {
    const nquadsData = event.data

    // Validate input data
    if (typeof nquadsData !== 'string') {
        // Ignore webpack internal messages
        if (nquadsData && nquadsData.type === 'webpack-internal') return
        self.postMessage({ error: 'Invalid data received by worker. Expected N-Quads string.' })
        return
    }

    // Handle empty data case
    if (nquadsData.length === 0) {
        self.postMessage({ turtle: '' })
        return
    }

    try {
        // Record start time for performance tracking
        startTime = performance.now()
        parsingStartTime = startTime

        // Send initial status with data size
        self.postMessage({
            status: 'started',
            message: 'Starting serialization process',
            dataSize: nquadsData.length,
            estimatedQuads: Math.floor(nquadsData.length / 140) // Rough estimate based on average quad size
        })

        // Split large data into chunks - prevents memory issues
        const MAX_CHUNK_SIZE = 500000 // ~500KB chunks
        const chunks = []

        for (let i = 0; i < nquadsData.length; i += MAX_CHUNK_SIZE) {
            chunks.push(nquadsData.substring(i, i + MAX_CHUNK_SIZE))
        }

        // Update on chunk count for large datasets
        if (chunks.length > 1) {
            self.postMessage({
                status: 'chunking',
                message: `Processing in ${chunks.length} chunks to prevent memory issues`,
                chunks: chunks.length
            })
        }

        // Process all chunks and collect quads
        processChunks(chunks).then(dataset => {
            // All chunks processed, now serialize
            serializingStartTime = performance.now()
            self.postMessage({
                status: 'serializing',
                message: 'Parsing complete, now serializing to Turtle',
                quadCount,
                parsingTime: Math.round(serializingStartTime - parsingStartTime),
                elapsed: Math.round(serializingStartTime - startTime)
            })

            return serializeDataset(dataset)
        }).then(turtleString => {
            const totalTime = performance.now() - startTime
            self.postMessage({
                turtle: turtleString,
                performance: {
                    quadCount,
                    timeMs: Math.round(totalTime),
                    parsingTimeMs: Math.round(serializingStartTime - parsingStartTime),
                    serializingTimeMs: Math.round(performance.now() - serializingStartTime),
                    quadsPerSecond: Math.round(quadCount / (totalTime / 1000))
                }
            })
        }).catch(error => {
            self.postMessage({
                error: `Serialization failed: ${error.message || error}`,
                quadCount,
                elapsed: Math.round(performance.now() - startTime)
            })
        })
    } catch (error) {
        self.postMessage({ error: `Serialization setup failed: ${error.message || error}` })
    }
})

/**
 * Process N-Quads data chunks into a dataset
 * @param {Array<string>} chunks - Array of N-Quads string chunks
 * @returns {Promise<Dataset>} - Promise resolving to the complete dataset
 */
async function processChunks(chunks) {
    const dataset = rdf.dataset()
    quadCount = 0

    // Create parser
    const parser = new N3Parser({ factory: rdf })

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        // Send progress update
        self.postMessage({
            status: 'parsing',
            message: `Parsing chunk ${i + 1}/${chunks.length}`,
            progress: Math.round(((i + 1) / chunks.length) * 100),
            currentChunk: i + 1,
            totalChunks: chunks.length,
            currentQuads: quadCount,
            elapsed: Math.round(performance.now() - startTime)
        })

        try {
            // Parse this chunk
            const chunkDataset = await parseChunk(parser, chunk)

            // Add quads to main dataset
            for (const quad of chunkDataset) {
                dataset.add(quad)
                quadCount++
            }

            // Give the browser a chance to breathe between chunks
            await sleep(0)
        } catch (error) {
            console.error(`Error processing chunk ${i + 1}:`, error)
            self.postMessage({
                status: 'error',
                message: `Error processing chunk ${i + 1}: ${error.message}`
            })
            // Continue with next chunk despite error
        }
    }

    return dataset
}

/**
 * Parse a single chunk of N-Quads data
 * @param {Parser} parser - RDF parser instance
 * @param {string} chunk - N-Quads string chunk
 * @returns {Promise<Dataset>} - Promise resolving to dataset with parsed quads
 */
function parseChunk(parser, chunk) {
    return new Promise((resolve, reject) => {
        try {
            // Create a readable stream from the N-Quads string
            const nquadsStream = new Readable({
                read() { } // Required but no custom implementation needed
            })

            nquadsStream.push(chunk)
            nquadsStream.push(null)

            // Parse N-Quads
            const quadStream = parser.import(nquadsStream)
            const chunkDataset = rdf.dataset()

            // Track progress within chunk
            let chunkQuadCount = 0

            quadStream.on('data', (quad) => {
                chunkDataset.add(quad)
                chunkQuadCount++

                // Send occasional progress updates for very large chunks
                if (chunkQuadCount % 10000 === 0) {
                    self.postMessage({
                        status: 'parsing-progress',
                        currentChunkQuads: chunkQuadCount,
                        totalQuads: quadCount + chunkQuadCount,
                        elapsed: Math.round(performance.now() - startTime)
                    })
                }
            })

            quadStream.on('end', () => {
                resolve(chunkDataset)
            })

            quadStream.on('error', (err) => {
                reject(new Error(`Parsing failed: ${err.message || err}`))
            })
        } catch (error) {
            reject(new Error(`Chunk parsing error: ${error.message || error}`))
        }
    })
}

/**
 * Serialize a dataset to Turtle format
 * @param {Dataset} dataset - RDF dataset to serialize
 * @returns {Promise<string>} - Promise resolving to Turtle string
 */
function serializeDataset(dataset) {
    return new Promise((resolve, reject) => {
        try {
            const serializer = new TurtleSerializer()
            let turtleString = ''

            // Start by adding prefixes
            turtleString += '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n'
            turtleString += '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n'
            turtleString += '@prefix dc: <http://purl.org/dc/terms/> .\n'
            turtleString += '@prefix ts: <http://purl.org/stuff/trestle/> .\n\n'

            // Create a stream from the dataset
            const inputStream = dataset.toStream()

            // Serialize to Turtle
            const turtleStream = serializer.import(inputStream)

            // Track serialization progress
            let processedChunks = 0

            turtleStream.on('data', (chunk) => {
                turtleString += chunk.toString()
                processedChunks++

                // Send periodic updates for large datasets
                if (processedChunks % 50 === 0) {
                    self.postMessage({
                        status: 'serializing-progress',
                        streamChunks: processedChunks,
                        elapsed: Math.round(performance.now() - startTime)
                    })
                }
            })

            turtleStream.on('end', () => {
                resolve(turtleString)
            })

            turtleStream.on('error', (err) => {
                reject(new Error(`Serialization failed: ${err.message || err}`))
            })
        } catch (error) {
            reject(new Error(`Serialization setup failed: ${error.message || error}`))
        }
    })
}

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} - Promise that resolves after the specified time
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Handle worker errors
self.addEventListener('error', (error) => {
    self.postMessage({ error: `Worker error: ${error.message}` })
})