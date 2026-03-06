import * as mainnet from 'mainnet-js';
console.log('Mainnet keys:', Object.keys(mainnet).filter(k => k.toLowerCase().includes('hash')));
