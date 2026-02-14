const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const QuestionSet = require('../models/question_set.model');
const Question = require('../models/question.model');

async function createTestSets() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.mongo_uri, {
      dbName: process.env.mongo_db_name,
    });

    console.log('✅ Connected to MongoDB');

    // Create test questions
    const questions = await Question.insertMany([
      {
        content: 'What is the capital of France?',
        options: [
          { text: 'London', isCorrect: false },
          { text: 'Paris', isCorrect: true },
          { text: 'Berlin', isCorrect: false },
          { text: 'Madrid', isCorrect: false },
        ],
        correctAnswer: 'Paris',
        difficulty: 'easy',
        explanation: 'Paris is the capital city of France.',
        tags: [],
      },
      {
        content: 'What is 2 + 2?',
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },
          { text: '5', isCorrect: false },
          { text: '6', isCorrect: false },
        ],
        correctAnswer: '4',
        difficulty: 'easy',
        explanation: '2 + 2 equals 4.',
        tags: [],
      },
      {
        content: 'What is the largest planet in our solar system?',
        options: [
          { text: 'Saturn', isCorrect: false },
          { text: 'Mars', isCorrect: false },
          { text: 'Jupiter', isCorrect: true },
          { text: 'Neptune', isCorrect: false },
        ],
        correctAnswer: 'Jupiter',
        difficulty: 'medium',
        explanation: 'Jupiter is the largest planet in our solar system.',
        tags: [],
      },
      {
        content: 'Who wrote the novel "1984"?',
        options: [
          { text: 'George Orwell', isCorrect: true },
          { text: 'Arthur C. Clarke', isCorrect: false },
          { text: 'Isaac Asimov', isCorrect: false },
          { text: 'Ray Bradbury', isCorrect: false },
        ],
        correctAnswer: 'George Orwell',
        difficulty: 'medium',
        explanation: '"1984" was written by George Orwell.',
        tags: [],
      },
    ]);

    console.log('✅ Created 4 test questions');

    // Create verified question sets
    const sets = await QuestionSet.insertMany([
      {
        title: 'Geography Basics',
        description: 'Test your knowledge of world geography with basic questions about capitals and geography.',
        type: 'Geography',
        questionIds: [questions[0]._id],
        verified: true,
        pin: await QuestionSet.generateUniquePin(),
      },
      {
        title: 'Math Fundamentals',
        description: 'Essential arithmetic operations and basic math problems.',
        type: 'Academic',
        questionIds: [questions[1]._id],
        verified: true,
        pin: await QuestionSet.generateUniquePin(),
      },
      {
        title: 'Space & Astronomy',
        description: 'Explore questions about planets, stars, and the universe.',
        type: 'Academic',
        questionIds: [questions[2]._id],
        verified: true,
        pin: await QuestionSet.generateUniquePin(),
      },
      {
        title: 'Literature Quiz',
        description: 'Test your knowledge of famous books and authors.',
        type: 'Academic',
        questionIds: [questions[3]._id],
        verified: true,
        pin: await QuestionSet.generateUniquePin(),
      },
      {
        title: 'General Knowledge Mix',
        description: 'A mix of questions from different categories.',
        type: 'Other',
        questionIds: [questions[0]._id, questions[2]._id],
        verified: true,
        pin: await QuestionSet.generateUniquePin(),
      },
    ]);

    console.log('✅ Created 5 verified question sets');

    sets.forEach((set) => {
      console.log(`  - ${set.title} (PIN: ${set.pin})`);
    });

    console.log('\n✨ Test data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestSets();
