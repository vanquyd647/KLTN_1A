require('dotenv').config();
const app = require('./src/app');

const HOST = '0.0.0.0';
const PORT = 5551; // Thay đổi port thành 5551 để khớp với ngrok

// Start server
app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
