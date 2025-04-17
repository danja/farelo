// src/js/utils/AsyncOperations.js
/**
 * Utility class for async operations that might block the UI thread
 */
export class AsyncOperations {
    /**
     * Creates a debounced function that delays invoking the callback
     * until after `wait` milliseconds have elapsed since the last time it was invoked
     *
     * @param {Function} callback - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @param {boolean} immediate - Whether to invoke the function immediately instead of waiting
     * @returns {Function} - Debounced function
     */
    static debounce(callback, wait = 300, immediate = false) {
        let timeout

        return function (...args) {
            const context = this

            const later = function () {
                timeout = null
                if (!immediate) callback.apply(context, args)
            }

            const callNow = immediate && !timeout

            clearTimeout(timeout)
            timeout = setTimeout(later, wait)

            if (callNow) callback.apply(context, args)
        }
    }

    /**
     * Creates a throttled function that only invokes callback at most
     * once per every `limit` milliseconds
     *
     * @param {Function} callback - Function to throttle
     * @param {number} limit - Milliseconds to throttle invocations to
     * @returns {Function} - Throttled function
     */
    static throttle(callback, limit = 300) {
        let waiting = false

        return function (...args) {
            if (!waiting) {
                callback.apply(this, args)
                waiting = true
                setTimeout(() => {
                    waiting = false
                }, limit)
            }
        }
    }

    /**
     * Creates a function that will execute in chunks, yielding to the browser
     * between chunks to prevent UI blocking
     *
     * @param {Function} callback - Function to execute
     * @param {Array} items - Items to process
     * @param {number} chunkSize - Number of items to process per chunk
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Array>} - Results of processing
     */
    static async processInChunks(callback, items, chunkSize = 100, onProgress = null) {
        const results = []

        for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize)

            // Process current chunk
            for (let j = 0; j < chunk.length; j++) {
                results.push(callback(chunk[j], i + j))
            }

            // Update progress
            if (onProgress) {
                onProgress({
                    processed: i + chunk.length,
                    total: items.length,
                    percentage: Math.round(((i + chunk.length) / items.length) * 100)
                })
            }

            // Yield to UI thread
            await new Promise(resolve => setTimeout(resolve, 0))
        }

        return results
    }

    /**
     * Performs a series of async operations with progress tracking and error handling
     *
     * @param {Array<Function>} operations - Array of async functions to execute
     * @param {Object} options - Configuration options
     * @param {Function} options.onProgress - Progress callback
     * @param {Function} options.onError - Error callback
     * @returns {Promise<Array>} - Results of operations
     */
    static async executeSequential(operations, { onProgress = null, onError = null } = {}) {
        const results = []

        for (let i = 0; i < operations.length; i++) {
            try {
                const result = await operations[i]()
                results.push(result)

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: operations.length,
                        percentage: Math.round(((i + 1) / operations.length) * 100),
                        result
                    })
                }
            } catch (error) {
                if (onError) {
                    onError(error, i)
                } else {
                    console.error(`Error in operation ${i}:`, error)
                }
                results.push(null)
            }

            // Short yield to UI thread between operations
            if (i < operations.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 0))
            }
        }

        return results
    }

    /**
     * Wraps a synchronous operation in a Promise that resolves in the next tick
     * to avoid blocking the UI thread
     *
     * @param {Function} operation - Synchronous function to execute
     * @returns {Promise<any>} - Promise that resolves with the operation result
     */
    static deferOperation(operation) {
        return new Promise(resolve => {
            setTimeout(() => {
                try {
                    const result = operation()
                    resolve(result)
                } catch (error) {
                    console.error('Error in deferred operation:', error)
                    resolve(null)
                }
            }, 0)
        })
    }
}