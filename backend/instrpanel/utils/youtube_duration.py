import re
from googleapiclient.discovery import build
from django.conf import settings
import isodate
import cloudinary
import cloudinary.api


def extract_youtube_id(url):
    """
    Extract video ID from normal YouTube URLs.
    """
    pattern = r"(?:v=|youtu\.be/)([^&]+)"
    match = re.search(pattern, url)
    return match.group(1) if match else None


def get_youtube_duration(url):
    """
    Returns duration in seconds.
    """
    video_id = extract_youtube_id(url)

    if not video_id:
        return None

    youtube = build("youtube", "v3", developerKey=settings.YOUTUBE_API_KEY)

    response = youtube.videos().list(
        part="contentDetails",
        id=video_id
    ).execute()

    items = response.get("items")
    if not items:
        return None

    duration_iso = items[0]["contentDetails"]["duration"]

    duration = isodate.parse_duration(duration_iso)

    return int(duration.total_seconds())

def extract_public_id_from_url(url):
    """
    Extract public_id from Cloudinary URL.
    Example:
    https://res.cloudinary.com/cloud/video/upload/v123456/abc123.mp4
    -> abc123
    """
    try:
        parts = url.split("/")
        filename = parts[-1]  # abc123.mp4
        public_id = filename.split(".")[0]  # abc123
        return public_id
    except Exception:
        return None


