import { state } from '../../core/state.js';
import { namespaces } from '../../utils/utils.js';

export class EndpointManager {
    constructor() {
        this.STORAGE_KEY = 'squirt_endpoints';
        this.statusCheckInterval = 60000;
    }

    async initialize() {
        await this.loadFromStorage();
        this.startStatusChecks();
    }

    async loadFromStorage() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const endpoints = stored ? JSON.parse(stored) : this.getDefaultEndpoints();
        state.update('endpoints', endpoints);
    }

    async checkEndpoint(url) {
        try {
            const response = await fetch(url, {
                method: 'OPTIONS',
                headers: { 'Accept': 'application/sparql-query' }
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    getDefaultEndpoints() {
        return [
            { 
                url: 'http://localhost:3030/squirt/sparql',
                label: 'Local Query Endpoint',
                type: 'query'
            },
            {
                url: 'http://localhost:3030/squirt/update',
                label: 'Local Update Endpoint',
                type: 'update'
            }
        ];
    }

    startStatusChecks() {
        const checkAll = () => {
            state.get('endpoints').forEach(endpoint => {
                this.checkEndpoint(endpoint.url).then(status => {
                    endpoint.status = status ? 'active' : 'inactive';
                    endpoint.lastChecked = new Date().toISOString();
                    this.saveToStorage();
                });
            });
        };

        checkAll();
        setInterval(checkAll, this.statusCheckInterval);
    }

    saveToStorage() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state.get('endpoints')));
    }

    addEndpoint(url, label, type = 'query') {
        const endpoints = state.get('endpoints');
        endpoints.push({ url, label, type });
        state.update('endpoints', endpoints);
        this.saveToStorage();
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
}
