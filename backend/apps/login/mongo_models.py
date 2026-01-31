from mongoengine import Document, StringField, DateTimeField, BooleanField, IntField
from datetime import datetime

class LoginLog(Document):
    """MongoDB collection - User login logs"""
    user_id = StringField(required=True)  # Reference tới User._id
    ip_address = StringField()
    user_agent = StringField()
    device_type = StringField()  # desktop, mobile, tablet
    browser = StringField()
    operating_system = StringField()
    login_status = StringField(choices=['SUCCESS', 'FAILED'], default='SUCCESS')
    login_reason = StringField()  # If failed, reason why
    logout_at = DateTimeField(null=True)
    session_duration = IntField(default=0)  # Seconds
    
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'login_logs',
        'indexes': [
            'user_id',
            'login_status',
            'created_at'
        ]
    }
