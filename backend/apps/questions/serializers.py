from rest_framework import serializers
from .mongo_models import Question, QuestionAttempt, QuestionOption

class QuestionOptionSerializer(serializers.Serializer):
    key = serializers.CharField()
    value = serializers.CharField()

class QuestionSerializer(serializers.Serializer):
    id = serializers.CharField(source='_id')
    creator_id = serializers.CharField()
    question = serializers.CharField()
    correct_answer = serializers.CharField()
    explanation = serializers.CharField()
    options = QuestionOptionSerializer(many=True)
    created_at = serializers.DateTimeField()

class QuestionAttemptSerializer(serializers.Serializer):
    id = serializers.CharField(source='_id')
    user_id = serializers.CharField()
    question_id = serializers.CharField()
    user_answer = serializers.CharField()
    is_correct = serializers.BooleanField()
    score = serializers.IntegerField()
    created_at = serializers.DateTimeField()
