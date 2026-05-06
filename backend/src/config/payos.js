const { PayOS } = require('@payos/node');
require('dotenv').config();

if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
    console.error('[PayOS Config] MISSING PAYOS ENVIRONMENT VARIABLES!');
}

const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

module.exports = payos;
