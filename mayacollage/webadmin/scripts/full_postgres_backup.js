const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_pADeFi9rGlU2@ep-royal-field-b4fsklle-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function backupDatabase() {
  console.log("=================================================");
  console.log("STARTING COMPREHENSIVE POSTGRESQL BACKUP");
  console.log("Database:", connectionString.split('@')[1]?.split('?')[0]);
  console.log("=================================================\n");

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `postgres_backup_${timestamp}`);
  const latestBackupDir = path.join(__dirname, '..', 'backups', 'postgres_latest');
  const publicBackupDir = path.join(__dirname, '..', 'public', 'backups');

  [backupDir, latestBackupDir, publicBackupDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  try {
    // 1. Get all public tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables in PostgreSQL database:`);
    console.log(tables.join(', '));
    console.log("-------------------------------------------------\n");

    const fullDump = {};
    const tableSummaries = [];
    let sqlDumpContent = `-- Maya ERP PostgreSQL Full Database Backup\n-- Generated At: ${new Date().toISOString()}\n\n`;

    for (const tableName of tables) {
      process.stdout.write(`Backing up [${tableName}]... `);
      
      // Fetch all rows
      const dataRes = await pool.query(`SELECT * FROM "${tableName}"`);
      const rows = dataRes.rows;
      fullDump[tableName] = rows;
      tableSummaries.push({ table: tableName, count: rows.length });

      console.log(`${rows.length} rows.`);

      // 1. Write individual JSON file
      const jsonContent = JSON.stringify(rows, null, 2);
      fs.writeFileSync(path.join(backupDir, `${tableName}.json`), jsonContent);
      fs.writeFileSync(path.join(latestBackupDir, `${tableName}.json`), jsonContent);

      // 2. Generate SQL Insert statements
      if (rows.length > 0) {
        sqlDumpContent += `-- Table: ${tableName} (${rows.length} rows)\n`;
        const columns = Object.keys(rows[0]);
        for (const row of rows) {
          const vals = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          sqlDumpContent += `INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlDumpContent += `\n`;
      }

      // 3. For student and master tables, also write Excel (.xlsx)
      if (['students', 'courses', 'branches', 'users', 'admissions'].includes(tableName) && rows.length > 0) {
        // Flatten nested objects/jsonb for clean Excel output
        const flatRows = rows.map(r => {
          const flat = {};
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

    // Write full consolidated JSON dump
    const consolidatedJson = JSON.stringify(fullDump, null, 2);
    fs.writeFileSync(path.join(backupDir, 'full_database_dump.json'), consolidatedJson);
    fs.writeFileSync(path.join(latestBackupDir, 'full_database_dump.json'), consolidatedJson);
    fs.writeFileSync(path.join(publicBackupDir, 'full_postgres_backup.json'), consolidatedJson);

    // Write full SQL dump
    fs.writeFileSync(path.join(backupDir, 'full_database_backup.sql'), sqlDumpContent);
    fs.writeFileSync(path.join(latestBackupDir, 'full_database_backup.sql'), sqlDumpContent);
    fs.writeFileSync(path.join(publicBackupDir, 'full_postgres_backup.sql'), sqlDumpContent);

    // Write metadata manifest
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

    console.log("\n=================================================");
    console.log("BACKUP COMPLETED WITH 100% SUCCESS!");
    console.log("=================================================");
    console.log("Total Tables Backed Up:", manifest.totalTables);
    console.log("Total Records Backed Up:", manifest.totalRecords);
    console.log("\nSaved in locations:");
    console.log(`1. Timestamped Archive: ${backupDir}`);
    console.log(`2. Latest Reference: ${latestBackupDir}`);
    console.log(`3. Public Web Download Hub: ${publicBackupDir}`);
    console.log("\nFiles generated for download:");
    console.log(" - full_postgres_backup.json (Entire database JSON)");
    console.log(" - full_postgres_backup.sql  (Standard SQL restore file)");
    console.log(" - students_backup.xlsx     (All students in Excel)");
    console.log(" - courses_backup.xlsx      (All courses in Excel)");
    console.log(" - branches_backup.xlsx     (All branches in Excel)");
    console.log("=================================================\n");

  } catch (error) {
    console.error("BACKUP FAILED:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

backupDatabase();
