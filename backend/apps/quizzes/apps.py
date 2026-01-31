from django.apps import AppConfig


class QuizzesConfig(AppConfig):
    name = 'apps.quizzes'

    def ready(self):
        """Initialize MongoDB connection when app is ready"""
        try:
            import mongoengine as me
            from django.conf import settings
            import threading
            
            def connect_mongodb():
                try:
                    mongodb_config = settings.MONGODB_DATABASES['default']
                    me.connect(
                        db=mongodb_config['name'],
                        host=mongodb_config['host'],
                        connectTimeoutMS=30000,
                        serverSelectionTimeoutMS=30000,
                    )
                    print("✓ MongoDB connected successfully")
                except Exception as e:
                    print(f"✗ MongoDB connection error: {e}")
            
            # Kết nối MongoDB trong background thread để không block Django
            thread = threading.Thread(target=connect_mongodb, daemon=True)
            thread.start()
        except Exception as e:
            print(f"Error initializing MongoDB: {e}")
