import { getDb } from '../db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();

  try {
    // GET - Fetch all leads
    if (req.method === 'GET') {
      const leads = await sql`
        SELECT
          id,
          contact_name as "contactName",
          store_name as "storeName",
          email,
          phone,
          zip_code as "zipCode",
          city,
          state,
          interests,
          temperature,
          notes,
          created_by as "createdBy",
          created_at as "timestamp",
          updated_at as "updatedAt"
        FROM leads
        ORDER BY created_at DESC
      `;
      return res.status(200).json(leads);
    }

    // POST - Create new lead
    if (req.method === 'POST') {
      const { contactName, storeName, email, phone, zipCode, city, state, interests, temperature, notes, createdBy } = req.body;

      const result = await sql`
        INSERT INTO leads (contact_name, store_name, email, phone, zip_code, city, state, interests, temperature, notes, created_by)
        VALUES (${contactName}, ${storeName}, ${email || null}, ${phone || null}, ${zipCode || null}, ${city || null}, ${state || null}, ${interests || []}, ${temperature}, ${notes || null}, ${createdBy || null})
        RETURNING
          id,
          contact_name as "contactName",
          store_name as "storeName",
          email,
          phone,
          zip_code as "zipCode",
          city,
          state,
          interests,
          temperature,
          notes,
          created_by as "createdBy",
          created_at as "timestamp"
      `;
      return res.status(201).json(result[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
