# Migration để xóa Django models - accounts dùng MongoDB (mongo_models.py)
# Không dùng SQLite cho User/AuthToken

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.DeleteModel(name='AuthToken'),
        migrations.DeleteModel(name='User'),
    ]
