import { initDb } from './db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await initDb();
    return res.status(200).json({ message: 'Database initialized successfully', ...result });
  } catch (error) {
    console.error('Init error:', error);
    return res.status(500).json({ error: 'Failed to initialize database', details: error.message });
  }
}
