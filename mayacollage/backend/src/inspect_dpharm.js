import xlsx from 'xlsx';

const EXCEL_PATH = 'c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\D.Pharm 2024-26 C.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { range: 1 });

console.log(`Total rows read from excel (range: 1): ${data.length}`);
console.log("Headers:", Object.keys(data[0]));
console.log("First row:", data[0]);

for (let i = Math.max(0, data.length - 5); i < data.length; i++) {
    const row = data[i];
    console.log(`Row ${i}:`, row);
}
