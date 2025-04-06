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
import {