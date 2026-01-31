from mongoengine import Document, StringField, IntField, ListField, DictField, DateTimeField, ReferenceField, EmbeddedDocument, EmbeddedDocumentField, BooleanField, FloatField, TextField
from datetime import datetime

class QuestionEmbedded(EmbeddedDocument):
    """Câu hỏi trong quiz"""
    question_text = StringField(required=True)
    question_type = StringField(required=True, choices=['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'TRUE_FALSE', 'ESSAY'])
    options = ListField(StringField())  # Cho MULTIPLE_CHOICE
    correct_answer = StringField(required=True)
    explanation = TextField()  # Giải thích đáp án
    points = IntField(default=1)
    image_url = StringField()  # Hình ảnh của câu hỏi

class Quiz(Document):
    """Collection Quiz trong MongoDB"""
    title = StringField(required=True, max_length=200)
    description = TextField()
    created_by = StringField(required=True)  # ID của user
    questions = ListField(EmbeddedDocumentField(QuestionEmbedded))
    difficulty = StringField(choices=['EASY', 'MEDIUM', 'HARD'], default='MEDIUM')
    time_limit = IntField(default=0)  # Phút, 0 = không giới hạn
    total_points = IntField(default=0)
    category = StringField(max_length=100)
    tags = ListField(StringField())
    is_published = BooleanField(default=False)
    is_deleted = BooleanField(default=False)
    view_count = IntField(default=0)
    attempt_count = IntField(default=0)
    average_score = FloatField(default=0.0)
    
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'quizzes',
        'indexes': [
            'created_by',
            'created_at',
            'category',
            'is_published',
            'difficulty'
        ]
    }

class QuizSubmission(Document):
    """Nộp bài quiz"""
    quiz_id = StringField(required=True)  # ID của Quiz
    user_id = StringField(required=True)  # ID của User
    answers = ListField(DictField())  # [{'question_index': 0, 'answer': 'value', 'is_correct': True}, ...]
    score = IntField(default=0)
    total_possible_score = IntField(default=0)
    percentage = FloatField(default=0.0)
    time_spent = IntField(default=0)  # Seconds
    submitted_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'quiz_submissions',
        'indexes': [
            'user_id',
            'quiz_id',
            ('user_id', 'quiz_id'),
            'submitted_at'
        ]
    }

