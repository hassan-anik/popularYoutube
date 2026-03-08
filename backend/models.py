"""
Pydantic models for TopTube World Pro.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict

class CountryCreate(BaseModel):
    code: str
    name: str
    flag_emoji: str = ""
    region: str = ""

class CountryResponse(BaseModel):
    code: str
    name: str
    flag_emoji: str
    region: str
    channel_count: int = 0
    top_channel: Optional[Dict] = None

class ChannelCreate(BaseModel):
    channel_id: str
    country_code: str

class ChannelResponse(BaseModel):
    channel_id: str
    title: str
    description: str
    country_code: str
    country_name: str
    thumbnail_url: str
    subscriber_count: int
    view_count: int
    video_count: int
    current_rank: int = 0
    previous_rank: int = 0
    daily_subscriber_gain: int = 0
    daily_growth_percent: float = 0
    weekly_growth_percent: float = 0
    monthly_growth_percent: float = 0
    viral_label: str = "Stable"
    viral_score: float = 0
    published_at: str = ""

class ContactFormRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class StatsSnapshot(BaseModel):
    channel_id: str
    subscriber_count: int
    view_count: int
    video_count: int
    timestamp: str

class AdminStats(BaseModel):
    total_countries: int
    total_channels: int
    total_stats_records: int
    last_update: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str = ""
    created_at: str
    login_count: int = 1

class SessionRequest(BaseModel):
    token: str
    email: str
    name: str
    picture: str = ""

class ChannelRequestCreate(BaseModel):
    channel_url: str
    channel_name: str = ""
    country_code: str = ""
    reason: str = ""
    submitted_by: str = ""

class PollCreate(BaseModel):
    question: str
    options: list
    category: str = "general"
    created_by: str = ""
    expires_in_days: int = 7

class PollVote(BaseModel):
    option_index: int
    voter_id: str

class AlertCreate(BaseModel):
    channel_id: str
    channel_name: str = ""
    alert_type: str
    threshold: int = 0

class AlertUpdate(BaseModel):
    enabled: bool = True
    threshold: int = 0

class NewsletterSubscribe(BaseModel):
    email: str
    name: str = ""

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: str = ""
    category: str = "General"
    tags: list = []
    image: str = ""
    status: str = "draft"

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list] = None
    image: Optional[str] = None
    status: Optional[str] = None
