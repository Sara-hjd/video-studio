"""
Video editor module with proper duration extraction
Provides video information and validation using multiple methods
"""
import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class VideoEditor:
    """Video editor for basic operations with proper duration extraction"""
    
    @classmethod
    def get_video_info(cls, video_path: str) -> Dict:
        """Get video information with actual duration extraction"""
        try:
            if not os.path.exists(video_path):
                raise FileNotFoundError(f"Video file not found: {video_path}")
            
            file_size = os.path.getsize(video_path)
            file_name = os.path.basename(video_path)
            
            # Try to extract actual video information
            duration = cls._extract_duration(video_path)
            width, height = cls._extract_dimensions(video_path)
            has_audio = cls._check_audio(video_path)
            format_type = cls._get_format(video_path)
            
            return {
                'duration': duration,
                'width': width,
                'height': height,
                'has_audio': has_audio,
                'format': format_type,
                'size': file_size,
                'filename': file_name
            }
        except Exception as e:
            logger.error(f"Error retrieving video info: {str(e)}")
            # Return fallback info if extraction fails
            return {
                'duration': 300.0,  # Default 5 minutes (max recording time)
                'width': 1280,      # Default HD width
                'height': 720,      # Default HD height
                'has_audio': True,  # Assume audio is present
                'format': 'webm',   # Default format
                'size': file_size,
                'filename': file_name
            }
    
    @classmethod
    def _extract_duration(cls, video_path: str) -> float:
        """Extract video duration using multiple methods"""
        try:
            # Method 1: Try with ffmpeg-python
            duration = cls._extract_duration_ffmpeg(video_path)
            if duration and duration > 0:
                logger.info(f"Duration extracted via FFmpeg: {duration}s")
                return duration
        except Exception as e:
            logger.warning(f"FFmpeg duration extraction failed: {e}")
        
        try:
            # Method 2: Try with OpenCV (if available)
            duration = cls._extract_duration_opencv(video_path)
            if duration and duration > 0:
                logger.info(f"Duration extracted via OpenCV: {duration}s")
                return duration
        except Exception as e:
            logger.warning(f"OpenCV duration extraction failed: {e}")
        
        try:
            # Method 3: Try with moviepy (if available)
            duration = cls._extract_duration_moviepy(video_path)
            if duration and duration > 0:
                logger.info(f"Duration extracted via MoviePy: {duration}s")
                return duration
        except Exception as e:
            logger.warning(f"MoviePy duration extraction failed: {e}")
        
        # Fallback to default
        logger.warning(f"Could not extract duration for {video_path}, using default 300s")
        return 300.0
    
    @classmethod
    def _extract_duration_ffmpeg(cls, video_path: str) -> Optional[float]:
        """Extract duration using ffmpeg-python"""
        try:
            import ffmpeg
            probe = ffmpeg.probe(video_path)
            duration = float(probe['format']['duration'])
            return duration
        except ImportError:
            logger.warning("ffmpeg-python not available")
            return None
        except Exception as e:
            logger.warning(f"FFmpeg probe failed: {e}")
            return None
    
    @classmethod
    def _extract_duration_opencv(cls, video_path: str) -> Optional[float]:
        """Extract duration using OpenCV"""
        try:
            import cv2
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return None
            
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            fps = cap.get(cv2.CAP_PROP_FPS)
            cap.release()
            
            if fps > 0:
                duration = frame_count / fps
                return duration
            return None
        except ImportError:
            logger.warning("OpenCV not available")
            return None
        except Exception as e:
            logger.warning(f"OpenCV duration extraction failed: {e}")
            return None
    
    @classmethod
    def _extract_duration_moviepy(cls, video_path: str) -> Optional[float]:
        """Extract duration using MoviePy"""
        try:
            from moviepy.editor import VideoFileClip
            with VideoFileClip(video_path) as clip:
                return clip.duration
        except ImportError:
            logger.warning("MoviePy not available")
            return None
        except Exception as e:
            logger.warning(f"MoviePy duration extraction failed: {e}")
            return None
    
    @classmethod
    def _extract_dimensions(cls, video_path: str) -> tuple:
        """Extract video dimensions"""
        try:
            import ffmpeg
            probe = ffmpeg.probe(video_path)
            video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
            if video_stream:
                width = int(video_stream.get('width', 1280))
                height = int(video_stream.get('height', 720))
                return width, height
        except Exception as e:
            logger.warning(f"Could not extract dimensions: {e}")
        
        return 1280, 720  # Default HD dimensions
    
    @classmethod
    def _check_audio(cls, video_path: str) -> bool:
        """Check if video has audio track"""
        try:
            import ffmpeg
            probe = ffmpeg.probe(video_path)
            audio_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'audio'), None)
            return audio_stream is not None
        except Exception as e:
            logger.warning(f"Could not check audio: {e}")
            return True  # Assume audio is present
    
    @classmethod
    def _get_format(cls, video_path: str) -> str:
        """Get video format"""
        try:
            import ffmpeg
            probe = ffmpeg.probe(video_path)
            format_name = probe['format'].get('format_name', 'webm')
            return format_name.split(',')[0]  # Get first format if multiple
        except Exception as e:
            logger.warning(f"Could not get format: {e}")
            return 'webm'  # Default format
    
    @classmethod
    def validate_trim_parameters(cls, video_path: str, start_time: float, end_time: Optional[float]) -> Dict:
        """Validate trim parameters using actual video duration"""
        try:
            if not os.path.exists(video_path):
                return {
                    'valid': False,
                    'error': 'Video file not found'
                }
            
            # Get actual video duration
            total_duration = cls._extract_duration(video_path)
            
            # Validation
            if start_time < 0:
                start_time = 0
            if end_time is None:
                end_time = total_duration
            if end_time > total_duration:
                end_time = total_duration
            if start_time >= end_time:
                return {
                    'valid': False,
                    'error': 'Start time must be less than end time'
                }
            
            # Check that final duration is not too short
            final_duration = end_time - start_time
            if final_duration < 1.0:  # Minimum 1 second
                return {
                    'valid': False,
                    'error': 'Final video must be at least 1 second long'
                }
            
            return {
                'valid': True,
                'original_duration': total_duration,
                'final_duration': final_duration,
                'start_time': start_time,
                'end_time': end_time,
                'trim_start': start_time > 0,
                'trim_end': end_time < total_duration
            }
            
        except Exception as e:
            return {
                'valid': False,
                'error': f'Validation error: {str(e)}'
            }
    
    @classmethod
    def trim_video(cls, input_path: str, output_path: str, 
                   start_time: float = 0, end_time: Optional[float] = None) -> Dict:
        """
        Trim video using FFmpeg for real video editing
        """
        try:
            if not os.path.exists(input_path):
                return {
                    'success': False,
                    'error_message': 'Input video file not found'
                }
            
            # Validate parameters first
            validation = cls.validate_trim_parameters(input_path, start_time, end_time)
            if not validation['valid']:
                return {
                    'success': False,
                    'error_message': validation['error']
                }
            
            # Calculate duration for trimming
            duration = end_time - start_time if end_time else None
            
            # Create output directory if it doesn't exist
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Use FFmpeg to trim the video
            import ffmpeg
            
            input_stream = ffmpeg.input(input_path, ss=start_time)
            
            if duration:
                # Trim with specific duration
                output_stream = input_stream.output(
                    output_path,
                    t=duration,
                    vcodec='libx264',
                    acodec='aac',
                    preset='fast',
                    crf=23
                )
            else:
                # Trim from start_time to end
                output_stream = input_stream.output(
                    output_path,
                    vcodec='libx264',
                    acodec='aac',
                    preset='fast',
                    crf=23
                )
            
            # Run FFmpeg command
            output_stream.overwrite_output().run(quiet=True, capture_stdout=True, capture_stderr=True)
            
            # Verify output file was created
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                logger.info(f"Video trimmed successfully: {input_path} -> {output_path}")
                return {
                    'success': True,
                    'original_duration': validation['original_duration'],
                    'edited_duration': validation['final_duration'],
                    'start_time': start_time,
                    'end_time': end_time,
                    'output_path': output_path,
                    'output_size': os.path.getsize(output_path)
                }
            else:
                return {
                    'success': False,
                    'error_message': 'FFmpeg processing failed - no output file created'
                }
            
        except ImportError:
            logger.error("FFmpeg not available - falling back to simulation")
            return {
                'success': False,
                'error_message': 'FFmpeg not available. Please install ffmpeg-python.'
            }
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error: {str(e)}")
            return {
                'success': False,
                'error_message': f'Video processing failed: {str(e)}'
            }
        except Exception as e:
            logger.error(f"Error in trim_video: {str(e)}")
            return {
                'success': False,
                'error_message': f'Processing error: {str(e)}'
            }
    
    @classmethod
    def create_thumbnail(cls, video_path: str, thumbnail_path: str) -> bool:
        """
        Create video thumbnail using FFmpeg
        """
        try:
            if not os.path.exists(video_path):
                logger.warning(f"Video file not found for thumbnail: {video_path}")
                return False
            
            # Create output directory if it doesn't exist
            os.makedirs(os.path.dirname(thumbnail_path), exist_ok=True)
            
            # Use FFmpeg to extract thumbnail at 1 second mark
            import ffmpeg
            
            (
                ffmpeg
                .input(video_path, ss=1)  # Extract frame at 1 second
                .output(thumbnail_path, vframes=1, format='image2')
                .overwrite_output()
                .run(quiet=True, capture_stdout=True, capture_stderr=True)
            )
            
            # Verify thumbnail was created
            if os.path.exists(thumbnail_path) and os.path.getsize(thumbnail_path) > 0:
                logger.info(f"Thumbnail created successfully: {thumbnail_path}")
                return True
            else:
                logger.error(f"Thumbnail creation failed: {thumbnail_path}")
                return False
            
        except ImportError:
            logger.error("FFmpeg not available for thumbnail creation")
            return False
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg thumbnail error: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error creating thumbnail: {str(e)}")
            return False