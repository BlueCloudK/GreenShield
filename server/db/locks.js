// SQLite transactions are serialized by the adapter; Postgres needs keyed locks.
export async function transactionLock(db, key) {
  if (db.dialect === 'postgres') await db.prepare('SELECT pg_advisory_xact_lock(hashtext(?))').get(key);
}
