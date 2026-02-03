"""
Django management command để tạo admin test user
Usage: python manage.py create_admin
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import mongoengine as me
from apps.accounts.mongo_models import User


def connect_mongodb():
    """Kết nối MongoDB"""
    try:
        mongodb_config = settings.MONGODB_DATABASES['default']
        me.connect(
            db=mongodb_config['name'],
            host=mongodb_config['host'],
            connectTimeoutMS=30000,
            serverSelectionTimeoutMS=30000,
        )
        return True
    except Exception as e:
        print(f"✗ MongoDB connection error: {e}")
        return False


class Command(BaseCommand):
    help = 'Tạo tài khoản ADMIN test'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Username cho admin (default: admin)',
        )
        parser.add_argument(
            '--email',
            type=str,
            default='admin@test.com',
            help='Email cho admin (default: admin@test.com)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Password cho admin (default: admin123)',
        )
        parser.add_argument(
            '--role',
            type=str,
            choices=['ADMIN', 'MOD'],
            default='ADMIN',
            help='Role cho admin (default: ADMIN)',
        )

    def handle(self, *args, **options):
        # Kết nối MongoDB trước
        if not connect_mongodb():
            self.stdout.write(
                self.style.ERROR('❌ Không thể kết nối MongoDB. Vui lòng kiểm tra cấu hình.')
            )
            return

        username = options['username']
        email = options['email']
        password = options['password']
        role = options['role']

        # Kiểm tra xem user đã tồn tại chưa
        existing_user = User.objects(username=username).first()
        if existing_user:
            self.stdout.write(
                self.style.WARNING(f'User với username "{username}" đã tồn tại!')
            )
            # Cập nhật user thành ADMIN nếu chưa phải
            if existing_user.role != role or existing_user.status != 'ACTIVE':
                existing_user.role = role
                existing_user.status = 'ACTIVE'
                existing_user.set_password(password)
                existing_user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Đã cập nhật user "{username}" thành {role} với status ACTIVE'
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'User "{username}" đã là {role} với status ACTIVE'
                    )
                )
            return

        # Kiểm tra email đã tồn tại chưa
        existing_email = User.objects(email=email).first()
        if existing_email:
            self.stdout.write(
                self.style.WARNING(f'User với email "{email}" đã tồn tại!')
            )
            return

        # Tạo user mới
        try:
            user = User(
                username=username,
                email=email,
                role=role,
                status='ACTIVE',  # Tự động active cho test user
                total_score=0
            )
            user.set_password(password)
            user.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Đã tạo {role} test user thành công!\n'
                    f'   Username: {username}\n'
                    f'   Email: {email}\n'
                    f'   Password: {password}\n'
                    f'   Role: {role}\n'
                    f'   Status: ACTIVE'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Lỗi khi tạo user: {str(e)}')
            )
