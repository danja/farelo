// Custom mode that extends Markdown
CodeMirror.defineMode("markdown-semtags", (config) => {
    const markdownMode = CodeMirror.getMode(config, "markdown");
    
    return {
        startState: () => ({
            baseState: CodeMirror.startState(markdownMode),
            inSemTag: false
        }),
        
        copyState: (state) => ({
            baseState: CodeMirror.copyState(markdownMode, state.baseState),
            inSemTag: state.inSemTag
        }),
        
        token: (stream, state) => {
            if (stream.match(/#:[a-zA-Z0-9]+\S*/)) {
                return "semtag";
            }
            return markdownMode.token(stream, state.baseState);
        }
    };
});

class Editor {
    constructor(elementId, otherPaneId) {
        this.editor = CodeMirror.fromTextArea(document.getElementById(elementId), {
            mode: "markdown-semtags",
            lineNumbers: true,
            lineWrapping: true,
            theme: "default"
        });
        
        this.otherPaneId = otherPaneId;
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.editor.getWrapperElement().addEventListener('dblclick', (e) => {
            const pos = this.editor.coordsChar({ left: e.clientX, top: e.clientY });
            const line = this.editor.getLine(pos.line);
            const match = line.match(/#:[a-zA-Z0-9]+\S*/);
            
            if (match) {
                const tag = match[0].substring(2);
                this.loadContent(tag);
            }
        });
        
        const saveBtn = this.editor.getWrapperElement()
            .parentElement.querySelector('.save-btn');
        saveBtn.addEventListener('click', () => this.saveContent());
    }
    
    async loadContent(tag) {
        try {
            const response = await fetch(`http://localhost:4200/semtags/${tag}`);
            if (!response.ok) throw new Error('Failed to load content');
            
            const content = await response.text();
            const otherEditor = document.getElementById(this.otherPaneId)
                .nextSibling.CodeMirror;
            otherEditor.setValue(content);
            
            const titleSpan = otherEditor.getWrapperElement()
                .parentElement.querySelector('.document-title');
            titleSpan.textContent = tag;
        } catch (error) {
            console.error('Error loading content:', error);
        }
    }
    
    async saveContent() {
        const content = this.editor.getValue();
        const filename = this.editor.getWrapperElement()
            .parentElement.querySelector('.document-title').textContent;
            
        try {
            const response = await fetch('http://localhost:4200/store', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    filename,
                    content
                })
            });
            
            if (!response.ok) throw new Error('Failed to save content');
        } catch (error) {
            console.error('Error saving content:', error);
        }
    }
}

// Initialize both editors
const editor1 = new Editor('editor1', 'editor2');
const editor2 = new Editor('editor2', 'editor1');