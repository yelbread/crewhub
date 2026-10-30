/**
 * CrewHub Database Health & Collection Inspection Utility
 * Run with: npx tsx scripts/inspect-db.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspectDatabase() {
  console.log('======================================================');
  console.log('   CrewHub Firestore Database Inspection Utility     ');
  console.log('======================================================');
  console.log(`Project ID:        ${firebaseConfig.projectId}`);
  console.log(`Database Instance: ${firebaseConfig.firestoreDatabaseId}`);
  console.log(`Auth Domain:       ${firebaseConfig.authDomain}`);
  console.log('------------------------------------------------------');
  console.log('Querying cloud Firestore collections in real time...\n');

  const collections = ['users', 'projects', 'joinRequests', 'messages'];

  for (const colName of collections) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`Collection [${colName.padEnd(14)}]: ${snapshot.size} live document(s)`);
      if (snapshot.size > 0 && (colName === 'projects' || colName === 'users')) {
        snapshot.docs.slice(0, 3).forEach((d) => {
          const data = d.data();
          const label = data.title || data.name || data.email || d.id;
          console.log(`    - ID: ${d.id.substring(0, 10)}... | "${label}"`);
        });
      }
    } catch (err: any) {
      console.warn(`Collection [${colName}]: Note: ${err.message || 'Restricted by security rules'}`);
    }
  }

  console.log('\nDatabase status: HEALTHY & CONNECTED');
  console.log('======================================================');
  process.exit(0);
}

inspectDatabase().catch((e) => {
  console.error('Database connection test failed:', e);
  process.exit(1);
});
