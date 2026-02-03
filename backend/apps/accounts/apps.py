from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = 'apps.accounts'

    def ready(self):
        """Initialize MongoDB connection when app is ready"""
        try:
            import mongoengine as me
            from django.conf import settings
            
            # Đảm bảo MongoDB được connect sớm để authentication có thể hoạt động
            mongodb_config = settings.MONGODB_DATABASES['default']
            me.connect(
                db=mongodb_config['name'],
                host=mongodb_config['host'],
                connectTimeoutMS=30000,
                serverSelectionTimeoutMS=30000,
            )
            print("[Accounts] MongoDB connected successfully")
        except Exception as e:
            print(f"[Accounts] MongoDB connection error: {e}")
            import traceback
            traceback.print_exc()