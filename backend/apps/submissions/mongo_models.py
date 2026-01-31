from mongoengine import Document, StringField, IntField, DateTimeField, DictField, FloatField, ListField, ObjectIdField
from datetime import datetime
from bson import ObjectId

class UserProgress(Document):
    """MongoDB collection - User progress and statistics"""
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    user_id = ObjectIdField(required=True, unique=True)  # Reference tới User._id
    total_quizzes_attempted = IntField(default=0)
    total_quizzes_passed = IntField(default=0)
    total_points_earned = IntField(default=0)
    average_score = FloatField(default=0.0)
    
    # Statistics by difficulty
    easy_attempted = IntField(default=0)
    medium_attempted = IntField(default=0)
    hard_attempted = IntField(default=0)
    
    last_activity = DateTimeField()
    
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'user_progress',
        'indexes': [
            'user_id',
            'total_points_earned',
            'average_score'
        ]
    }

class Achievement(Document):
    """MongoDB collection - User achievements/badges"""
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    user_id = ObjectIdField(required=True)  # Reference tới User._id
    achievement_type = StringField(required=True)  # 'FIRST_QUIZ', 'PERFECT_SCORE', 'STREAK', etc
    title = StringField(required=True)
    description = StringField()
    icon_url = StringField()
    earned_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'achievements',
        'indexes': [
            'user_id',
            'achievement_type',
            'earned_at'
        ]
    }

class Leaderboard(Document):
    """MongoDB collection - Leaderboard"""
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    user_id = ObjectIdField(required=True)  # Reference tới User._id
    username = StringField(required=True)
    score = IntField(required=True)
    rank = IntField()
    quizzes_completed = IntField(default=0)
    average_score = FloatField(default=0.0)
    
    period = StringField(choices=['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'], default='ALL_TIME')
    
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'leaderboard',
        'indexes': [
            ('period', 'rank'),
            'user_id',
            'score'
        ]
    }

