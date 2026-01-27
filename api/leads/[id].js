import { getDb } from '../db.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const sql = getDb();

  try {
    // GET - Fetch single lead
    if (req.method === 'GET') {
      const result = await sql`
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
        WHERE id = ${id}
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.status(200).json(result[0]);
    }

    // PUT - Update lead
    if (req.method === 'PUT') {
      const { contactName, storeName, email, phone, zipCode, city, state, interests, temperature, notes } = req.body;

      const result = await sql`
        UPDATE leads
        SET
          contact_name = ${contactName},
          store_name = ${storeName},
          email = ${email || null},
          phone = ${phone || null},
          zip_code = ${zipCode || null},
          city = ${city || null},
          state = ${state || null},
          interests = ${interests || []},
          temperature = ${temperature},
          notes = ${notes || null},
          updated_at = NOW()
        WHERE id = ${id}
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
          created_at as "timestamp",
          updated_at as "updatedAt"
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.status(200).json(result[0]);
    }

    // DELETE - Delete lead
    if (req.method === 'DELETE') {
      const result = await sql`
        DELETE FROM leads WHERE id = ${id} RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error', details: error.message });
  }
}
