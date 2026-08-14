import xlsx from 'xlsx';

const EXCEL_PATH = 'c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\M.Pharm 2025-27 C.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log(`Total rows read from excel (range: 1): ${data.length}`);
console.log("Headers:", Object.keys(data[0]));
console.log("First row:", data[0]);

for (let i = 0; i < Math.min(5, data.length); i++) {
    console.log(`Row ${i}:`, data[i]);
}
