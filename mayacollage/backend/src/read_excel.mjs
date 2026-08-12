import XLSX from 'xlsx';

const excelPath = 'C:\\Users\\Lalit\\Downloads\\mayaerp\\mayaerp\\admin\\lib\\features\\admin\\data\\B.Pharm 2023-27 C.xlsx';
const workbook = XLSX.readFile(excelPath);

// Sheet1 - full list including lateral entry
const sheet1 = workbook.Sheets['Sheet1'];
const s1raw = XLSX.utils.sheet_to_json(sheet1, { header: 1, defval: '' });

console.log('===== SHEET 1 - ALL ROWS (including Lateral Entry) =====');
s1raw.forEach((row, i) => {
    console.log(`Row ${i}: ${JSON.stringify(row)}`);
});

// Sheet2 - detailed
const sheet2 = workbook.Sheets['Sheet2'];
const s2raw = XLSX.utils.sheet_to_json(sheet2, { header: 1, defval: '' });
console.log('\n===== SHEET 2 - ALL ROWS =====');
console.log('Total rows in Sheet2:', s2raw.length);
s2raw.slice(1).forEach((row, i) => {
    const name = row[3]?.toString().trim();
    const mobile = row[9];
    const dob = row[12];
    const entryType = row[1]; // COURSE column
    if (name) console.log(`${i+1}. [${entryType}] ${name} | Mobile: ${mobile} | DOB-serial: ${dob}`);
});
