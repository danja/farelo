// src/js/services/sparql/endpoints.js
import { state } from '../../core/state.js';
import { testEndpoint } from './sparql.js';
import { ErrorHandler } from '../../core/errors.js';

export class EndpointManager {
    constructor() {
        this.STORAGE_KEY = 'squirt_endpoints';
        this.statusCheckInterval = 60000; // 1 minute
    }

    async initialize() {
        try {
            console.log('Initializing endpoints manager...');
            
            // First try to load endpoints from the config file
            const endpointsFromFile = this.loadFromConfig();
            
            // Then try to load from localStorage (which may have user customizations)
            const storedEndpoints = this.loadFromStorage();
            
            // Merge the endpoints, giving preference to stored ones
            let endpoints = endpointsFromFile;
            
            if (storedEndpoints && storedEndpoints.length > 0) {
                // Keep existing endpoints from storage and add any new ones from file
                const storedUrls = new Set(storedEndpoints.map(e => e.url));
                const newEndpoints = endpointsFromFile.filter(e => !storedUrls.has(e.url));
                
                endpoints = [...storedEndpoints, ...newEndpoints];
            }
            
            if (!endpoints || endpoints.length === 0) {
                endpoints = this.getDefaultEndpoints();
            }
            
            console.log(`Loaded ${endpoints.length} endpoints`);
            
            // Update state with endpoints
            state.update('endpoints', endpoints);
            
            // Start status checks
            this.startStatusChecks();
            
            return endpoints;
        } catch (error) {
            console.error('Error initializing endpoints:', error);
            ErrorHandler.handle(error);
            const fallback = this.getDefaultEndpoints();
            state.update('endpoints', fallback);
            this.startStatusChecks();
            return fallback;
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading endpoints from storage:', error);
            return null;
        }
    }

    // Load endpoints from imported config
    loadFromConfig() {
        try {
            // Import config dynamically
            const config = require('../../../config.json');
            
            // If config exists and is an array, return it
            if (config && Array.isArray(config)) {
                return config.map(endpoint => ({
                    url: endpoint.url,
                    label: endpoint.name,
                    type: endpoint.type,
                    credentials: endpoint.credentials,
                    status: 'unknown'
                }));
            }
            throw new Error('Invalid config format');
        } catch (error) {
            console.error('Error loading endpoints from config:', error);
            return [];
        }
    }

    getDefaultEndpoints() {
        return [
            { 
                url: 'http://localhost:4030/semem/query',
                label: 'Local Query Endpoint',
                type: 'query',
                status: 'unknown',
                credentials: {
                    user: 'admin',
                    password: 'admin123'
                }
            },
            {
                url: 'http://localhost:4030/semem/update',
                label: 'Local Update Endpoint',
                type: 'update',
                status: 'unknown',
                credentials: {
                    user: 'admin',
                    password: 'admin123'
                }
            }
        ];
    }

    async startStatusChecks() {
        const checkAll = async () => {
            const endpoints = state.get('endpoints');
            
            if (!endpoints || endpoints.length === 0) return;
            
            console.log(`Checking ${endpoints.length} endpoints...`);
            
            for (const endpoint of endpoints) {
                try {
                    const status = await testEndpoint(endpoint.url, endpoint.credentials);
                    endpoint.status = status ? 'active' : 'inactive';
                    endpoint.lastChecked = new Date().toISOString();
                    console.log(`Endpoint ${endpoint.url} status: ${endpoint.status}`);
                } catch (error) {
                    console.error(`Error checking endpoint ${endpoint.url}:`, error);
                    endpoint.status = 'inactive';
                }
            }
            
            state.update('endpoints', [...endpoints]);
            this.saveToStorage();
        };

        // Run immediately and then on interval
        await checkAll();
        setInterval(checkAll, this.statusCheckInterval);
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state.get('endpoints')));
        } catch (error) {
            console.error('Error saving endpoints to storage:', error);
        }
    }

    addEndpoint(url, label, type = 'query', credentials = null) {
        const endpoints = state.get('endpoints') || [];
        
        // Check if endpoint with same URL already exists
        if (endpoints.some(e => e.url === url)) {
            throw new Error(`Endpoint with URL ${url} already exists`);
        }
        
        endpoints.push({ 
            url, 
            label, 
            type, 
            credentials,
            status: 'unknown', 
            lastChecked: null 
        });
        
        state.update('endpoints', endpoints);
        this.saveToStorage();
        
        // Check the status immediately
        this.checkEndpoint(url, credentials).then(status => {
            this.updateEndpoint(url, { 
                status: status ? 'active' : 'inactive',
                lastChecked: new Date().toISOString()
            });
        });
    }

    async checkEndpoint(url, credentials = null) {
        return testEndpoint(url, credentials);
    }

    removeEndpoint(url) {
        const endpoints = state.get('endpoints').filter(e => e.url !== url);
        state.update('endpoints', endpoints);
        this.saveToStorage();
    }

    updateEndpoint(url, updates) {
        const endpoints = state.get('endpoints').map(e => 
            e.url === url ? { ...e, ...updates } : e
        );
        state.update('endpoints', endpoints);
        this.saveToStorage();
    }

    getActiveEndpoint(type) {
        const endpoints = state.get('endpoints') || [];
        return endpoints.find(e => e.type === type && e.status === 'active');
    }
}

// Create and export a singleton instance
export const endpointManager = new EndpointManager();