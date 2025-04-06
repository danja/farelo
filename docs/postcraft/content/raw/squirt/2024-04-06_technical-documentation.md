# Squirt Application Technical Documentation

## Architecture Overview

The application implements a plugin-based architecture with lazy-loaded components. Core features include:

- Modular system with dynamic imports for heavy components
- Centralized state management
- Event-driven communication
- Responsive UI with mobile and desktop support

## Plugin System

The plugin system manages component lifecycle:

```
initialize → mount → unmount → destroy
```

Key components:
- `plugin-manager.js`: Central registry and lifecycle controller
- `plugin-base.js`: Base class with standard lifecycle methods
- Plugin containers: DOM elements in each view that host plugin content

## Current Plugins

1. **YASGUI Plugin**: SPARQL query editor
   - Dynamically loads YASGUI library
   - Connects to configured SPARQL endpoints
   - Handles layout issues with ResizeObserver

2. **Wiki Plugin**: Markdown editor
   - Uses CodeMirror for editing
   - Saves content to RDF model
   - Provides rich editing features via toolbar

## Routing and Component Loading

- Hash-based routing triggers view changes
- Route changes dispatch events that plugins listen for
- Plugin containers are created in each view
- Plugins are loaded only when their view becomes active

## Developer Tips

1. **Adding New Plugins**:
   - Extend `PluginBase` class
   - Implement required lifecycle methods
   - Register plugin in `app.js`

2. **Debugging**:
   - Check console logs for loading sequences
   - Container IDs follow pattern: `plugin-container-${viewId}`
   - Most plugin issues relate to container visibility or timing

3. **Key Files**:
   - `src/js/core/plugin-manager.js`: Plugin registry and lifecycle
   - `src/js/plugins/`: Individual plugin implementations
   - `src/js/app.js`: Application initialization

## Next Steps

1. Implement proper plugin error boundaries
2. Add plugin configuration panel in settings
3. Add plugin communication system 
4. Create plugin state persistence
5. Implement plugin lazy-loading optimization
6. Add plugin performance monitoring

## Orphaned Files

These files can be safely deleted as they're replaced by the plugin system:
- `src/js/ui/views/yasgui-view.js`
- `src/js/ui/views/wiki-editor.js`