# AI Quiz Generator

Website tạo câu hỏi trắc nghiệm tích hợp AI và tự động hoá.

## Tech Stack
- Backend: Django REST Framework
- Frontend: React (Vite)
- AI: OpenAI API
- Automation: n8n (planned)

## Features
- Create quiz manually
- Generate quiz by AI
- Take quiz & auto grading

## Run locally
### Backend
cd backend
pip install -r requirements.txt
python manage.py runserver

### Frontend
cd frontend
npm install
npm run dev




db_key

interfacedaodung_db_user
mSlJHNA6oq7LObiZ


npm install mongodb


mongodb+srv://interfacedaodung_db_user:mSlJHNA6oq7LObiZ@quizgeneratorwebsite.xa9ndq7.mongodb.net/?appName=QuizGeneratorWebsite





const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://interfacedaodung_db_user:mSlJHNA6oq7LObiZ@quizgeneratorwebsite.xa9ndq7.mongodb.net/?appName=QuizGeneratorWebsite";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


mongodb+srv://interfacedaodung_db_user:mSlJHNA6oq7LObiZ@quizgeneratorwebsite.xa9ndq7.mongodb.net/