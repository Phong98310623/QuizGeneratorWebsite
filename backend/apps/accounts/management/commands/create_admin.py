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
        # Connect to MongoDB first
        if not connect_mongodb():
            self.stdout.write(
                self.style.ERROR('Cannot connect to MongoDB. Please check configuration.')
            )
            return

        username = options['username']
        email = options['email']
        password = options['password']
        role = options['role']

        # Check if user already exists
        existing_user = User.objects(username=username).first()
        if existing_user:
            self.stdout.write(
                self.style.WARNING(f'User with username "{username}" already exists!')
            )
            # Update user to ADMIN if not already
            if existing_user.role != role or existing_user.status != 'ACTIVE':
                existing_user.role = role
                existing_user.status = 'ACTIVE'
                existing_user.set_password(password)
                existing_user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated user "{username}" to {role} with status ACTIVE'
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'User "{username}" is already {role} with status ACTIVE'
                    )
                )
            return

        # Check if email already exists
        existing_email = User.objects(email=email).first()
        if existing_email:
            self.stdout.write(
                self.style.WARNING(f'User with email "{email}" already exists!')
            )
            # Update user to ADMIN if not already
            if existing_email.role != role or existing_email.status != 'ACTIVE':
                existing_email.role = role
                existing_email.status = 'ACTIVE'
                existing_email.set_password(password)
                existing_email.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Updated user "{existing_email.username}" to {role} with status ACTIVE'
                    )
                )
            else:
                # Update password anyway
                existing_email.set_password(password)
                existing_email.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'User "{existing_email.username}" is already {role} with status ACTIVE. Password updated.'
                    )
                )
            return

        # Create new user
        try:
            user = User(
                username=username,
                email=email,
                role=role,
                status='ACTIVE',  # Auto active for test user
                total_score=0
            )
            user.set_password(password)
            user.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {role} test user!\n'
                    f'   Username: {username}\n'
                    f'   Email: {email}\n'
                    f'   Password: {password}\n'
                    f'   Role: {role}\n'
                    f'   Status: ACTIVE'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating user: {str(e)}')
            )
