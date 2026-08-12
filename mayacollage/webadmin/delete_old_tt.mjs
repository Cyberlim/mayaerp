import { MongoClient } from 'mongodb';

async function main() {
  const uri = 'mongodb+srv://prateeksengarf2:5eX8u0aV46yAOCwQ@maya-erp.x658s.mongodb.net/maya-erp?retryWrites=true&w=majority&appName=Maya-Erp';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('maya-erp'); 
    const result = await db.collection('timetables').deleteMany({ targetType: 'Teacher' });
    console.log(`Deleted ${result.deletedCount} old teacher timetables`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
main();
