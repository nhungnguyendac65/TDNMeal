const { PayOS } = require('@payos/node');
require('dotenv').config();

if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
    console.error('[PayOS Config] THIẾU BIẾN MÔI TRƯỜNG PAYOS TRÊN RENDER!');
}

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

module.exports = payos;
