from rest_framework import serializers
from .mongo_models import Report
from apps.accounts.mongo_models import User

class ReportSerializer(serializers.Serializer):
    # Don't define _id here - build it manually in to_representation()
    # Use SerializerMethodField for all fields to avoid DRF auto-resolving
    reporter_id = serializers.SerializerMethodField()
    target_user_id = serializers.SerializerMethodField()
    question_id = serializers.SerializerMethodField()
    reason = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    resolved_by = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    resolved_at = serializers.SerializerMethodField()
    # Join fields for UI
    reporter_name = serializers.SerializerMethodField()
    target_name = serializers.SerializerMethodField()

    def to_representation(self, instance):
        """Build representation manually to avoid DRF trying to resolve 'id' field"""
        # Build representation completely manually - don't call super()
        ret = {
            '_id': str(instance.pk) if instance.pk else None,
            'reporter_id': self.get_reporter_id(instance),
            'target_user_id': self.get_target_user_id(instance),
            'question_id': self.get_question_id(instance),
            'reason': self.get_reason(instance),
            'status': self.get_status(instance),
            'resolved_by': self.get_resolved_by(instance),
            'created_at': self.get_created_at(instance),
            'resolved_at': self.get_resolved_at(instance),
            'reporter_name': self.get_reporter_name(instance),
            'target_name': self.get_target_name(instance),
        }
        return ret

    def get_reason(self, obj):
        return getattr(obj, 'reason', '')

    def get_status(self, obj):
        return getattr(obj, 'status', 'PENDING')

    def get_reporter_id(self, obj):
        return str(obj.reporter_id) if obj.reporter_id else None

    def get_target_user_id(self, obj):
        return str(obj.target_user_id) if obj.target_user_id else None

    def get_question_id(self, obj):
        return str(obj.question_id) if obj.question_id else None

    def get_resolved_by(self, obj):
        return str(obj.resolved_by) if obj.resolved_by else None

    def get_created_at(self, obj):
        dt = getattr(obj, 'created_at', None)
        return dt.isoformat() if dt else None

    def get_resolved_at(self, obj):
        dt = getattr(obj, 'resolved_at', None)
        return dt.isoformat() if dt else None

    def get_reporter_name(self, obj):
        """Lấy username của reporter"""
        try:
            if obj.reporter_id:
                reporter = User.objects(id=obj.reporter_id).first()
                return reporter.username if reporter else 'Unknown'
        except:
            pass
        return 'Unknown'

    def get_target_name(self, obj):
        """Lấy username của target user nếu có"""
        try:
            if obj.target_user_id:
                target = User.objects(id=obj.target_user_id).first()
                return target.username if target else 'Unknown'
        except:
            pass
        return None
