from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .mongo_models import Report
from .serializers import ReportSerializer
from apps.accounts.views import DebugOrAuthenticated


# Lấy danh sách reports (chỉ ADMIN)
class ReportListView(APIView):
    permission_classes = (DebugOrAuthenticated,)

    def get(self, request):
        print(f"[ReportListView] GET request received, DEBUG={settings.DEBUG}")
        
        # Trong DEBUG mode, bỏ qua kiểm tra authentication
        if not settings.DEBUG:
            # Kiểm tra quyền - chỉ ADMIN mới có thể xem
            current_user = request.user
            print(f"[ReportListView] Current user: {current_user}, has role: {hasattr(current_user, 'role') if current_user else False}")
            if not current_user or not hasattr(current_user, 'role') or current_user.role != 'ADMIN':
                return Response({
                    'detail': 'Only ADMIN can view reports'
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            print(f"[ReportListView] DEBUG mode: bypassing authentication check")

        # Lấy tất cả reports, sắp xếp theo created_at (mới nhất trước)
        try:
            all_reports = Report.objects.all().order_by('-created_at')
            reports_data = [ReportSerializer(report).data for report in all_reports]
            print(f"[ReportListView] Found {len(reports_data)} reports")
        except Exception as e:
            print(f"[ReportListView] Error fetching reports: {e}")
            import traceback
            print(traceback.format_exc())
            return Response({
                'detail': f'Error fetching reports: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'count': len(reports_data),
            'reports': reports_data
        }, status=status.HTTP_200_OK)


# Cập nhật status của report (resolve/reject)
class ReportStatusUpdateView(APIView):
    permission_classes = (DebugOrAuthenticated,)

    def post(self, request):
        print(f"[ReportStatusUpdateView] POST request received, DEBUG={settings.DEBUG}")
        
        current_user = request.user
        
        # Trong DEBUG mode, bỏ qua kiểm tra authentication
        if not settings.DEBUG:
            # Kiểm tra quyền - chỉ ADMIN mới có thể cập nhật
            print(f"[ReportStatusUpdateView] Current user: {current_user}, has role: {hasattr(current_user, 'role') if current_user else False}")
            if not current_user or not hasattr(current_user, 'role') or current_user.role != 'ADMIN':
                return Response({
                    'detail': 'Only ADMIN can update report status'
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            print(f"[ReportStatusUpdateView] DEBUG mode: bypassing authentication check")

        report_id = request.data.get('report_id')
        new_status = request.data.get('status')  # 'RESOLVED' or 'REJECTED'

        if not report_id or not new_status:
            return Response({
                'detail': 'report_id and status are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if new_status not in ['RESOLVED', 'REJECTED']:
            return Response({
                'detail': 'status must be "RESOLVED" or "REJECTED"'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            print(f"[ReportStatusUpdateView] Updating report {report_id} to status {new_status}")
            from bson import ObjectId
            report = Report.objects(id=ObjectId(report_id)).first()
            if not report:
                return Response({
                    'detail': 'Report not found'
                }, status=status.HTTP_404_NOT_FOUND)

            report.status = new_status
            # Set resolved_by nếu có current_user
            if current_user and hasattr(current_user, 'id'):
                try:
                    report.resolved_by = ObjectId(str(current_user.id))
                except:
                    pass  # Nếu không convert được ObjectId thì bỏ qua
            
            from datetime import datetime
            report.resolved_at = datetime.utcnow()
            report.save()
            
            print(f"[ReportStatusUpdateView] Successfully updated report {report_id} to {new_status}")
            return Response({
                'message': f'Report {report_id} status updated to {new_status}',
                'report': ReportSerializer(report).data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"[ReportStatusUpdateView] Error updating report status: {e}")
            import traceback
            print(traceback.format_exc())
            return Response({
                'detail': f'Error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
