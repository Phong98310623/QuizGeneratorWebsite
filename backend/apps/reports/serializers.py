from rest_framework import serializers
from .mongo_models import Report

class ReportSerializer(serializers.Serializer):
    id = serializers.CharField(source='_id')
    reporter_id = serializers.CharField()
    target_user_id = serializers.CharField(required=False)
    question_id = serializers.CharField(required=False)
    reason = serializers.CharField()
    status = serializers.CharField()
    resolved_by = serializers.CharField(required=False)
    created_at = serializers.DateTimeField()
    resolved_at = serializers.DateTimeField(required=False)
