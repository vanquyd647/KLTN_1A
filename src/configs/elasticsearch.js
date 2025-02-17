const { Client } = require('@elastic/elasticsearch');

const client = new Client({
    node: 'http://localhost:9200',
    requestTimeout: 30000,
    pingTimeout: 30000,
    ssl: {
        rejectUnauthorized: false
    },
    maxRetries: 3,
    pool: {
        maxRetries: 3,
        resurrectStrategy: 'ping'
    }
});

// Export trực tiếp client thay vì object
module.exports = client;
