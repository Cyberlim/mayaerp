import xlsx from 'xlsx';

const file1 = 'C:/Users/kdev7/Downloads/maya-collage/mayaerp/mayaerp/admin/data/D.Pharm 2024-26 C (1).xlsx';
const file2 = 'C:/Users/kdev7/Downloads/maya-collage/mayaerp/mayaerp/admin/data/D.Pharm 2025-27 C.xlsx';

const checkSheets = (filePath, name) => {
    const workbook = xlsx.readFile(filePath);
    console.log(`\n--- Sheets in ${name} ---`);
    console.log(workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`Sheet "${sheetName}" has ${data.length} rows`);
    });
};

checkSheets(file1, 'File 1 (2024-26)');
checkSheets(file2, 'File 2 (2025-27)');
