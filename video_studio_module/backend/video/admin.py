# video/admin.py

from django.contrib import admin
from .models import VideoPresentation

@admin.register(VideoPresentation)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at', 'validated', 'final_validated')
    list_filter = ('validated', 'final_validated')
    search_fields = ('user__username',)
