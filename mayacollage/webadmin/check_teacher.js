const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = 'mongodb+srv://prateeksengarf2:5eX8u0aV46yAOCwQ@maya-erp.x658s.mongodb.net/maya-erp?retryWrites=true&w=majority&appName=Maya-Erp';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const timetables = await db.collection('timetables').find({ targetType: 'Teacher' }).toArray();
    console.log('Timetables:');
    timetables.forEach(t => console.log(t._id, 'teacherId:', t.teacherId, 'type:', typeof t.teacherId, t.teacherId instanceof ObjectId));
    
    if (timetables.length > 0) {
      let tId = timetables[0].teacherId;
      console.log('tId string value:', String(tId));
      if (typeof tId === 'string') tId = new ObjectId(tId);
      const user = await db.collection('users').findOne({ _id: tId });
      console.log('User found:', user);
    }
  } finally {
    await client.close();
  }
}
main().catch(console.error);
