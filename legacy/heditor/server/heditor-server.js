import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';

const app = express();
const PORT = 4200;
const STORAGE_DIR = 'storage';

// Ensure storage directory exists
await fs.mkdir(STORAGE_DIR, { recursive: true });

app.use(cors());
app.use(express.text());

// Serve static files
app.use(express.static('public'));

// Store markdown content
app.post('/store', async (req, res) => {
    try {
        const { filename, content } = JSON.parse(req.body);
        const sanitizedFilename = path.basename(filename);
        await fs.writeFile(
            path.join(STORAGE_DIR, sanitizedFilename),
            content
        );
        res.sendStatus(200);
    } catch (error) {
        console.error('Storage error:', error);
        res.sendStatus(500);
    }
});

// Retrieve markdown content
app.get('/semtags/:filename', async (req, res) => {
    try {
        const sanitizedFilename = path.basename(req.params.filename);
        const content = await fs.readFile(
            path.join(STORAGE_DIR, sanitizedFilename),
            'utf8'
        );
        res.type('text/plain').send(content);
    } catch (error) {
        console.error('Retrieval error:', error);
        res.sendStatus(404);
    }
});

app.listen(PORT, () => {
    console.log(`Heditor server running on http://localhost:${PORT}`);
});