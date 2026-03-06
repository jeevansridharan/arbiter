import * as libauth from '@bitauth/libauth';
console.log('Keys:', Object.keys(libauth).filter(k => k.toLowerCase().includes('sha256')));
console.log('sha256 type:', typeof libauth.sha256);
