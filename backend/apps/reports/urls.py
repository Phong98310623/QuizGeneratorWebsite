from django.urls import path
from .views import ReportListView, ReportStatusUpdateView

app_name = 'reports'

urlpatterns = [
    path('', ReportListView.as_view(), name='report_list'),
    path('status/', ReportStatusUpdateView.as_view(), name='report_status_update'),
]
