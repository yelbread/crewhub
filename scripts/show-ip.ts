/**
 * CrewHub Network Sharing Helper
 * Finds your local Wi-Fi / LAN IP address so other computers can connect
 * Run with: npm run ip
 */

import os from 'os';

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;

    for (const net of netList) {
      // Skip internal loopback (127.0.0.1) and non-IPv4
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  return addresses;
}

const ips = getNetworkAddresses();

console.log('===============================================================');
console.log('       CrewHub Multi-Device & Network Connection Guide         ');
console.log('===============================================================');
console.log('\n1. FOR COMPUTERS ON THE SAME WI-FI / NETWORK:');
if (ips.length > 0) {
  ips.forEach((ip) => {
    console.log(`   ➜ http://${ip}:3000/`);
  });
  console.log('\n   (Copy and paste the URL above into the other computer\'s browser)');
} else {
  console.log('   ➜ Check your Wi-Fi connection or use the Public Cloud Link below.');
}

console.log('\n2. FOR COMPUTERS ANYWHERE ON THE INTERNET (CLOUD LINK):');
console.log('   ➜ https://ais-pre-pcs4pzjeoykxxn4oa2ladm-153429558450.asia-southeast1.run.app');
console.log('   (Works instantly on any laptop, phone, or faculty computer worldwide)');

console.log('\n3. USING VS CODE BUILT-IN PORT FORWARDING:');
console.log('   ➜ Open VS Code -> Click the "Ports" tab in the bottom panel');
console.log('   ➜ Right-click Port 3000 -> Set "Port Visibility" to "Public"');
console.log('   ➜ Copy the generated HTTPS forwarding link and share it!');
console.log('===============================================================\n');
