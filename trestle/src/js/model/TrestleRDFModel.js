// src/js/model/TrestleRDFModel.js
import { TrestleModel } from "./TrestleModel.js"
import { Config } from "../config.js"
import rdf from "rdf-ext"
import TurtleSerializer from "@rdfjs/serializer-turtle"
import { TreeNodeOperations } from "./TreeNodeOperations.js"
import { AsyncOperations } from "../utils/AsyncOperations.js"

class TrestleRDFModel extends TrestleModel {
    constructor(endpoint, baseUri, eventBus) {
        super(endpoint, baseUri, eventBus)

        this.rdfDataset = rdf.dataset()

        // Status tracking
        this.serializationStatus = {
            inProgress: false,
            lastRun: null,
            quadCount: 0
        }
    }

    async initialize() {
        try {
            await super.initialize()

            // Build RDF dataset using deferred operation to avoid UI blocking
            await AsyncOperations.deferOperation(() => {
                this.buildRDFDataset()
            })
        } catch (error) {
            console.error("Error in RDF initialization:", error)
        }
    }

    createEmptyModel() {
        super.createEmptyModel()
        this.buildRDFDataset()
    }

    async buildRDFDataset() {
        this.rdfDataset = rdf.dataset()
        console.log(`dataset = \n${this.rdfDataset}`)
        // Process nodes in chunks to avoid UI blocking
        const nodeIds = Array.from(this.nodes.keys())

        await AsyncOperations.processInChunks(
            (nodeId) => {
                const node = this.getNode(nodeId)
                if (node) {
                    this.addNodeToRDF(node)
                }
            },
            nodeIds,
            50, // Process 50 nodes per chunk
            (progress) => {
                if (progress.percentage % 20 === 0) {
                    console.log(`Building RDF dataset: ${progress.percentage}% complete`)
                }
            }
        )
    }

    addNodeToRDF(node) {
        if (!node) return

        const ns = {
            rdf: rdf.namespace(
                Config.PREFIXES.rdf || "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
            ),
            dc: rdf.namespace(Config.PREFIXES.dc),
            ts: rdf.namespace(Config.PREFIXES.ts),
            xsd: rdf.namespace(
                Config.PREFIXES.xsd || "http://www.w3.org/2001/XMLSchema#"
            ),
        }
        const subject = rdf.namedNode(`${this.baseUri}${node.id}`)

        const add = (p, o) => {
            if (o !== undefined && o !== null) {
                this.rdfDataset.add(rdf.quad(subject, p, o))
            }
        }

        add(ns.rdf("type"), ns.ts(node.type))

        if (node.title !== undefined) {
            add(ns.dc("title"), rdf.literal(node.title))
        }

        if (node.created) {
            add(ns.dc("created"), rdf.literal(node.created, ns.xsd("dateTime")))
        } else {
            add(
                ns.dc("created"),
                rdf.literal(new Date().toISOString(), ns.xsd("dateTime"))
            )
        }

        if (node.description !== undefined) {
            add(ns.ts("description"), rdf.literal(node.description))
        }

        if (node.parent !== undefined && node.parent !== null) {
            add(ns.ts("parent"), rdf.namedNode(`${this.baseUri}${node.parent}`))
        }

        if (node.index !== undefined) {
            add(ns.ts("index"), rdf.literal(node.index.toString()))
        }
    }

    addNode(parentId, title, index) {
        const newNode = super.addNode(parentId, title, index)
        this.addNodeToRDF(newNode)
        return newNode
    }

    updateNode(nodeId, properties) {
        super.updateNode(nodeId, properties)

        const node = this.getNode(nodeId)
        if (node) {
            // Use AsyncOperations to defer RDF processing
            AsyncOperations.deferOperation(() => {
                const quadsToRemove = this.rdfDataset.match(
                    rdf.namedNode(`${this.baseUri}${nodeId}`)
                )
                for (const quad of quadsToRemove) {
                    this.rdfDataset.delete(quad)
                }

                this.addNodeToRDF(node)
            })
        }
    }

