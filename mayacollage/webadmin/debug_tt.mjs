import mongoose from 'mongoose';

async function main() {
  const uri = 'mongodb+srv://prateeksengarf2:5eX8u0aV46yAOCwQ@maya-erp.x658s.mongodb.net/maya-erp?retryWrites=true&w=majority&appName=Maya-Erp';
  await mongoose.connect(uri);

  const db = mongoose.connection.db;

  const timetables = await db.collection('timetables').find({ targetType: 'Class' }).toArray();
  console.log(`Found ${timetables.length} class timetables.`);

  let thursdaySlots = [];
  timetables.forEach(tt => {
    if (tt.schedule) {
      const thursdayPlan = tt.schedule.find(d => d.day === 'Thursday');
      if (thursdayPlan && thursdayPlan.slots) {
        thursdayPlan.slots.forEach(slot => {
            thursdaySlots.push({
                subject: slot.subject,
                facultyUserId: slot.facultyUserId,
                facultyName: slot.facultyName
            });
        });
      }
    }
  });

  console.log('Thursday Slots:', thursdaySlots);
  
  process.exit(0);
}

main().catch(console.error);
