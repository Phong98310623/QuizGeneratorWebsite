from rest_framework import serializers
from .mongo_models import Report
from apps.accounts.mongo_models import User

class ReportSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    reporter_id = serializers.SerializerMethodField()
    target_user_id = serializers.SerializerMethodField()
    question_id = serializers.SerializerMethodField()
    reason = serializers.CharField()
    status = serializers.CharField()
    resolved_by = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    resolved_at = serializers.SerializerMethodField()
    # Join fields for UI
    reporter_name = serializers.SerializerMethodField()
    target_name = serializers.SerializerMethodField()

    def get_id(self, obj):
        return str(obj.pk) if obj.pk else str(obj.id)

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
