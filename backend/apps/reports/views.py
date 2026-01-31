from django.shortcuts import render
from rest_framework import viewsets
from .mongo_models import Report

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
