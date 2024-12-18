import { state } from '../../core/state.js';

export class EndpointsList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupListeners();
        state.subscribe('endpoints', () => this.render());
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .endpoint-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 1rem;
                    border-bottom: 1px solid #eee;
                }
                .endpoint-status {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 0.5rem;
                }
                .endpoint-status.active {
                    background: var(--success-color);
                }
                .endpoint-status.inactive {
                    background: var(--error-color);
                }
                .endpoint-actions {
                    display: flex;
                    gap: 0.5rem;
                }
            </style>
            <div class="endpoints-container">
                ${this.renderEndpoints()}
            </div>
        `;
    }

    renderEndpoints() {
        return state.get('endpoints')
            .map(endpoint => `
                <div class="endpoint-item" data-url="${endpoint.url}">
                    <div class="endpoint-info">
                        <div class="endpoint-header">
                            <div class="endpoint-status ${endpoint.status || 'inactive'}"></div>
                            <strong class="endpoint-label" contenteditable="true">${endpoint.label}</strong>
                        </div>
                        <div class="endpoint-url">${endpoint.url}</div>
                    </div>
                    <div class="endpoint-actions">
                        <button class="check-endpoint">Check</button>
                        <button class="remove-endpoint">Remove</button>
                    </div>
                </div>
            `).join('');
    }

    setupListeners() {
        this.shadowRoot.addEventListener('click', e => {
            const endpoint = e.target.closest('.endpoint-item')?.dataset.url;
            if (!endpoint) return;

            if (e.target.matches('.check-endpoint')) {
                this.dispatchEvent(new CustomEvent('check-endpoint', { 
                    detail: { url: endpoint }
                }));
            } else if (e.target.matches('.remove-endpoint')) {
                this.dispatchEvent(new CustomEvent('remove-endpoint', {
                    detail: { url: endpoint }
                }));
            }
        });

        this.shadowRoot.addEventListener('blur', e => {
            if (e.target.matches('.endpoint-label')) {
                const endpoint = e.target.closest('.endpoint-item').dataset.url;
                this.dispatchEvent(new CustomEvent('update-endpoint', {
                    detail: { 
                        url: endpoint,
                        updates: { label: e.target.textContent }
                    }
                }));
            }
        }, true);
    }
}

customElements.define('endpoints-list', EndpointsList);
