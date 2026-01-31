from mongoengine import Document, StringField, TextField, IntField, BooleanField, DateTimeField, ObjectIdField, ListField, EmbeddedDocument, EmbeddedDocumentField
from datetime import datetime
from bson import ObjectId

class QuestionSetItem(EmbeddedDocument):
    """Embedded document for question set items"""
    question_id = ObjectIdField(required=True)  # Reference tới Question._id
    order_no = IntField(required=True)
    score = IntField(required=True)

class QuestionSet(Document):
    """MongoDB QuestionSets collection"""
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    title = StringField(required=True, max_length=200)
    description = TextField()
    creator_id = ObjectIdField(required=True)  # Reference tới User._id
    is_public = BooleanField(default=False)
    total_questions = IntField(default=0)
    total_score = IntField(default=0)
    time_limit = IntField(default=0)  # seconds
    items = ListField(EmbeddedDocumentField(QuestionSetItem))
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'question_sets',
        'indexes': [
            'creator_id',
            'is_public',
            'created_at'
        ]
    }
