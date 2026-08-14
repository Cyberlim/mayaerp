import xlsx from 'xlsx';

const EXCEL_PATH = 'c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\B.Tech 2025-29 C.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log(`Total rows read from excel: ${data.length}`);
console.log("Headers (row 0):", data[0]);
console.log("First data row:", data[1]);
