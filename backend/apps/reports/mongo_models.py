from mongoengine import Document, StringField, TextField, DateTimeField, ObjectIdField
from datetime import datetime
from bson import ObjectId

class Report(Document):
    """MongoDB Reports collection"""
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    reporter_id = ObjectIdField(required=True)  # Reference tới User._id
    target_user_id = ObjectIdField()  # Reference tới User._id (nullable)
    question_id = ObjectIdField()  # Reference tới Question._id (nullable)
    reason = TextField(required=True)
    status = StringField(choices=['PENDING', 'RESOLVED', 'REJECTED'], default='PENDING')
    resolved_by = ObjectIdField()  # Reference tới User._id (nullable)
    created_at = DateTimeField(default=datetime.utcnow)
    resolved_at = DateTimeField()  # (nullable)
    
    meta = {
        'collection': 'reports',
        'indexes': [
            'reporter_id',
            'target_user_id',
            'question_id',
            'status',
            'created_at'
        ]
    }
