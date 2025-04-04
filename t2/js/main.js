/**
 * Trellis - Main application entry point
 */
import { TrellisModel } from './model/TrellisModel.js';
import { TrellisView } from './view/TrellisView.js';
import { TrellisController } from './controller/TrellisController.js';
import { Config } from './config.js';
import { EventBus } from './utils/EventBus.js';

document.addEventListener('DOMContentLoaded', () => {
    // Create event bus for component communication
    const eventBus = new EventBus();
    
    // Initialize components
    const model = new TrellisModel(Config.SPARQL_ENDPOINT, Config.BASE_URI, eventBus);
    const view = new TrellisView(document.getElementById('trellis-root'), eventBus);
    const controller = new TrellisController(model, view, eventBus);
    
    // Set up UI event listeners
    setupUIListeners(controller);
    
    // Initialize application
    controller.initialize();
});

/**
 * Sets up global UI element event listeners
 * @param {TrellisController} controller - The application controller
 */
function setupUIListeners(controller) {
    const saveButton = document.getElementById('saveButton');
    const addButton = document.getElementById('addButton');
    const shortcutsButton = document.getElementById('shortcutsButton');
    const cardClose = document.getElementById('card-close');
    const shortcutsText = document.getElementById('shortcuts-text');
    
    // Button actions
    saveButton.addEventListener('click', () => controller.saveData());
    addButton.addEventListener('click', () => controller.addRootItem());
    shortcutsButton.addEventListener('click', () => {
        shortcutsText.classList.toggle('hidden');
    });
    
    // Card handling
    cardClose.addEventListener('click', () => {
        const card = document.getElementById('card');
        const cardDescription = document.getElementById('card-description');
        
        // Save card data before closing
        if (card.dataset.nodeId) {
            controller.updateNodeDescription(card.dataset.nodeId, cardDescription.value);
        }
        
        card.classList.add('hidden');
    });
}
