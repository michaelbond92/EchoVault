/**
 * EchoVault Embedding Backfill Script
 * 
 * This script backfills embeddings for existing journal entries that don't have them.
 * It uses Firebase Admin SDK to access all users' entries securely.
 * 
 * Prerequisites:
 * 1. Node.js 18+ installed
 * 2. Firebase Admin SDK service account key (download from Firebase Console)
 * 3. Gemini API key for generating embeddings
 * 
 * Setup:
 * 1. npm install firebase-admin node-fetch
 * 2. Set environment variables:
 *    - GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
 *    - GEMINI_API_KEY=your_gemini_api_key
 * 3. Run: node scripts/backfill-embeddings.js
 * 
 * Security Notes:
 * - This script runs server-side with Admin SDK, bypassing Firestore security rules
 * - Keep your service account key and Gemini API key secure
 * - Never commit credentials to source control
 * - The script only reads/writes to the entries collection
 */

const admin = require('firebase-admin');

const APP_COLLECTION_ID = 'echo-vault-v5-fresh';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EXPECTED_EMBEDDING_DIM = 768;

const MAX_CONCURRENT = 3;
const BATCH_SIZE = 50;
const RETRY_DELAYS = [1000, 2000, 4000];

let processedCount = 0;
let skippedCount = 0;
let errorCount = 0;
let totalEntries = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateEmbedding(text, retryCount = 0) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: text }] } })
      }
    );

    if (res.status === 429) {
      if (retryCount < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[retryCount];
        console.log(`  Rate limited, waiting ${delay}ms before retry...`);
        await sleep(delay);
        return generateEmbedding(text, retryCount + 1);
      }
      console.error('  Rate limit exceeded after all retries');
      return null;
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`  Embedding API error: ${res.status}`, errorData);

      if (retryCount < RETRY_DELAYS.length && res.status >= 500) {
        const delay = RETRY_DELAYS[retryCount];
        console.log(`  Server error, waiting ${delay}ms before retry...`);
        await sleep(delay);
        return generateEmbedding(text, retryCount + 1);
      }

      return null;
    }

    const data = await res.json();
    const embedding = data.embedding?.values || null;

    if (!embedding) {
      console.error('  Embedding API returned no values');
      return null;
    }

    if (embedding.length !== EXPECTED_EMBEDDING_DIM) {
      console.warn(`  Unexpected embedding dimension: ${embedding.length} (expected ${EXPECTED_EMBEDDING_DIM})`);
    }

    return embedding;
  } catch (e) {
    console.error('  Embedding exception:', e.message);

    if (retryCount < RETRY_DELAYS.length) {
      const delay = RETRY_DELAYS[retryCount];
      console.log(`  Exception occurred, waiting ${delay}ms before retry...`);
      await sleep(delay);
      return generateEmbedding(text, retryCount + 1);
    }

    return null;
  }
}

function isValidEmbedding(embedding) {
  return (
    Array.isArray(embedding) &&
    embedding.length === EXPECTED_EMBEDDING_DIM &&
    embedding.every(v => typeof v === 'number' && !isNaN(v))
  );
}

async function processEntry(entryRef, data) {
  const entryId = entryRef.id;

  if (isValidEmbedding(data.embedding)) {
    skippedCount++;
    return { status: 'skipped', reason: 'already has valid embedding' };
  }

  const text = typeof data.text === 'string' ? data.text.trim() : '';
  if (!text) {
    skippedCount++;
    return { status: 'skipped', reason: 'no text content' };
  }

  console.log(`  Processing entry ${entryId} (${text.substring(0, 50)}...)`);

  const embedding = await generateEmbedding(text);

  if (!embedding) {
    errorCount++;
    return { status: 'error', reason: 'failed to generate embedding' };
  }

  try {
    await entryRef.update({ embedding });
    processedCount++;
    return { status: 'success' };
  } catch (e) {
    errorCount++;
    console.error(`  Failed to update entry ${entryId}:`, e.message);
    return { status: 'error', reason: 'failed to update document' };
  }
}

async function processEntriesBatch(entries) {
  const results = [];

  for (let i = 0; i < entries.length; i += MAX_CONCURRENT) {
    const batch = entries.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(({ ref, data }) => processEntry(ref, data))
    );
    results.push(...batchResults);

    if (i + MAX_CONCURRENT < entries.length) {
      await sleep(100);
    }
  }

  return results;
}

async function backfillUser(db, userId) {
  console.log(`\nProcessing user: ${userId}`);

  const entriesRef = db
    .collection('artifacts')
    .doc(APP_COLLECTION_ID)
    .collection('users')
    .doc(userId)
    .collection('entries');

  let lastDoc = null;
  let userProcessed = 0;
  let userSkipped = 0;
  let userErrors = 0;

  while (true) {
    let query = entriesRef.orderBy('createdAt').limit(BATCH_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    totalEntries += snap.docs.length;

    const entries = snap.docs.map(doc => ({
      ref: doc.ref,
      data: doc.data()
    }));

    const results = await processEntriesBatch(entries);

    results.forEach(r => {
      if (r.status === 'success') userProcessed++;
      else if (r.status === 'skipped') userSkipped++;
      else userErrors++;
    });

    lastDoc = snap.docs[snap.docs.length - 1];

    console.log(`  Batch complete: ${userProcessed} processed, ${userSkipped} skipped, ${userErrors} errors`);
  }

  console.log(`User ${userId} complete: ${userProcessed} processed, ${userSkipped} skipped, ${userErrors} errors`);
}

async function getAllUserIds(db) {
  const usersRef = db
    .collection('artifacts')
    .doc(APP_COLLECTION_ID)
    .collection('users');

  const snap = await usersRef.listDocuments();
  return snap.map(doc => doc.id);
}

async function main() {
  console.log('='.repeat(60));
  console.log('EchoVault Embedding Backfill Script');
  console.log('='.repeat(60));

  if (!GEMINI_API_KEY) {
    console.error('\nError: GEMINI_API_KEY environment variable is not set');
    console.error('Please set it before running this script:');
    console.error('  export GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('\nError: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
    console.error('Please download your Firebase service account key and set:');
    console.error('  export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json');
    process.exit(1);
  }

  console.log('\nInitializing Firebase Admin SDK...');

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK:', e.message);
    process.exit(1);
  }

  const db = admin.firestore();

  console.log('Fetching user list...');
  const userIds = await getAllUserIds(db);
  console.log(`Found ${userIds.length} users`);

  if (userIds.length === 0) {
    console.log('\nNo users found. Nothing to process.');
    process.exit(0);
  }

  const startTime = Date.now();

  for (const userId of userIds) {
    await backfillUser(db, userId);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('Backfill Complete');
  console.log('='.repeat(60));
  console.log(`Total entries scanned: ${totalEntries}`);
  console.log(`Embeddings generated:  ${processedCount}`);
  console.log(`Already had embedding: ${skippedCount}`);
  console.log(`Errors:                ${errorCount}`);
  console.log(`Duration:              ${duration}s`);
  console.log('='.repeat(60));

  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
