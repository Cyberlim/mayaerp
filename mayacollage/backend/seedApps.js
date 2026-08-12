import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Application } from './src/models/applicationModel.js';

dotenv.config();

const dummyApplications = [
  {
    firstName: "Rahul",
    lastName: "Sharma",
    dob: "2004-05-14",
    gender: "Male",
    email: "rahul.sharma@example.com",
    mobile: "9876543210",
    address: "123 MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400001",
    highestQualification: "12th Science",
    institutionName: "DPS Mumbai",
    boardUniversity: "CBSE",
    percentageCGPA: "92%",
    yearOfPassing: "2023",
    selectedProgram: "B.Tech Computer Science",
    sessionYear: "2024",
    category: "General",
    status: "Pending"
  },
  {
    firstName: "Priya",
    lastName: "Verma",
    dob: "2005-08-22",
    gender: "Female",
    email: "priya.v@example.com",
    mobile: "9988776655",
    address: "45 Sector 12",
    city: "Delhi",
    state: "Delhi",
    pinCode: "110001",
    highestQualification: "12th Commerce",
    institutionName: "KV Delhi",
    boardUniversity: "CBSE",
    percentageCGPA: "88%",
    yearOfPassing: "2023",
    selectedProgram: "MBA Finance",
    sessionYear: "2024",
    category: "OBC",
    status: "Accepted"
  },
  {
    firstName: "Amit",
    lastName: "Patel",
    dob: "2003-11-30",
    gender: "Male",
    email: "amit.patel@example.com",
    mobile: "8877665544",
    address: "78 SG Highway",
    city: "Ahmedabad",
    state: "Gujarat",
    pinCode: "380015",
    highestQualification: "Diploma in Pharmacy",
    institutionName: "Govt Poly",
    boardUniversity: "GTU",
    percentageCGPA: "7.8 CGPA",
    yearOfPassing: "2023",
    selectedProgram: "B.Pharm",
    sessionYear: "2024",
    category: "SC",
    status: "Reviewed"
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Application.deleteMany({});
    await Application.insertMany(dummyApplications);
    console.log("Seeded 3 applications successfully.");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

seed();
