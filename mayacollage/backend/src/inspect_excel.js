import xlsx from 'xlsx';

const workbook = xlsx.readFile('c:\\Users\\Lalit\\OneDrive\\Desktop\\maya web or backend\\mayacollage\\webadmin\\mayadata\\B.Pharm 2023-27 C (1).xlsx');
const sheet_name_list = workbook.SheetNames;
// Parse starting from row 1 (second row in excel, which contains headers)
const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], { range: 1 });

console.log("Headers:", Object.keys(xlData[0]));
console.log("First Student:", xlData[0]);
console.log("Total students in excel:", xlData.length);
