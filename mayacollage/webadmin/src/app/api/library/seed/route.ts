import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Book } from "@/models/Book";

export const dynamic = 'force-dynamic';

export const DEMO_BOOKS = [
  {
    title: "Introduction to Algorithms (4th Edition)",
    author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    isbn: "978-0262046305",
    category: "Computer Science & IT",
    total: 10,
    available: 8,
    shelf: "CS-Rack-A1",
    publisher: "MIT Press",
    price: 1450,
    description: "The definitive reference and university textbook for computer algorithms, dynamic programming, graph algorithms, and data structures.",
    remarks: "Prescribed for 2nd & 3rd Year B.Tech CSE"
  },
  {
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell, Peter Norvig",
    isbn: "978-0134610993",
    category: "Artificial Intelligence & ML",
    total: 8,
    available: 6,
    shelf: "AI-Rack-B2",
    publisher: "Pearson Education",
    price: 1200,
    description: "Comprehensive guide to modern AI, heuristic search, probabilistic reasoning, machine learning, and deep neural networks.",
    remarks: "Core reading for AI & Data Science"
  },
  {
    title: "Database System Concepts (7th Edition)",
    author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    isbn: "978-0078022159",
    category: "Computer Science & IT",
    total: 12,
    available: 9,
    shelf: "CS-Rack-A3",
    publisher: "McGraw-Hill Education",
    price: 890,
    description: "Fundamental concepts of database management, relational algebra, SQL, indexing, transaction processing, and concurrency control.",
    remarks: "Standard textbook for DBMS course"
  },
  {
    title: "Higher Engineering Mathematics (44th Edition)",
    author: "Dr. B.S. Grewal",
    isbn: "978-8174091956",
    category: "Mathematics",
    total: 15,
    available: 12,
    shelf: "MATH-Rack-M1",
    publisher: "Khanna Publishers",
    price: 750,
    description: "Exhaustive engineering mathematics textbook covering differential equations, Laplace transforms, Fourier series, vector calculus, and numerical methods.",
    remarks: "Universal reference for Semesters 1 to 4"
  },
  {
    title: "Engineering Mechanics: Statics & Dynamics",
    author: "Russell C. Hibbeler",
    isbn: "978-0133915426",
    category: "Mechanical Engineering",
    total: 10,
    available: 7,
    shelf: "MECH-Rack-C1",
    publisher: "Pearson",
    price: 950,
    description: "Classical principles of mechanics, vector equilibrium, rigid bodies, truss analysis, friction, kinematics, and energy methods.",
    remarks: "Required for Mechanical & Civil Engineering"
  },
  {
    title: "Microelectronic Circuits: Theory & Applications",
    author: "Adel S. Sedra, Kenneth C. Smith",
    isbn: "978-0199339136",
    category: "Electrical & Electronics",
    total: 7,
    available: 5,
    shelf: "ECE-Rack-D2",
    publisher: "Oxford University Press",
    price: 1100,
    description: "Standard university textbook for semiconductor physics, BJT/MOSFET amplifiers, operational amplifiers, and integrated analog circuit design.",
    remarks: "Prescribed for ECE & EEE departments"
  },
  {
    title: "Principles and Practice of Management",
    author: "Harold Koontz, Heinz Weihrich",
    isbn: "978-0070682139",
    category: "Management & Business",
    total: 8,
    available: 7,
    shelf: "MGMT-Rack-E1",
    publisher: "Tata McGraw-Hill",
    price: 620,
    description: "Foundations of organizational management, strategic planning, human resource leadership, operational control, and corporate ethics.",
    remarks: "Core text for MBA & BBA students"
  },
  {
    title: "Pharmacology & Pharmacotherapeutics",
    author: "Dr. R.S. Satoskar, Dr. Nirmala N. Rege",
    isbn: "978-8131243718",
    category: "Pharmacy & Medical Sciences",
    total: 6,
    available: 4,
    shelf: "PHARM-Rack-F3",
    publisher: "Elsevier Health Sciences",
    price: 1350,
    description: "Authoritative medical and pharmaceutical textbook covering pharmacokinetics, pharmacodynamics, clinical pharmacology, and chemotherapy.",
    remarks: "Standard handbook for B.Pharm and Nursing"
  },
  {
    title: "Computer Networking: A Top-Down Approach",
    author: "James F. Kurose, Keith W. Ross",
    isbn: "978-0133594140",
    category: "Computer Science & IT",
    total: 9,
    available: 6,
    shelf: "CS-Rack-A4",
    publisher: "Pearson",
    price: 980,
    description: "Layer-by-layer architectural exploration of modern computer networking, application protocols (HTTP/DNS), transport (TCP/UDP), routing, and network security.",
    remarks: "Standard textbook for Computer Networks"
  },
  {
    title: "Design of Steel Structures (Limit State Method)",
    author: "Dr. N. Subramanian",
    isbn: "978-0198068815",
    category: "Civil Engineering",
    total: 6,
    available: 5,
    shelf: "CIVIL-Rack-G1",
    publisher: "Oxford University Press",
    price: 850,
    description: "Practical guide to IS 800:2007 code provisions, tension/compression members, beams, beam-columns, bolted and welded connections, and industrial trusses.",
    remarks: "Essential for 3rd & 4th Year Civil Engineering"
  }
];

export async function POST() {
  try {
    await connectDB();

    const results = [];
    for (const bookData of DEMO_BOOKS) {
      // Upsert by ISBN
      const existing = await Book.findOne({ isbn: bookData.isbn });
      if (!existing) {
        const created = await Book.create(bookData);
        results.push({ action: 'created', book: created });
      } else {
        // Update if already there
        existing.total = bookData.total;
        existing.available = bookData.available;
        existing.shelf = bookData.shelf;
        existing.category = bookData.category;
        existing.price = bookData.price;
        existing.publisher = bookData.publisher;
        existing.description = bookData.description;
        existing.remarks = bookData.remarks;
        await existing.save();
        results.push({ action: 'updated', book: existing });
      }
    }

    const totalInDb = await Book.countDocuments();
    return NextResponse.json({
      success: true,
      message: `Successfully seeded/updated 10 demo books into database!`,
      totalInDatabase: totalInDb,
      books: results
    }, { status: 200 });
  } catch (error: any) {
    console.error("Library Seed Error:", error);
    return NextResponse.json({ success: false, message: "Error seeding demo books", error: error.message }, { status: 500 });
  }
}
