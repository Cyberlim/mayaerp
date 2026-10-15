import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { getCache, setCache, delCache, DEFAULT_CACHE_TTL } from "@/lib/redis";

const CACHE_KEY = "master:branches";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bust = searchParams.get("bust") === "true";

    // 1. Try Redis cache (sub-10ms response) if not busting
    if (!bust) {
      const cachedBranches = await getCache(CACHE_KEY);
      if (cachedBranches && Array.isArray(cachedBranches) && cachedBranches.length > 0) {
        return NextResponse.json(cachedBranches, {
          headers: { "X-Cache-Source": "Upstash-Redis" }
        });
      }
    }

    // 2. Query Neon PostgreSQL directly (No MongoDB)
    const res = await pgQuery('SELECT * FROM branches ORDER BY created_at DESC');
    const branches = res.rows.map(b => ({
      _id: b.id,
      id: b.id,
      code: b.code,
      name: b.name,
      deanName: b.dean_name,
      contactEmail: b.contact_email,
      contactExt: b.contact_ext,
      iconName: b.icon_name || 'business_center_rounded',
      colorHex: b.color_hex || '#4F46E5',
      location: b.location,
      establishedYear: b.established_year,
      createdAt: b.created_at,
      updatedAt: b.updated_at
    }));

    // 3. Cache in Redis
    await setCache(CACHE_KEY, branches, DEFAULT_CACHE_TTL);

    return NextResponse.json(branches, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });
  } catch (error: any) {
    console.error("GET /api/branches error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body._id || body.id || `br_${Date.now().toString(36)}`;

    // 1. Insert into Neon PostgreSQL directly (No MongoDB)
    const insertSQL = `
      INSERT INTO branches (
        id, code, name, dean_name, contact_email, contact_ext, icon_name, color_hex, location, established_year, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const res = await pgQuery(insertSQL, [
      id,
      body.code,
      body.name,
      body.deanName || null,
      body.contactEmail || null,
      body.contactExt || null,
      body.iconName || 'business_center_rounded',
      body.colorHex || '#4F46E5',
      body.location || null,
      body.establishedYear || null
    ]);

    const created = res.rows[0];
    const formatted = {
      _id: created.id,
      id: created.id,
      code: created.code,
      name: created.name,
      deanName: created.dean_name,
      contactEmail: created.contact_email,
      contactExt: created.contact_ext,
      iconName: created.icon_name,
      colorHex: created.color_hex,
      location: created.location,
      establishedYear: created.established_year,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    };

    // Invalidate branches cache
    await delCache(CACHE_KEY);

    return NextResponse.json(formatted, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/branches error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
