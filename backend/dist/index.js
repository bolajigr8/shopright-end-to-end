import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get('/api/health', (req, res) => {
    res.send('Hello, World!');
});
// Make our app ready for deployment
// Serve admin (React/Vite) build as static assets
if (ENV.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../admin/dist')));
    app.get('/{*any}', (req, res) => {
        res.sendFile(path.join(__dirname, '../../admin/dist/index.html'), (err) => {
            if (err) {
                res.status(500).send('Error loading application');
            }
        });
    });
}
const PORT = ENV.PORT || '3000';
app.listen(PORT, () => {
    console.log(`Server is running on port ${ENV.PORT}`);
});
//# sourceMappingURL=index.js.map