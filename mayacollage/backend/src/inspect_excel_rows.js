import xlsx from 'xlsx';

const EXCEL_PATH = 'c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\B.Pharm 2023-27 C (1).xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { range: 1 });

for (let i = 0; i < data.length; i++) {
    const row = data[i];
    console.log(`Row ${i}: S.No=${row['S.No.']}, Name=${row['Student Name ']}`);
}
