// src/core/errors/error-types.js

/**
 * Custom error class for RDF-related errors
 */
export class RDFError extends Error {
    /**
     * @param {string} message - Error message
     * @param {Object} details - Additional error details
     * @param {Error} details.originalError - Original error that caused this one
     * @param {Object} details.postData - Post data that caused the error
     */
    constructor(message, details = {}) {
        super(message)
        this.name = 'RDFError'
        this.details = details

        // Maintain proper stack trace in V8 engines
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RDFError)
        }
    }
}

/**
 * Custom error class for model-related errors
 */
export class ModelError extends Error {
    /**
     * @param {string} message - Error message
     * @param {Object} details - Additional error details
     */
    constructor(message, details = {}) {
        super(message)
        this.name = 'ModelError'
        this.details = details

        // Maintain proper stack trace in V8 engines
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ModelError)
        }
    }
}