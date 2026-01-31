from django.shortcuts import render
from rest_framework import viewsets
from .mongo_models import Question, QuestionAttempt

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    
class QuestionAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuestionAttempt.objects.all()
