// src/js/main.js
import { TrestleModel } from './model/TrestleModel.js'
import { TrestleView } from './view/TrestleView.js'
import { TrestleController } from './controller/TrestleController.js'
import { Config } from './config.js'
import { EventBus } from './utils/EventBus.js'
import TrestleRDFModel from './model/TrestleRDFModel.js'
import { AsyncOperations } from './utils/AsyncOperations.js'

document.addEventListener('DOMContentLoaded', async () => {
    console.time('app-initialization')

    // Create UI status indicator
    const statusElement = document.createElement('div')
    statusElement.id = 'status-indicator'
    statusElement.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.7); color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; z-index: 9999; transition: opacity 0.3s; opacity: 0;'
    document.body.appendChild(statusElement)

    // Status notification function
    const showStatus = (message, duration = 3000) => {
        statusElement.textContent = message
        statusElement.style.opacity = '1'

        if (duration > 0) {
            setTimeout(() => {
                statusElement.style.opacity = '0'
            }, duration)
        }
    }

    // Initialize components
    const eventBus = new EventBus()

    // Subscribe to status events
    eventBus.subscribe('model:loading', (data) => {
        showStatus(`Loading data...`, 0)
    })

    eventBus.subscribe('model:loaded', (data) => {
        showStatus(`Loaded ${data.nodes?.length || 0} nodes`)
        console.timeEnd('data-loading')
    })

    eventBus.subscribe('model:saving', (data) => {
        showStatus(data.message, 0)
    })

    eventBus.subscribe('model:saved', (data) => {
        showStatus(data.message)
    })

    eventBus.subscribe('model:serializing', (data) => {
        if (data.status === 'started') {
            showStatus(`Preparing to serialize ${data.dataSize} bytes...`, 0)
        } else if (data.status === 'parsing') {
            showStatus(`Parsing chunk ${data.currentChunk}/${data.totalChunks} (${data.progress}%)...`, 0)
        } else if (data.status === 'serializing') {
            showStatus(`Processed ${data.quadCount} triples, now serializing...`, 0)
        } else if (data.progress) {
            showStatus(`Serializing: ${data.progress}% complete...`, 0)
        } else if (data.quadCount) {
            showStatus(`Processing ${data.quadCount} quads...`, 0)
        }
    })

    eventBus.subscribe('model:serialized', (data) => {
        if (data.performance) {
            showStatus(`Serialized ${data.performance.quadCount} quads in ${Math.round(data.performance.timeMs / 1000)}s`)
        } else {
            showStatus(`Serialization complete`)
        }
    })

    eventBus.subscribe('model:error', (data) => {
        showStatus(`Error: ${data.message || data.error}`, 5000)
        console.error('Model error:', data.error || data.message)
    })

    // Initialize model with performance tracking
    console.time('data-loading')
    eventBus.publish('model:loading', {})

    const model = new TrestleRDFModel(Config.SPARQL_ENDPOINT, Config.BASE_URI, eventBus)
    const view = new TrestleView(document.getElementById('trestle-root'), eventBus)
    const controller = new TrestleController(model, view, eventBus)

    // Initialize model in the background with debounce to avoid UI blocking
    AsyncOperations.deferOperation(async () => {
        try {
            await controller.initialize()
        } catch (error) {
            console.error('Initialization error:', error)
            showStatus('Failed to initialize application. See console for details.', 5000)
        }
    })

    // Performance monitoring for debug mode
    if (window.location.search.includes('debug=1')) {
        const perfObserver = setupPerformanceMonitoring()
        window._debugInfo = {
            getModelStats: () => ({
                nodes: model.nodes.size,
                datasetSize: model.getRDFDataset().size,
                serializationStatus: model.serializationStatus
            }),
            perfEntries: () => Array.from(perfObserver.takeRecords())
        }
        console.log('Debug mode enabled. Access stats with window._debugInfo.getModelStats()')
    }

    // Set up UI listeners
    setupUIListeners(controller, model, eventBus)

    console.timeEnd('app-initialization')
})

// Setup performance monitoring
function setupPerformanceMonitoring() {
    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            console.log(`Performance: ${entry.name} - ${Math.round(entry.duration)}ms`)
        })
    })

    observer.observe({ entryTypes: ['measure'] })
    return observer
}

