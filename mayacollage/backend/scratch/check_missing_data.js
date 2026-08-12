import xlsx from 'xlsx';

const file1 = 'C:/Users/kdev7/Downloads/maya-collage/mayaerp/mayaerp/admin/data/D.Pharm 2024-26 C (1).xlsx';
const file2 = 'C:/Users/kdev7/Downloads/maya-collage/mayaerp/mayaerp/admin/data/D.Pharm 2025-27 C.xlsx';

const checkFile = (filePath, name) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`\n--- Checking ${name} ---`);
    console.log(`Total rows (including header): ${data.length}`);
    
    let validRows = 0;
    let missingNameRows = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) {
            console.log(`Row ${i + 1} is empty`);
            continue;
        }
        if (!row[3]) {
            console.log(`Row ${i + 1} is missing student name. Raw data:`, row);
            missingNameRows.push(i + 1);
            continue;
        }
        validRows++;
    }
    
    console.log(`Valid rows with names: ${validRows}`);
    if (missingNameRows.length > 0) {
        console.log(`Rows skipped due to missing name:`, missingNameRows);
    }
};

checkFile(file1, 'File 1 (2024-26)');
checkFile(file2, 'File 2 (2025-27)');
