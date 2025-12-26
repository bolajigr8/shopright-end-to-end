"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const currentDir = path_1.default.resolve();
app.get('/api/health', (req, res) => {
    res.send('Hello, World!');
});
// Make our app ready for deployment
// Serve admin (React/Vite) build as static assets
if (env_1.ENV.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(currentDir, '../admin/dist')));
    app.get('/{*any}', (req, res) => {
        res.sendFile(path_1.default.join(currentDir, '../admin', 'dist', 'index.html'));
    });
}
app.listen(env_1.ENV.PORT, () => {
    console.log(`Server is running on port ${env_1.ENV.PORT}`);
    console.log(`Dirname  ${currentDir}`);
});
//# sourceMappingURL=index.js.map