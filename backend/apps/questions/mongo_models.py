from mongoengine import Document, StringField, TextField, DateTimeField, ObjectIdField, ListField, DictField, BooleanField, IntField, EmbeddedDocument, EmbeddedDocumentField
from datetime import datetime
from bson import ObjectId

class QuestionOption(EmbeddedDocument):
    """Embedded document for question options"""
    key = StringField(required=True)  # A, B, C, D
    value = StringField(required=True)

class Question(Document):
    """MongoDB Questions collection"""
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    creator_id = ObjectIdField(required=True)  # Reference tới User._id
    question = TextField(required=True)
    correct_answer = StringField(required=True)  # A | B | C | D
    explanation = TextField()
    options = ListField(EmbeddedDocumentField(QuestionOption))  # [{key: 'A', value: '...'}, ...]
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'questions',
        'indexes': [
            'creator_id',
            'created_at'
        ]
    }

class QuestionAttempt(Document):
    """MongoDB QuestionAttempts collection"""
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    user_id = ObjectIdField(required=True)  # Reference tới User._id
    question_id = ObjectIdField(required=True)  # Reference tới Question._id
    user_answer = StringField(required=True)  # A | B | C | D
    is_correct = BooleanField(required=True)
    score = IntField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'question_attempts',
        'indexes': [
            'user_id',
            'question_id',
            ('user_id', 'question_id'),
            'created_at'
        ]
    }
