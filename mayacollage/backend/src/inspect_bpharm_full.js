import xlsx from 'xlsx';

const EXCEL_PATH = 'c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\B.Pharm 2023-27 C (1).xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log(`Total rows read from excel (range: 1): ${data.length}`);
console.log("Headers:", data[0]);
console.log("First row data:", data[1]);
console.log("Second row data:", data[2]);