    updateNodeDescription(nodeId, description) {
        super.updateNodeDescription(nodeId, description)

        const node = this.getNode(nodeId)
        if (node) {
            // Use AsyncOperations to defer RDF processing
            AsyncOperations.deferOperation(() => {
                const descQuads = this.rdfDataset.match(
                    rdf.namedNode(`${this.baseUri}${nodeId}`),
                    rdf.namespace(Config.PREFIXES.dc)("description")
                )
                for (const quad of descQuads) {
                    this.rdfDataset.delete(quad)
                }

                if (description) {
                    this.rdfDataset.add(
                        rdf.quad(
                            rdf.namedNode(`${this.baseUri}${nodeId}`),
                            rdf.namespace(Config.PREFIXES.dc)("description"),
                            rdf.literal(description)
                        )
                    )
                }
            })
        }
    }

    deleteNode(nodeId) {
        // Use TreeNodeOperations to get all descendants with iteration instead of recursion
        const descendantIds = TreeNodeOperations.getAllDescendantIds(this.nodes, nodeId)
        const allNodesToDelete = [nodeId, ...descendantIds]

        // Call parent delete method
        super.deleteNode(nodeId)

        // Remove nodes from RDF dataset in chunks to avoid UI blocking
        AsyncOperations.processInChunks(
            (idToDelete) => this.removeNodeFromRDF(idToDelete),
            allNodesToDelete,
            50
        )

        return allNodesToDelete
    }

    // Non-recursive implementation using TreeNodeOperations
    getAllDescendantIds(nodeId) {
        return TreeNodeOperations.getAllDescendantIds(this.nodes, nodeId)
    }

    removeNodeFromRDF(nodeId) {
        const subject = rdf.namedNode(`${this.baseUri}${nodeId}`)

        const quadsToRemove = []

        for (const quad of this.rdfDataset.match(subject)) {
            quadsToRemove.push(quad)
        }

        for (const quad of this.rdfDataset.match(null, null, subject)) {
            quadsToRemove.push(quad)
        }

        for (const quad of quadsToRemove) {
            this.rdfDataset.delete(quad)
        }
    }

    moveNode(nodeId, newParentId, newIndex) {
        super.moveNode(nodeId, newParentId, newIndex)

        AsyncOperations.deferOperation(() => {
            const node = this.getNode(nodeId)
            if (node) {
                this.removeNodeFromRDF(nodeId)
                this.addNodeToRDF(node)
            }

            const newParent = this.getNode(newParentId)
            if (newParent && newParent.children) {
                // Update children indices in RDF in chunks
                AsyncOperations.processInChunks(
                    (childId) => {
                        const child = this.getNode(childId)
                        if (child) {
                            this.removeNodeFromRDF(childId)
                            this.addNodeToRDF(child)
                        }
                    },
                    newParent.children,
                    10
                )
            }
        })
    }

