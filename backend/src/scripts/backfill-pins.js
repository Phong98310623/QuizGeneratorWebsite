/**
 * Backfill PIN for existing question sets that don't have one.
 * Run: node src/scripts/backfill-pins.js (from backend folder)
 */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const QuestionSet = require('../models/question_set.model');

async function backfillPins() {
  await connectDB();
  const sets = await QuestionSet.find({ $or: [{ pin: null }, { pin: '' }] });
  let updated = 0;
  for (const set of sets) {
    const pin = await QuestionSet.generateUniquePin();
    set.pin = pin;
    await set.save();
    updated++;
    console.log(`Set "${set.title}" (${set._id}) -> PIN ${pin}`);
  }
  console.log(`Done. Updated ${updated} sets with PINs.`);
  process.exit(0);
}

backfillPins().catch((err) => {
  console.error(err);
  process.exit(1);
});
