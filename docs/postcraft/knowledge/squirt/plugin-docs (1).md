# Squirt Plugin System Documentation

## Overview

The Squirt application now implements a plugin-based architecture with standardized lifecycle management. This allows for better code organization, improved maintainability, and the ability to add new features without modifying core code.

## Architecture

The plugin system consists of:

1. **Plugin Base Class**: Provides standard lifecycle methods and utilities
2. **Plugin Manager**: Handles registration, activation and coordination of plugins
3. **Plugin Implementations**: Individual feature implementations
4. **Plugin Containers**: DOM elements that host plugin content

## Plugin Lifecycle

Each plugin follows a standard lifecycle:

```
+---------------+     +---------------+     +---------------+     +---------------+
| initialize()  | --> |    mount()    | --> |   unmount()   | --> |   destroy()   |
+---------------+     +---------------+     +---------------+     +---------------+
    Load deps           Render to DOM         Remove from DOM       Clean up resources 
```

## Current Plugins

### Wiki Plugin

- Provides markdown editing capabilities
- Features live preview and formatting toolbar
- Saves content to RDF data model
- Displays list of entries with edit/view/delete actions

### YASGUI Plugin

- SPARQL query editor interface
- Connects to configured SPARQL endpoints
- Supports query history and results visualization
- Handles authentication and endpoint status changes

## Adding New Plugins

### 1. Create a new plugin class

Create a new file in `src/js/plugins/` that extends the `PluginBase` class:

```javascript
// src/js/plugins/my-new-plugin.js
import { PluginBase } from '../core/plugin-base.js';

export class MyNewPlugin extends PluginBase {
  constructor(id = 'my-new-plugin', options = {}) {
    super(id, {
      // Default options
      ...options
    });
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load resources, prepare state, etc.
      await super.initialize();
    } catch (error) {
      console.error('Error initializing plugin:', error);
      throw error;
    }
  }
  
  async mount(container) {
    await super.mount(container);
    
    // Set up the DOM, create UI elements, etc.
    container.innerHTML = '<div>My Plugin Content</div>';
    
    // Add event listeners
    this.setupEventListeners();
  }
  
  async unmount() {
    if (!this.isMounted) return;
    
    // Clean up UI elements
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    await super.unmount();
  }
  
  async destroy() {
    await this.unmount();
    await super.destroy();
  }
  
  // Plugin-specific methods
  setupEventListeners() {
    // Add event listeners that will be automatically cleaned up
    this.addEventListener(window, 'resize', this.handleResize.bind(this));
  }
  
  handleResize() {
    // Handle window resize events
  }
}
```

### 2. Export from index file

Add your plugin to the `src/js/plugins/index.js` file:

```javascript
import { YasguiPlugin } from './yasgui-plugin.js';
import { WikiPlugin } from './wiki-plugin.js';
import { MyNewPlugin } from './my-new-plugin.js';

export {
  YasguiPlugin,
  WikiPlugin,
  MyNewPlugin
};
```

### 3. Register the plugin in app.js

Register your plugin in the `initializePlugins()` function in `src/js/app.js`:

```javascript
async function initializePlugins() {
  try {
    console.log('Initializing plugins...');
    
    // Register YASGUI plugin
    const yasguiPlugin = new YasguiPlugin();
    pluginManager.register(VIEWS.YASGUI, yasguiPlugin);
    
    // Register Wiki plugin
    const wikiPlugin = new WikiPlugin();
    pluginManager.register(VIEWS.WIKI, wikiPlugin);
    
    // Register your new plugin
    const myNewPlugin = new MyNewPlugin();
    pluginManager.register(VIEWS.YOUR_VIEW, myNewPlugin);
    
    // Initialize all plugins
    await pluginManager.initializeAll();
    
    console.log('Plugins initialized successfully');
  } catch (error) {
    console.error('Error initializing plugins:', error);
    ErrorHandler.handle(error);
  }
}
```

### 4. Add CSS for your plugin

Add styles for your plugin in `src/css/plugin-styles.css`.

## Plugin Manager API

### Registration

```javascript
// Register a plugin with a specific view
pluginManager.register(viewId, pluginInstance, options);
```

### Container Management

```javascript
// Create a container for a plugin
const container = pluginManager.createContainer(viewId, pluginId, containerId);
```

### Plugin Lifecycle

```javascript
// Initialize all plugins
await pluginManager.initializeAll();

// Initialize a specific plugin
await pluginManager.initializePlugin(pluginId);

// Activate plugins for a view
await pluginManager.activatePluginsForView(viewId);

// Activate a specific plugin
await pluginManager.activatePlugin(pluginId);

// Deactivate a specific plugin
await pluginManager.deactivatePlugin(pluginId);

// Deactivate plugins not in current view
await pluginManager.deactivatePluginsNotInView(currentViewId);

// Get a plugin instance
const plugin = pluginManager.getPlugin(pluginId);
```

## Best Practices

1. **Lazy Loading**: Load heavy resources only when needed
2. **Event Listeners**: Use `addEventListener` from PluginBase for automatic cleanup
3. **Error Handling**: Catch and report errors appropriately
4. **Modular Design**: Keep plugins focused on a single responsibility
5. **State Management**: Use state manager for sharing data between plugins

## Debugging

Common issues and solutions:

1. **Plugin not showing**: Check that container exists and plugin is properly registered
2. **Resources not loading**: Check network tab and console for errors
3. **Events not firing**: Verify event names and registration
4. **Plugin conflicts**: Check for duplicate IDs or CSS selectors

## Future Enhancements

1. Plugin communication system
2. Plugin configuration UI
3. Dynamic plugin loading from external sources
4. Plugin state persistence
5. Plugin performance monitoring