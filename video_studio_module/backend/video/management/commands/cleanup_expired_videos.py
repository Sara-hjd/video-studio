from django.core.management.base import BaseCommand
from django.utils import timezone
from video.models import VideoPresentation
import os
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Delete videos that have expired (older than 15 days)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now()
        
        # Get expired videos
        expired_videos = VideoPresentation.objects.filter(
            expires_at__lt=now
        )
        
        count = expired_videos.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No expired videos found.')
            )
            return
        
        self.stdout.write(f'Found {count} expired video(s)')
        
        if dry_run:
            self.stdout.write('DRY RUN - No videos will be deleted')
            for video in expired_videos:
                self.stdout.write(f'  - Video {video.id}: {video.title} (expired: {video.expires_at})')
            return
        
        deleted_count = 0
        for video in expired_videos:
            try:
                # Delete the video file if it exists
                if video.video and os.path.exists(video.video.path):
                    os.remove(video.video.path)
                    self.stdout.write(f'Deleted file: {video.video.path}')
                
                # Delete the database record
                video.delete()
                deleted_count += 1
                self.stdout.write(f'Deleted video {video.id}: {video.title}')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error deleting video {video.id}: {str(e)}')
                )
                logger.error(f'Error deleting video {video.id}: {str(e)}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {deleted_count} expired video(s)')
        ) 