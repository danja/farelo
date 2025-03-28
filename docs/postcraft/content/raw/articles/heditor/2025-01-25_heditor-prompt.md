# heditor Requirements

Heditor is a browser-based markdown editor with a client-server architecture.

 ## Client 

  *  two editor panes based on codemirror with standard features, syntax highlighting etc
  * Each title bar shows title and uri of the document being edited and a 'Save' button

### hypertext behaviour 

An extension to markdown syntax will provide interactions. Every occurrence of the regex "#:[a-zA-Z0-9]+\S*" will have special handling and be treated as a kind of hyperlink which will occur **across** panes. An event in one pane will cause an event in the other. It will be highlighted in color. A single mouse click will be handled normally. A double mouse click will cause the system to extract the string after the "#:" and send a http GET to the server at the URL http://localhost:4200/semtags/[string]
The response will contain a markdown payload which will be loaded into the other pane. 

## Server

A server will be based at http://localhost:4200
Http POSTs to http://localhost:4200/store will be stored on the server filesystem with a filename supplied in the payload. GETs at http://localhost:4200/semtags/[filename]
will return the named file.
Please implement, giving individual, complete artifacts for html, CSS, js, markdown etc..