import os
from datetime import timedelta

SECRET_KEY = 'django-insecure-dev-key-change-this-in-production'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'apps.accounts',
    'apps.ai_generator',
    'apps.login',
    'apps.quizzes',
    'apps.submissions',
    'apps.questions',
    'apps.reports',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3'),
    }
}

# MongoDB Configuration
MONGODB_DATABASES = {
    'default': {
        'name': 'quizgenerator',
        'host': 'mongodb+srv://interfacedaodung_db_user:mSlJHNA6oq7LObiZ@quizgeneratorwebsite.xa9ndq7.mongodb.net/?retryWrites=true&w=majority',
    }
}

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(os.path.dirname(__file__), '..', 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ROOT_URLCONF = 'config.urls'

# Cấu hình Custom User Model - Sử dụng MongoDB, không dùng Django default
# AUTH_USER_MODEL = 'accounts.User'  # Được lưu trong MongoDB thay vì SQLite
# DEBUG = False 
DEBUG = True
# Cấu hình DRF
DEFAULT_RENDERERS = (
    'rest_framework.renderers.JSONRenderer',
)


CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    # "http://150.95.104.232:8000",
    "http://150.95.104.232:8080",
]


ALLOWED_HOSTS = ['localhost', '127.0.0.1', '127.0.0.1:8000', '150.95.104.232:8080']

if DEBUG:
    DEFAULT_RENDERERS = DEFAULT_RENDERERS + (
        'rest_framework.renderers.BrowsableAPIRenderer',
    )
else:
    pass  # Use JSON-only when DEBUG=False

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.authentication.MongoJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': DEFAULT_RENDERERS,
}




# Cấu hình JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}



# CORS - Cho phép frontend gọi API
CORS_ALLOW_ALL_ORIGINS = True  # Dev: cho phép mọi origin
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'user-agent',
]

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
