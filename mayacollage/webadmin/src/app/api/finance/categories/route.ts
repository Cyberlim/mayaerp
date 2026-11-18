import { NextResponse } from 'next/server';
import { query as pgQuery } from '@/lib/postgres';
import { mapPgCategory, mapPgCategories } from '@/lib/financeMapper';
import { getCache, setCache, delCache, DEFAULT_CACHE_TTL } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'fee:categories';

export async function GET() {
  try {
    // 1. Try Redis cache (30 min TTL)
    const cachedCategories = await getCache(CACHE_KEY);
    if (cachedCategories) {
      return NextResponse.json(cachedCategories, {
        headers: { 'X-Cache-Source': 'Upstash-Redis' }
      });
    }

    // 2. Query Neon PostgreSQL
    const res = await pgQuery(
      'SELECT * FROM fee_categories ORDER BY created_at ASC'
    );
    const categories = mapPgCategories(res.rows);

    // 3. Cache categories in Redis for 30 minutes
    await setCache(CACHE_KEY, categories, DEFAULT_CACHE_TTL);

    return NextResponse.json(categories, {
      headers: { 'X-Cache-Source': 'Neon-PostgreSQL' }
    });
  } catch (error: any) {
    console.error('Error in GET /api/finance/categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch fee categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, type, defaultAmount, frequency, isMandatory, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const generatedCode = (code || name).toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check code existence
    const existCheck = await pgQuery('SELECT id FROM fee_categories WHERE code = $1', [generatedCode]);
    if (existCheck.rows.length > 0) {
      return NextResponse.json({ error: `Category code '${generatedCode}' already exists` }, { status: 400 });
    }

    const id = `cat_${generatedCode}_${Date.now().toString().slice(-4)}`;

    const insertRes = await pgQuery(`
      INSERT INTO fee_categories (
        id, name, code, type, default_amount, frequency, is_mandatory, description, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      id,
      name.trim(),
      generatedCode,
      type || 'Kit/Uniform',
      Number(defaultAmount) || 0,
      frequency || 'One-Time',
      Boolean(isMandatory),
      description?.trim() || '',
      'Active'
    ]);

    const newCategory = mapPgCategory(insertRes.rows[0]);

    // Invalidate categories and master bundle cache immediately
    await Promise.all([
      delCache(CACHE_KEY),
      delCache("fee:bundle:master")
    ]);

    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/finance/categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to create fee category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, code, name, type, defaultAmount, frequency, isMandatory, description, status } = body;

    const lookupId = id || code;
    const lookupCode = code || (name ? name.toLowerCase().replace(/[^a-z0-9]/g, '_') : null);

    if (!lookupId && !lookupCode && !name) {
      return NextResponse.json({ error: 'Category ID, code or name is required' }, { status: 400 });
    }

    // Try finding existing category by id, code or normalized name
    let existingRow: any = null;
    if (lookupId) {
      const byId = await pgQuery('SELECT * FROM fee_categories WHERE id = $1', [lookupId]);
      if (byId.rows.length > 0) existingRow = byId.rows[0];
    }
    if (!existingRow && lookupCode) {
      const byCode = await pgQuery('SELECT * FROM fee_categories WHERE code = $1', [lookupCode]);
      if (byCode.rows.length > 0) existingRow = byCode.rows[0];
    }
    if (!existingRow && name) {
      const byName = await pgQuery('SELECT * FROM fee_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))', [name]);
      if (byName.rows.length > 0) existingRow = byName.rows[0];
    }

    let resultCategory: any = null;

    if (existingRow) {
      // Update existing record
      const updateRes = await pgQuery(`
        UPDATE fee_categories
        SET name = COALESCE($2, name),
            type = COALESCE($3, type),
            default_amount = COALESCE($4, default_amount),
            frequency = COALESCE($5, frequency),
            is_mandatory = COALESCE($6, is_mandatory),
            description = COALESCE($7, description),
            status = COALESCE($8, status),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [
        existingRow.id,
        name?.trim() || null,
        type || null,
        defaultAmount !== undefined && defaultAmount !== null && defaultAmount !== '' ? Number(defaultAmount) : null,
        frequency || null,
        isMandatory !== undefined ? Boolean(isMandatory) : null,
        description !== undefined ? description?.trim() : null,
        status || null
      ]);

      resultCategory = mapPgCategory(updateRes.rows[0]);
    } else {
      // Upsert: Create as new category if not yet existing in DB
      const generatedCode = lookupCode || (name || 'cat').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newId = lookupId || `cat_${generatedCode}_${Date.now().toString().slice(-4)}`;

      const insertRes = await pgQuery(`
        INSERT INTO fee_categories (
          id, name, code, type, default_amount, frequency, is_mandatory, description, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `, [
        newId,
        (name || generatedCode).trim(),
        generatedCode,
        type || 'Kit/Uniform',
        Number(defaultAmount) || 0,
        frequency || 'One-Time',
        Boolean(isMandatory),
        description?.trim() || '',
        status || 'Active'
      ]);

      resultCategory = mapPgCategory(insertRes.rows[0]);
    }

    // Invalidate categories and master bundle cache immediately
    await Promise.all([
      delCache(CACHE_KEY),
      delCache("fee:bundle:master")
    ]);

    return NextResponse.json({ success: true, category: resultCategory });
  } catch (error: any) {
    console.error('Error in PUT /api/finance/categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to update fee category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await pgQuery('DELETE FROM fee_categories WHERE id = $1', [id]);

    // Invalidate categories and master bundle cache immediately
    await Promise.all([
      delCache(CACHE_KEY),
      delCache("fee:bundle:master")
    ]);

    return NextResponse.json({ success: true, message: 'Fee category deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/finance/categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete fee category' }, { status: 500 });
  }
}
