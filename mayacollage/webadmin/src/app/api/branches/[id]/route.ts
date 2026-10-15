import { NextResponse } from "next/server";
import { query as pgQuery } from "@/lib/postgres";
import { getCache, setCache, delCache, DEFAULT_CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cacheKey = `branch:${id}`;

    // 1. Check Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache-Source": "Upstash-Redis" }
      });
    }

    // 2. Query Neon PostgreSQL
    const res = await pgQuery('SELECT * FROM branches WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const b = res.rows[0];
    const branch = {
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
    };

    // Cache in Redis
    await setCache(cacheKey, branch, DEFAULT_CACHE_TTL);

    return NextResponse.json(branch, {
      headers: { "X-Cache-Source": "Neon-PostgreSQL" }
    });
  } catch (error: any) {
    console.error("GET /api/branches/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingRes = await pgQuery('SELECT * FROM branches WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
    const existing = existingRes.rows[0];

    const code = body.code !== undefined ? body.code : existing.code;
    const name = body.name !== undefined ? body.name : existing.name;
    const deanName = body.deanName !== undefined ? body.deanName : existing.dean_name;
    const contactEmail = body.contactEmail !== undefined ? body.contactEmail : existing.contact_email;
    const contactExt = body.contactExt !== undefined ? body.contactExt : existing.contact_ext;
    const iconName = body.iconName !== undefined ? body.iconName : existing.icon_name;
    const colorHex = body.colorHex !== undefined ? body.colorHex : existing.color_hex;
    const location = body.location !== undefined ? body.location : existing.location;
    const establishedYear = body.establishedYear !== undefined ? body.establishedYear : existing.established_year;

    const updateSQL = `
      UPDATE branches SET
        code = $1,
        name = $2,
        dean_name = $3,
        contact_email = $4,
        contact_ext = $5,
        icon_name = $6,
        color_hex = $7,
        location = $8,
        established_year = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;

    const updateRes = await pgQuery(updateSQL, [
      code,
      name,
      deanName,
      contactEmail,
      contactExt,
      iconName,
      colorHex,
      location,
      establishedYear,
      id
    ]);

    const updated = updateRes.rows[0];
    const formatted = {
      _id: updated.id,
      id: updated.id,
      code: updated.code,
      name: updated.name,
      deanName: updated.dean_name,
      contactEmail: updated.contact_email,
      contactExt: updated.contact_ext,
      iconName: updated.icon_name,
      colorHex: updated.color_hex,
      location: updated.location,
      establishedYear: updated.established_year,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };

    // Invalidate Redis caches
    await delCache("master:branches");
    await delCache(`branch:${id}`);

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("PATCH /api/branches/[id] error:", error);
    if (error.code === '23505') {
      return NextResponse.json({ error: "Branch code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await pgQuery('DELETE FROM branches WHERE id = $1 RETURNING *', [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Invalidate Redis caches
    await delCache("master:branches");
    await delCache(`branch:${id}`);

    return NextResponse.json({ message: "Branch deleted successfully from PostgreSQL" });
  } catch (error: any) {
    console.error("DELETE /api/branches/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
