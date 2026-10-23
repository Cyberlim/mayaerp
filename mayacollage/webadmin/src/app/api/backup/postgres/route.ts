import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { query as pgQuery } from "@/lib/postgres";
import * as XLSX from "xlsx";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download"); // 'sql' | 'json' | table name (e.g. 'buses', 'students', 'courses', 'branches')
    const format = searchParams.get("format") || "xlsx"; // 'xlsx' | 'json'
    const table = searchParams.get("table") || (download && !['sql', 'json', 'manifest'].includes(download) ? download.replace('_xlsx', '') : null);

    const publicBackupDir = path.join(process.cwd(), "public", "backups");
    const manifestPath = path.join(publicBackupDir, "manifest.json");

    // Dynamic single-table export (e.g., table=buses, table=courses, table=branches, table=students)
    if (table) {
      // Validate table against PostgreSQL schema to prevent SQL injection
      const tableCheck = await pgQuery(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name = $1
      `, [table.toLowerCase()]);

      if (tableCheck.rows.length === 0) {
        return NextResponse.json({ error: `Table "${table}" does not exist in PostgreSQL.` }, { status: 404 });
      }

      const rowsRes = await pgQuery(`SELECT * FROM "${tableCheck.rows[0].table_name}"`);
      const rows = rowsRes.rows;

      if (format === "json") {
        return new NextResponse(JSON.stringify(rows, null, 2), {
          headers: {
            "Content-Disposition": `attachment; filename="${table}_export.json"`,
            "Content-Type": "application/json"
          }
        });
      }

      // Generate Excel on the fly
      const flatRows = rows.map(r => {
        const flat: any = {};
        for (const k of Object.keys(r)) {
          if (typeof r[k] === 'object' && r[k] !== null) {
            flat[k] = JSON.stringify(r[k]);
          } else {
            flat[k] = r[k];
          }
        }
        return flat;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(flatRows);
      XLSX.utils.book_append_sheet(wb, ws, table.slice(0, 31));
      const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${table}_export.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
      });
    }

    // Static / Pre-dumped file downloads
    if (download === "sql") {
      const filePath = path.join(publicBackupDir, "full_postgres_backup.sql");
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "SQL backup not found. Please trigger a fresh backup." }, { status: 404 });
      }
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Disposition": 'attachment; filename="full_postgres_backup.sql"',
          "Content-Type": "application/sql"
        }
      });
    }

    if (download === "json") {
      const filePath = path.join(publicBackupDir, "full_postgres_backup.json");
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "JSON backup not found. Please trigger a fresh backup." }, { status: 404 });
      }
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Disposition": 'attachment; filename="full_postgres_backup.json"',
          "Content-Type": "application/json"
        }
      });
    }

    // Return backup status & available tables
    let manifest: any = null;
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      } catch (e) {}
    }

    const tablesRes = await pgQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);

    return NextResponse.json({
      success: true,
      manifest,
      availableTables: tablesRes.rows.map(r => r.table_name)
    });
  } catch (error: any) {
    console.error("GET /api/backup/postgres error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve backup" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', `postgres_backup_${timestamp}`);
    const latestBackupDir = path.join(process.cwd(), 'backups', 'postgres_latest');
    const publicBackupDir = path.join(process.cwd(), 'public', 'backups');

    [backupDir, latestBackupDir, publicBackupDir].forEach(d => {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });

    const tablesRes = await pgQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    const fullDump: Record<string, any[]> = {};
    const tableSummaries: { table: string; count: number }[] = [];
    let sqlDumpContent = `-- Maya ERP PostgreSQL Full Database Backup\n-- Generated At: ${new Date().toISOString()}\n\n`;

    for (const tableName of tables) {
      const dataRes = await pgQuery(`SELECT * FROM "${tableName}"`);
      const rows = dataRes.rows;
      fullDump[tableName] = rows;
      tableSummaries.push({ table: tableName, count: rows.length });

      const jsonContent = JSON.stringify(rows, null, 2);
      fs.writeFileSync(path.join(backupDir, `${tableName}.json`), jsonContent);
      fs.writeFileSync(path.join(latestBackupDir, `${tableName}.json`), jsonContent);

      if (rows.length > 0) {
        sqlDumpContent += `-- Table: ${tableName} (${rows.length} rows)\n`;
        const columns = Object.keys(rows[0]);
        for (const row of rows) {
          const vals = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number' || typeof val === 'boolean') return String(val);
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          sqlDumpContent += `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlDumpContent += `\n`;
      }

      // Generate Excel for all prominent tables
      if (['students', 'courses', 'branches', 'buses', 'users', 'admissions', 'attendance', 'fee_transactions', 'labs'].includes(tableName) && rows.length > 0) {
        const flatRows = rows.map(r => {
          const flat: any = {};
          for (const k of Object.keys(r)) {
            if (typeof r[k] === 'object' && r[k] !== null) {
              flat[k] = JSON.stringify(r[k]);
            } else {
              flat[k] = r[k];
            }
          }
          return flat;
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(flatRows);
        XLSX.utils.book_append_sheet(wb, ws, tableName.slice(0, 31));
        
        XLSX.writeFile(wb, path.join(backupDir, `${tableName}.xlsx`));
        XLSX.writeFile(wb, path.join(latestBackupDir, `${tableName}.xlsx`));
        XLSX.writeFile(wb, path.join(publicBackupDir, `${tableName}_backup.xlsx`));
      }
    }

    const consolidatedJson = JSON.stringify(fullDump, null, 2);
    fs.writeFileSync(path.join(backupDir, 'full_database_dump.json'), consolidatedJson);
    fs.writeFileSync(path.join(latestBackupDir, 'full_database_dump.json'), consolidatedJson);
    fs.writeFileSync(path.join(publicBackupDir, 'full_postgres_backup.json'), consolidatedJson);

    fs.writeFileSync(path.join(backupDir, 'full_database_backup.sql'), sqlDumpContent);
    fs.writeFileSync(path.join(latestBackupDir, 'full_database_backup.sql'), sqlDumpContent);
    fs.writeFileSync(path.join(publicBackupDir, 'full_postgres_backup.sql'), sqlDumpContent);

    const manifest = {
      timestamp: new Date().toISOString(),
      backupFolder: backupDir,
      tables: tableSummaries,
      totalTables: tables.length,
      totalRecords: tableSummaries.reduce((sum, t) => sum + t.count, 0)
    };
    fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(latestBackupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(publicBackupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    return NextResponse.json({
      success: true,
      message: `Full database backup completed successfully! ${manifest.totalRecords} records across ${manifest.totalTables} tables secured.`,
      manifest
    });
  } catch (error: any) {
    console.error("POST /api/backup/postgres error:", error);
    return NextResponse.json({ error: error.message || "Backup creation failed" }, { status: 500 });
  }
}
