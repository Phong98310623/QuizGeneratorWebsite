from mongoengine import Document, StringField, IntField, BooleanField, DateTimeField, EmailField, ObjectIdField
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId

class User(Document):
    """MongoDB Users collection"""
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    username = StringField(required=True, unique=True, max_length=150)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    
    role = StringField(choices=['USER', 'ADMIN', 'MOD'], default='USER')
    status = StringField(choices=['ACTIVE', 'BLOCKED', 'PENDING'], default='ACTIVE')
    total_score = IntField(default=0)
    
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'users',
        'indexes': [
            'username',
            'email',
            'created_at'
        ]
    }
    
    def set_password(self, password):
        """Hash và lưu password"""
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        """Kiểm tra password"""
        return check_password_hash(self.password, password)


class AuthToken(Document):
    """MongoDB AuthToken collection"""
    _id = ObjectIdField(primary_key=True, default=ObjectId)
    user_id = ObjectIdField(required=True)  # Reference tới User._id
    access_token = StringField(required=True)
    refresh_token = StringField(required=True)
    ip_address = StringField()
    expires_at = DateTimeField(required=True)
    revoked = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'auth_tokens',
        'indexes': [
            'user_id',
            'access_token',
            'refresh_token',
            'created_at'
        ]
    }

