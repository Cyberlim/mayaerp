const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://thestudentzilla_db_user:NL2wc3tgnB6EzpPl@mayacollage.ktxtgpi.mongodb.net/test?retryWrites=true&w=majority').then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('students').updateMany(
    {}, 
    { $set: { 
        selectedProgram: new mongoose.Types.ObjectId('6a44c4ee7b077d27cbe5327f'),
        selectedBranch: new mongoose.Types.ObjectId('6a44c2707b077d27cbe53115')
      } 
    }
  );
  console.log('Updated students:', result.modifiedCount);
  process.exit(0);
});
