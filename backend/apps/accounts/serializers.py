from rest_framework import serializers
from .mongo_models import User

class UserSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    status = serializers.CharField()
    total_score = serializers.IntegerField()
    created_at = serializers.SerializerMethodField()

    def get_id(self, obj):
        return str(obj.pk) if obj.pk else str(obj.id)

    def get_created_at(self, obj):
        dt = getattr(obj, 'created_at', None)
        return dt.isoformat() if dt else None

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_username(self, value):
        if User.objects(username=value).first():
            raise serializers.ValidationError('Username already exists')
        return value

    def validate_email(self, value):
        if User.objects(email=value).first():
            raise serializers.ValidationError('Email already exists')
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            role='USER',
            status='ACTIVE',
            total_score=0
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class AdminRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=['ADMIN', 'MOD'], required=True)

    def validate_username(self, value):
        if User.objects(username=value).first():
            raise serializers.ValidationError('Username already exists')
        return value

    def validate_email(self, value):
        if User.objects(email=value).first():
            raise serializers.ValidationError('Email already exists')
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            role=validated_data['role'],
            status='PENDING',  # Cần được duyệt
            total_score=0
        )
        user.set_password(validated_data['password'])
        user.save()
        return user