    async toTurtle() {
        // If a serialization is already in progress, show status
        if (this.serializationStatus.inProgress) {
            return `// Serialization already in progress (${this.serializationStatus.quadCount} quads)
// Started: ${this.serializationStatus.lastRun}
// Please wait...`
        }

        this.serializationStatus = {
            inProgress: true,
            lastRun: new Date().toISOString(),
            quadCount: this.rdfDataset.size
        }

        this.eventBus.publish('model:serializing', {
            started: this.serializationStatus.lastRun,
            quadCount: this.serializationStatus.quadCount
        })

        return new Promise((resolve, reject) => {
            if (!window.Worker) {
                // Fallback for browsers without Worker support
                try {
                    // Break serialization into chunks to avoid UI blocking
                    const chunkSize = 1000
                    const totalQuads = this.rdfDataset.size
                    let processedQuads = 0

                    // Create a new dataset to hold processed quads
                    let currentDataset = rdf.dataset()

                    // Process dataset in chunks
                    const processDatasetChunks = async () => {
                        const serializer = new TurtleSerializer()
                        let turtleString = ""

                        // Process dataset in smaller chunks
                        for (const quad of this.rdfDataset) {
                            currentDataset.add(quad)
                            processedQuads++

                            if (processedQuads % chunkSize === 0 || processedQuads === totalQuads) {
                                // Update status
                                this.eventBus.publish('model:serializing', {
                                    progress: Math.round((processedQuads / totalQuads) * 100),
                                    processedQuads,
                                    totalQuads
                                })

                                // Yield to UI thread
                                await new Promise(resolve => setTimeout(resolve, 0))
                            }
                        }

                        // Serialize the final dataset
                        const input = currentDataset.toStream()
                        const output = serializer.import(input)

                        // Collect output chunks
                        output.on("data", (chunk) => {
                            turtleString += chunk.toString()
                        })

                        output.on("end", () => {
                            this.serializationStatus.inProgress = false
                            resolve(turtleString)

                            this.eventBus.publish('model:serialized', {
                                completed: new Date().toISOString(),
                                quadCount: this.serializationStatus.quadCount
                            })
                        })

                        output.on("error", (err) => {
                            this.serializationStatus.inProgress = false
                            reject(new Error(`Serialization error: ${err.message}`))

                            this.eventBus.publish('model:error', {
                                error: `Serialization error: ${err.message}`
                            })
                        })
                    }

                    // Start processing
                    processDatasetChunks()
                } catch (error) {
                    this.serializationStatus.inProgress = false
                    reject(new Error(`Serialization setup failed: ${error.message}`))

                    this.eventBus.publish('model:error', {
                        error: `Serialization setup failed: ${error.message}`
                    })
                }
                return
            }

            // Create the worker with dynamic timeout based on dataset size
            let worker
            try {
                worker = new Worker(
                    new URL("../workers/turtleSerializer.js", import.meta.url),
                    { type: "module" }
                )
            } catch (error) {
                this.serializationStatus.inProgress = false
                reject(new Error(`Failed to create worker: ${error.message}`))

                this.eventBus.publish('model:error', {
                    error: `Failed to create worker: ${error.message}`
                })
                return
            }

            console.log(JSON.stringify(this.rdfDataset))
            // Calculate timeout based on dataset size - larger datasets get more time
            // Use a base of 30 seconds plus 1 second per 1000 quads with a max of 5 minutes
            const quadCount = this.rdfDataset.size
            const baseTimeout = 30000 // 30 seconds base
            const perQuadTime = quadCount / 1000 // 1ms per quad
            const calculatedTimeout = Math.min(baseTimeout + (perQuadTime * 1000), 300000) // Cap at 5 minutes

            console.log(`Serialization timeout set to ${Math.round(calculatedTimeout / 1000)} seconds for ${quadCount} quads`)

            // Set a dynamic timeout to prevent hanging
            const timeoutId = setTimeout(() => {
                if (worker) {
                    worker.terminate()
                    this.serializationStatus.inProgress = false
                    reject(new Error(`Serialization timeout after ${Math.round(calculatedTimeout / 1000)} seconds. Dataset may be too large for browser processing.`))

                    this.eventBus.publish('model:error', {
                        error: `Serialization timeout. Try with a smaller dataset or increase timeout.`,
                        quadCount: quadCount
                    })
                }
            }, calculatedTimeout)

            // Handle worker messages
            worker.onmessage = (event) => {
                if (event.data.ready) {
                    console.log("Turtle Serializer Worker ready.")
                    try {
                        const nquadsData = this.rdfDataset.toString()
                        worker.postMessage(nquadsData)
                    } catch (error) {
                        clearTimeout(timeoutId)
                        this.serializationStatus.inProgress = false
                        reject(new Error(`Error sending data to worker: ${error.message}`))
                        worker.terminate()

                        this.eventBus.publish('model:error', {
                            error: `Error sending data to worker: ${error.message}`
                        })
                    }
                    return
                }

                // Handle progress updates
                if (event.data.status) {
                    this.eventBus.publish('model:serializing', event.data)
                    return
                }

                clearTimeout(timeoutId)

                if (event.data.error) {
                    console.error("Worker reported an error:", event.data.error)
                    this.serializationStatus.inProgress = false
                    reject(new Error(event.data.error))
                    worker.terminate()

                    this.eventBus.publish('model:error', {
                        error: event.data.error
                    })
                } else if (event.data.turtle) {
                    this.serializationStatus.inProgress = false
                    resolve(event.data.turtle)
                    worker.terminate()

                    // Report performance metrics
                    if (event.data.performance) {
                        this.eventBus.publish('model:serialized', {
                            performance: event.data.performance,
                            completed: new Date().toISOString()
                        })
                    }
                }
            }

            // Handle worker errors
            worker.onerror = (error) => {
                clearTimeout(timeoutId)
                console.error("Worker error:", error)
                this.serializationStatus.inProgress = false
                reject(new Error(`Worker error: ${error.message}`))
                worker.terminate()

                this.eventBus.publish('model:error', {
                    error: `Worker error: ${error.message}`
                })
            }
        })
    }

    getRDFDataset() {
        return this.rdfDataset
    }
}
export default TrestleRDFModel