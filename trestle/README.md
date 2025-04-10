# Trellis - Modern Hierarchical Todo List

Trellis is a web-based hierarchical todo list application with RDF/SPARQL backend support. It allows you to create, organize, and manage nested tasks with rich text descriptions using markdown.

## Features

- **Hierarchical Structure**: Organize tasks in a tree-like structure with unlimited nesting
- **Drag and Drop**: Easily reorganize tasks by dragging and dropping
- **Keyboard Navigation**: Navigate and edit using keyboard shortcuts
- **Markdown Support**: Write rich task descriptions using markdown
- **SPARQL Backend**: Store your data in a standard RDF triplestore
- **Card View**: View and edit detailed information for each task
- **Responsive Design**: Works on both desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 16 or later
- A SPARQL endpoint (like Apache Jena Fuseki) for data storage

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/trellis.git
   cd trellis
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the application:

   - Edit `js/config.js` to set your SPARQL endpoint URL and other preferences

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Usage

### Keyboard Shortcuts

- **Enter**: Create a new sibling item
- **Tab**: Indent (make a child of previous item)
- **Shift+Tab**: Outdent (move to parent level)
- **Up/Down**: Navigate through items
- **Click** on an item to select it
- **Double-click** on an item to edit it

### Card View

Click the card icon (📄) next to any item to open its detail card. Here you can add and edit markdown descriptions.

### Drag and Drop

- Drag items using the handle (●) to reposition them
- Drop between items to place as a sibling
- Hold over an item to make the dragged item a child

## Data Model

Trellis uses RDF to represent the data structure with the following predicates:

- `dc:title`: Item title
- `dc:created`: Creation timestamp
- `dc:description`: Markdown description
- `ts:index`: Position in parent's children list
- `ts:parent`: Reference to parent node

## Development

### Project Structure

- `js/model/`: Data model and SPARQL interaction
- `js/view/`: UI rendering and event handling
- `js/controller/`: Application logic
- `js/utils/`: Utility functions and helpers

### Running Tests

```bash
npm test
```

### Generating Documentation

```bash
npm run docs
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original Trellis concept by Danny Ayers
- Inspired by [Workflowy](https://workflowy.com)
