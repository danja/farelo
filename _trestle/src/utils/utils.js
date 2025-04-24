// src/utils/utils.js

/**
 * Namespaces used throughout the application
 */
export const namespaces = {
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    dc: 'http://purl.org/dc/terms/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    squirt: 'http://purl.org/stuff/squirt#',
    ts: 'http://purl.org/stuff/trestle#'
}

/**
 * Generate a unique ID based on timestamp and random number
 * @returns {string} Generated ID
 */
export function generateID() {
    const now = new Date()
    const timestamp = formatDate(now, "yyyy-mm-dd-HH-MM-ss-l")
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${timestamp}-${random}`
}

/**
 * Generate ISO formatted date string for current time
 * @returns {string} ISO date string
 */
export function generateDate() {
    return new Date().toISOString()
}

/**
 * Generate a node ID based on content
 * @param {string} content - Content to generate ID from
 * @returns {string} Generated ID
 */
export function generateNid(content) {
    // Create a basic hash from the content
    let hash = 0
    if (content.length === 0) return 'nid-' + generateID()

    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }

    // Ensure hash is positive
    hash = Math.abs(hash)

    return 'nid-' + hash.toString(16) + '-' + Date.now().toString(36)
}

/**
 * Format a date according to a mask
 * @param {Date} date - Date to format
 * @param {string} mask - Format mask
 * @param {boolean} utc - Whether to use UTC time
 * @returns {string} Formatted date string
 */
export function formatDate(date, mask, utc = true) {
    const token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g
    const timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g
    const timezoneClip = /[^-+\dA-Z]/g

    const pad = (val, len) => {
        val = String(val)
        len = len || 2
        while (val.length < len) val = "0" + val
        return val
    }

    // Allow string format arg
    if (arguments.length === 1 && Object.prototype.toString.call(date) === "[object String]" && !/\d/.test(date)) {
        mask = date
        date = undefined
    }

    // Enforce UTC for testing
    date = date ? new Date(date) : new Date()
    if (isNaN(date)) throw SyntaxError("invalid date")

    mask = String(masks[mask] || mask || masks["default"])

    // Allow UTC format specifier
    if (mask.slice(0, 4) === "UTC:") {
        mask = mask.slice(4)
        utc = true
    }

    const _ = utc ? "getUTC" : "get"
    const d = date[_ + "Date"]()
    const D = date[_ + "Day"]()
    const m = date[_ + "Month"]()
    const y = date[_ + "FullYear"]()
    const H = date[_ + "Hours"]()
    const M = date[_ + "Minutes"]()
    const s = date[_ + "Seconds"]()
    const L = date[_ + "Milliseconds"]()
    const o = utc ? 0 : date.getTimezoneOffset()

    const flags = {
        d: d,
        dd: pad(d),
        ddd: dayNames[D],
        dddd: dayNames[D + 7],
        m: m + 1,
        mm: pad(m + 1),
        mmm: monthNames[m],
        mmmm: monthNames[m + 12],
        yy: String(y).slice(2),
        yyyy: y,
        h: H % 12 || 12,
        hh: pad(H % 12 || 12),
        H: H,
        HH: pad(H),
        M: M,
        MM: pad(M),
        s: s,
        ss: pad(s),
        l: pad(L, 3),
        L: pad(L > 99 ? Math.round(L / 10) : L),
        t: H < 12 ? "a" : "p",
        tt: H < 12 ? "am" : "pm",
        T: H < 12 ? "A" : "P",
        TT: H < 12 ? "AM" : "PM",
        Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
        o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
        S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
    }

    return mask.replace(token, function ($0) {
        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1)
    })
}

/**
 * Common date format masks
 */
const masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
}

/**
 * Day name arrays
 */
const dayNames = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

/**
 * Month name arrays
 */
const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
]

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
    if (!text) return ''

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item))
    }

    const cloned = {}
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key])
        }
    }

    return cloned
}