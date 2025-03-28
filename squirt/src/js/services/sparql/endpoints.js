import { state } from '../../core/state.js';
import { namespaces } from '../../utils/utils.js';
import { testEndpoint } from './sparql.js';
import { ErrorHandler } from '../../core/errors.js';

export class EndpointManager {
    constructor() {
        this.STORAGE_KEY = 'squirt_endpoints';
        this.statusCheckInterval = 60000; // 1 minute
    }

    async initialize() {
        try {
            // First try to load endpoints from the JSON file
            const endpointsFromFile = await this.loadFromFile();
            
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
            
            state.update('endpoints', endpoints);
            this.startStatusChecks();
        } catch (error) {
            ErrorHandler.handle(error);
            const fallback = this.getDefaultEndpoints();
            state.update('endpoints', fallback);
            this.startStatusChecks();
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

    async loadFromFile() {
        try {
            const response = await fetch('/endpoint.json');
            if (!response.ok) {
                throw new Error('Failed to load endpoints from file');
            }
            
            const endpoints = await response.json();
            
            // Map the structure to match our internal format
            return endpoints.map(endpoint => ({
                url: endpoint.url,
                label: endpoint.name,
                type: endpoint.type,
                credentials: endpoint.credentials,
                status: 'unknown'
            }));
        } catch (error) {
            console.error('Error loading endpoints from file:', error);
            throw error;
        }
    }

    getDefaultEndpoints() {
        return [
            { 
                url: 'http://localhost:3030/squirt/query',
                label: 'Local Query Endpoint',
                type: 'query',
                status: 'unknown'
            },
            {
                url: 'http://localhost:3030/squirt/update',
                label: 'Local Update Endpoint',
                type: 'update',
                status: 'unknown'
            }
        ];
    }

    startStatusChecks() {
        const checkAll = async () => {
            const endpoints = state.get('endpoints');
            
            if (!endpoints || endpoints.length === 0) return;
            
            for (const endpoint of endpoints) {
                try {
                    const status = await testEndpoint(endpoint.url, endpoint.credentials);
                    endpoint.status = status ? 'active' : 'inactive';
                    endpoint.lastChecked = new Date().toISOString();
                } catch (error) {
                    console.error(`Error checking endpoint ${endpoint.url}:`, error);
                    endpoint.status = 'inactive';
                }
            }
            
            state.update('endpoints', [...endpoints]);
            this.saveToStorage();
        };

        // Run immediately and then on interval
        checkAll();
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
        const endpoints = state.get('endpoints');
        return endpoints.find(e => e.type === type && e.status === 'active');
    }
}