// Set up UI event listeners with debouncing
function setupUIListeners(controller, model, eventBus) {
    const saveButton = document.getElementById('saveButton')
    const addButton = document.getElementById('addButton')
    const shortcutsButton = document.getElementById('shortcutsButton')
    const debugButton = document.getElementById('debugButton')
    const cardClose = document.getElementById('card-close')
    const shortcutsText = document.getElementById('shortcuts-text')
    const debugOutput = document.getElementById('debug-output')
    const debugOutputArea = document.getElementById('debug-output-area')
    const debugCloseButton = document.getElementById('debug-close')
    const hamburgerButton = document.getElementById('hamburgerButton')
    const menuBox = document.getElementById('menu-box')

    // Add debounced handlers to avoid UI blocking
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            // Track performance
            performance.mark('save-start')

            // Show saving indicator in UI
            saveButton.disabled = true
            saveButton.textContent = 'Saving...'

            try {
                await controller.saveData()
            } finally {
                saveButton.disabled = false
                saveButton.textContent = 'Save'

                // Log performance
                performance.mark('save-end')
                performance.measure('Save operation', 'save-start', 'save-end')
            }
        })
    }

    if (addButton) {
        // No need to debounce - operation is quick
        addButton.addEventListener('click', () => controller.addRootItem())
    }

    if (shortcutsButton) {
        shortcutsButton.addEventListener('click', () => {
            if (shortcutsText) {
                shortcutsText.classList.toggle('hidden')
            }
        })
    }

    if (debugButton && debugOutput && debugOutputArea && model) {
        debugButton.addEventListener('click', async () => {
            try {
                // Track performance
                performance.mark('debug-start')

                // Update UI
                debugButton.disabled = true
                debugButton.textContent = 'Loading...'
                debugOutputArea.value = 'Loading RDF data...'
                debugOutput.classList.remove('hidden')

                // Show progress status in debug output
                const updateStatus = (message) => {
                    debugOutputArea.value = message
                }

                // Subscribe to serialization events
                const statusHandler = (data) => {
                    if (data.status === 'started') {
                        updateStatus(`Starting serialization of approximately ${data.estimatedQuads} triples...`)
                    } else if (data.status === 'parsing') {
                        updateStatus(`Parsing chunk ${data.currentChunk}/${data.totalChunks} (${data.progress}%)\n` +
                            `${data.currentQuads} triples processed so far...\n` +
                            `Time elapsed: ${Math.round(data.elapsed / 1000)}s`)
                    } else if (data.status === 'serializing') {
                        updateStatus(`Parsed ${data.quadCount} triples in ${Math.round(data.parsingTime / 1000)}s\n` +
                            `Now converting to Turtle format...\n` +
                            `Total time elapsed: ${Math.round(data.elapsed / 1000)}s`)
                    } else if (data.status === 'serializing-progress') {
                        updateStatus(`Converting to Turtle format...\n` +
                            `Processed ${data.streamChunks} chunks\n` +
                            `Total time elapsed: ${Math.round(data.elapsed / 1000)}s`)
                    }
                }

                // Create a cleanup function for the event subscription
                let unsubscribe = eventBus.subscribe('model:serializing', statusHandler)

                try {
                    // Get turtle representation with timeout
                    const turtleData = await model.toTurtle()
                    console.log(turtleData) // HERE
                    debugOutputArea.value = turtleData

                    // Show performance metrics
                    const perfMark = performance.getEntriesByName('debug-end')
                    if (perfMark.length > 0) {
                        const duration = perfMark[0].duration
                        console.log(`RDF serialization took ${Math.round(duration)}ms`)
                    }
                } catch (error) {
                    console.error('Error generating or displaying Turtle:', error)
                    debugOutputArea.value = `Error generating Turtle representation:\n${error.message || error}\n\n` +
                        `This may be caused by:\n` +
                        `1. Dataset is too large for browser processing\n` +
                        `2. Browser memory limitations\n` +
                        `3. Serialization timeout\n\n` +
                        `Try reducing the size of your tree or using server-side serialization.`
                } finally {
                    // Clean up
                    if (unsubscribe) unsubscribe()

                    // Re-enable button
                    debugButton.disabled = false
                    debugButton.textContent = 'Debug'

                    // Record performance
                    performance.mark('debug-end')
                    performance.measure('Debug serialize', 'debug-start', 'debug-end')
                }
            } catch (outerError) {
                console.error('Unexpected error in debug function:', outerError)
                debugOutputArea.value = `Unexpected error: ${outerError.message || outerError}`
                debugButton.disabled = false
                debugButton.textContent = 'Debug'
            }
        })
    }

    if (debugCloseButton && debugOutput) {
        debugCloseButton.addEventListener('click', () => {
            debugOutput.classList.add('hidden')
        })
    }

    if (hamburgerButton && menuBox) {
        hamburgerButton.addEventListener('click', (event) => {
            menuBox.classList.toggle('hidden')
            event.stopPropagation()
        })
    }

    if (menuBox) {
        // Use event delegation for better performance
        const documentClickHandler = (event) => {
            if (!menuBox.classList.contains('hidden') &&
                !menuBox.contains(event.target) &&
                event.target !== hamburgerButton) {
                menuBox.classList.add('hidden')
            }
        }

        document.addEventListener('click', documentClickHandler)
    }

    if (cardClose) {
        cardClose.addEventListener('click', () => {
            const card = document.getElementById('card')
            const cardDescription = document.getElementById('card-description')

            if (card && card.dataset.nodeId) {
                // Defer update to avoid UI blocking
                AsyncOperations.deferOperation(() => {
                    controller.updateNodeDescription(card.dataset.nodeId, cardDescription.value)
                })
            }

            card.classList.add('hidden')
        })
    }

    // Add auto-save functionality if enabled
    if (Config.AUTO_SAVE) {
        console.log(`Auto-save enabled with interval: ${Config.AUTO_SAVE_INTERVAL}ms`)
        const autoSaveInterval = setInterval(async () => {
            try {
                console.log('Auto-saving...')
                await model.saveData()
            } catch (error) {
                console.error('Auto-save error:', error)
            }
        }, Config.AUTO_SAVE_INTERVAL)

        // Clean up interval when page unloads
        window.addEventListener('beforeunload', () => {
            clearInterval(autoSaveInterval)
        })
    }
}