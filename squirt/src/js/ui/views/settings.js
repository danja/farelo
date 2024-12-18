import rdf from 'rdf-ext';
import { namespaces } from '../../utils.js';
import { showSuccess, showError } from './notification.js';

export class SettingsManager {
    constructor() {
        this.dataset = rdf.dataset();
        this.STORAGE_KEY = 'squirt_settings';
        this.DEFAULT_ENDPOINTS = [
            { url: 'http://localhost:3030/squirt/sparql', label: 'Local Query Endpoint' },
            { url: 'http://localhost:3030/squirt/update', label: 'Local Update Endpoint' }
        ];
        this.statusCheckInterval = 60000;
    }

    async initialize() {
        await this.loadFromStorage();
        this.renderEndpoints();
        this.setupEventListeners();
    }

    async saveToStorage() {
        try {
            const quads = [...this.dataset];
            const serialized = quads.map(quad => ({
                subject: quad.subject.value,
                predicate: quad.predicate.value,
                object: quad.object.value,
                graph: quad.graph.value
            }));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    async loadFromStorage() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) {
            this.DEFAULT_ENDPOINTS.forEach(({ url, label }) => this.addEndpoint(url, label));
            return;
        }
        try {
            const serialized = JSON.parse(stored);
            this.dataset = rdf.dataset(serialized.map(quad =>
                rdf.quad(
                    rdf.namedNode(quad.subject),
                    rdf.namedNode(quad.predicate),
                    quad.object.startsWith('http') ? rdf.namedNode(quad.object) : rdf.literal(quad.object)
                )
            ));
        } catch (error) {
            console.error('Error loading settings:', error);
            this.DEFAULT_ENDPOINTS.forEach(({ url, label }) => this.addEndpoint(url, label));
        }
    }

    async checkEndpointStatus(url) {
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

    async updateEndpointStatus(url) {
        const statusEl = document.querySelector(`[data-url="${url}"] .endpoint-status`);
        if (statusEl) {
            statusEl.className = 'endpoint-status checking';
        }

        const isActive = await this.checkEndpointStatus(url);
        const endpoint = rdf.namedNode(url);
        const statusPred = rdf.namedNode(`${namespaces.squirt}status`);
        const checkedPred = rdf.namedNode(`${namespaces.squirt}lastChecked`);
        const timestamp = new Date().toISOString();

        this.dataset.deleteMatches(endpoint, statusPred);
        this.dataset.deleteMatches(endpoint, checkedPred);
        this.dataset.add(rdf.quad(endpoint, statusPred, rdf.literal(isActive ? 'active' : 'inactive')));
        this.dataset.add(rdf.quad(endpoint, checkedPred, rdf.literal(timestamp)));

        if (statusEl) {
            statusEl.className = `endpoint-status ${isActive ? 'active' : 'inactive'}`;
            statusEl.title = `Status: ${isActive ? 'Active' : 'Inactive'}\nLast checked: ${new Date(timestamp).toLocaleString()}`;
        }
    }

    startStatusChecks() {
        this.getEndpoints().forEach(({ url }) => this.updateEndpointStatus(url));
        setInterval(() => {
            this.getEndpoints().forEach(({ url }) => this.updateEndpointStatus(url));
        }, this.statusCheckInterval);
    }

    addEndpoint(url, label) {
        const endpoint = rdf.namedNode(url);
        const type = rdf.namedNode(`${namespaces.rdf}type`);
        const endpointClass = rdf.namedNode(`${namespaces.squirt}SparqlEndpoint`);
        const rdfsLabel = rdf.namedNode(`${namespaces.rdfs}label`);

        this.dataset.add(rdf.quad(endpoint, type, endpointClass));
        this.dataset.add(rdf.quad(endpoint, rdfsLabel, rdf.literal(label || url)));
        this.saveToStorage();
        this.renderEndpoints();
    }

    removeEndpoint(url) {
        const endpoint = rdf.namedNode(url);
        this.dataset.deleteMatches(endpoint);
        this.saveToStorage();
        this.renderEndpoints();
    }

    editEndpoint(url, newLabel) {
        const endpoint = rdf.namedNode(url);
        const rdfsLabel = rdf.namedNode(`${namespaces.rdfs}label`);

        this.dataset.deleteMatches(endpoint, rdfsLabel);
        this.dataset.add(rdf.quad(endpoint, rdfsLabel, rdf.literal(newLabel)));
        this.saveToStorage();
        this.renderEndpoints();
    }

    getEndpoints() {
        const endpoints = [];
        const endpointClass = rdf.namedNode(`${namespaces.squirt}SparqlEndpoint`);
        const rdfsLabel = rdf.namedNode(`${namespaces.rdfs}label`);

        const matches = [...this.dataset].filter(quad =>
            quad.predicate.value === `${namespaces.rdf}type` &&
            quad.object.equals(endpointClass)
        );

        for (const quad of matches) {
            const url = quad.subject.value;
            const labelQuad = [...this.dataset].find(q =>
                q.subject.equals(quad.subject) &&
                q.predicate.equals(rdfsLabel)
            );
            endpoints.push({
                url,
                label: labelQuad ? labelQuad.object.value : url
            });
        }
        return endpoints;
    }

    renderEndpoints() {
        const container = document.getElementById('endpoints-list');
        if (!container) return;

        container.innerHTML = '';
        this.getEndpoints().forEach(({ url, label }) => {
            const div = document.createElement('div');
            div.className = 'endpoint-item';
            div.dataset.url = url;
            div.innerHTML = `
                <div class="endpoint-info">
                    <div class="endpoint-header">
                        <strong class="endpoint-label" contenteditable="true">${label}</strong>
                        <div class="endpoint-status" title="Checking status..."></div>
                    </div>
                    <div class="endpoint-url">${url}</div>
                </div>
                <div class="endpoint-actions">
                    <button type="button" class="check-endpoint">Check</button>
                    <button type="button" class="save-endpoint hidden">Save</button>
                    <button type="button" class="remove-endpoint">Remove</button>
                </div>
            `;

            const labelEl = div.querySelector('.endpoint-label');
            const saveBtn = div.querySelector('.save-endpoint');
            const checkBtn = div.querySelector('.check-endpoint');

            labelEl.addEventListener('focus', () => {
                saveBtn.classList.remove('hidden');
            });

            labelEl.addEventListener('blur', () => {
                if (!labelEl.textContent.trim()) {
                    labelEl.textContent = label;
                }
            });

            saveBtn.addEventListener('click', () => {
                const newLabel = labelEl.textContent.trim();
                this.editEndpoint(url, newLabel);
                showSuccess('Endpoint updated');
            });

            checkBtn.addEventListener('click', async () => {
                checkBtn.disabled = true;
                await this.updateEndpointStatus(url);
                checkBtn.disabled = false;
            });

            div.querySelector('.remove-endpoint').addEventListener('click', () => {
                this.removeEndpoint(url);
            });

            container.appendChild(div);
            this.updateEndpointStatus(url);
        });
    }

    setupEventListeners() {
        const form = document.getElementById('endpoint-form');
        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const url = form.querySelector('#endpoint-url').value;
                const label = form.querySelector('#endpoint-label').value;
                this.addEndpoint(url, label);
                form.reset();
            });
        }
    }
}