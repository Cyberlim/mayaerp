import dns from 'dns/promises';

async function checkDNS() {
    const host = 'mayacollage.ktxtgpi.mongodb.net';
    const srv = '_mongodb._tcp.' + host;

    console.log(`🔍 Diagnosing DNS for: ${host}`);

    try {
        const addresses = await dns.resolveSrv(srv);
        console.log('✅ SRV Records found:', JSON.stringify(addresses, null, 2));
    } catch (err) {
        console.error('❌ SRV Lookup Failed:', err.message);
        console.log('💡 TIP: Your ISP or Firewall might be blocking SRV lookups. Try using the "Standard Connection String" from Atlas.');
    }

    try {
        const txt = await dns.resolveTxt(host);
        console.log('✅ TXT Records found:', JSON.stringify(txt, null, 2));
    } catch (err) {
        console.error('❌ TXT Lookup Failed:', err.message);
    }
}

checkDNS();
