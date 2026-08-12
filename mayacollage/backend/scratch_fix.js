import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: './.env' });

(async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db();
  
  const issues = await db.collection('issuebooks').find({ status: { $in: ['Active', 'Overdue'] }, isVerified: true }).toArray();
  const activeIssuesMap = {};
  for (const issue of issues) {
      const bookId = issue.book.toString();
      activeIssuesMap[bookId] = (activeIssuesMap[bookId] || 0) + 1;
  }
  
  const books = await db.collection('books').find({}).toArray();
  for (const book of books) {
      const issuedCount = activeIssuesMap[book._id.toString()] || 0;
      const actualAvailable = book.total - issuedCount;
      if (book.available !== actualAvailable) {
          await db.collection('books').updateOne(
              { _id: book._id },
              { $set: { available: actualAvailable } }
          );
      }
  }
  await client.close();
  console.log('Fixed book available counts!');
  process.exit(0);
})();
