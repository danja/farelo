import { TrestleModel } from './model/TrestleModel.js'
import TrestleRDFModel from './model/TrestleRDFModel.js'
import { TrestleView } from './view/TrestleView.js'
import { TrestleController } from './controller/TrestleController.js'
import { Config } from './config.js'
import { EventBus } from './utils/EventBus.js'

document.addEventListener('DOMContentLoaded', () => {
    // Create an event bus instance for communication
    const eventBus = new EventBus()

    // Create model, view, and controller instances
    // const model = new TrestleModel(Config.SPARQL_ENDPOINT, Config.BASE_URI, eventBus)
    const model = new TrestleRDFModel(Config.SPARQL_ENDPOINT, Config.BASE_URI, eventBus)
    const view = new TrestleView(document.getElementById('trestle-root'), eventBus)
    const controller = new TrestleController(model, view, eventBus)

    // Set up UI event listeners
    setupUIListeners(controller)

    // Initialize the controller
    controller.initialize()
})

/**
 * Set up event listeners for UI elements
 * @param {TrestleController} controller - The controller instance
 */
function setupUIListeners(controller) {
    const saveButton = document.getElementById('saveButton')
    const addButton = document.getElementById('addButton')
    const shortcutsButton = document.getElementById('shortcutsButton')
    const cardClose = document.getElementById('card-close')
    const shortcutsText = document.getElementById('shortcuts-text')

    // Add hamburger menu functionality
    const hamburgerButton = document.getElementById('hamburgerButton')
    const menuBox = document.getElementById('menu-box')

    // Add event listeners to buttons if they exist
    if (saveButton) {
        saveButton.addEventListener('click', () => controller.saveData())
    }

    if (addButton) {
        addButton.addEventListener('click', () => controller.addRootItem())
    }

    if (shortcutsButton) {
        shortcutsButton.addEventListener('click', () => {
            if (shortcutsText) {
                shortcutsText.classList.toggle('hidden')
            }
        })
    }

    // Hamburger menu toggle
    if (hamburgerButton && menuBox) {
        hamburgerButton.addEventListener('click', (event) => {
            menuBox.classList.toggle('hidden')
            event.stopPropagation()
        })
    }

    // Close menu when clicking outside
    if (menuBox) {
        document.addEventListener('click', (event) => {
            if (!menuBox.classList.contains('hidden') &&
                !menuBox.contains(event.target) &&
                event.target !== hamburgerButton) {
                menuBox.classList.add('hidden')
            }
        })
    }

    // Card close button event
    if (cardClose) {
        cardClose.addEventListener('click', () => {
            const card = document.getElementById('card')
            const cardDescription = document.getElementById('card-description')

            // Update node description before closing
            if (card && card.dataset.nodeId) {
                controller.updateNodeDescription(card.dataset.nodeId, cardDescription.value)
            }

            card.classList.add('hidden')
        })
    }
}