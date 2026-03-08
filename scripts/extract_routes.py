#!/usr/bin/env python3
"""Extract routes from server.py into separate route modules."""
import re

SERVER_PY = '/app/backend/server.py'

with open(SERVER_PY, 'r') as f:
    lines = f.readlines()

# Route sections with line ranges (1-indexed, inclusive)
# Each tuple: (start_line, end_line, description)
ROUTE_SECTIONS = {
    'channels': [
        (114, 125, 'health and root'),
        (128, 269, 'country and channel CRUD'),
        (270, 290, 'related channels'),
        (322, 382, 'add channel'),
        (383, 469, 'leaderboard and stats'),
    ],
    'countries': [
        (290, 321, 'neighboring countries'),
        (423, 457, 'map data'),
    ],
    'users': [
        (483, 615, 'auth/session/user'),
    ],
    'engagement': [
        (624, 715, 'channel requests'),
        (729, 838, 'polls'),
        (841, 903, 'favorites'),
        (917, 1108, 'alerts'),
    ],
    'admin': [
        (1111, 2065, 'admin operations'),
    ],
    'contact': [
        (2083, 2215, 'newsletter and contact'),
    ],
    'blog': [
        (2247, 2563, 'blog crud and admin'),
        (2821, 2833, 'auto-generated posts'),
    ],
    'seo': [
        (2567, 2681, 'sitemap'),
        (2685, 2833, 'scheduler triggers and quota'),
    ],
}

def extract_lines(start, end):
    return ''.join(lines[start-1:end])

# Now let me use a simpler approach - create a database import module
# and route files that use it

# For channels.py - combine channel + country + leaderboard routes
channels_code = extract_lines(114, 469)
# For users.py - auth section
users_code = extract_lines(472, 615)
# For engagement.py - requests + polls + favorites + alerts
engagement_code = extract_lines(617, 1108)
# For admin.py - admin operations
admin_code = extract_lines(1111, 2065)
# For contact.py - newsletter + contact
contact_code = extract_lines(2066, 2215)
# For blog.py - blog CRUD
blog_code = extract_lines(2216, 2563) + '\n' + extract_lines(2821, 2833)
# For seo.py - sitemap + scheduler triggers
seo_code = extract_lines(2564, 2833)

# Analyze which imports each route file needs
def analyze_imports(code):
    """Determine needed imports based on code content."""
    imports = []
    
    # Standard lib
    std_imports = []
    if 'os.' in code or 'os.environ' in code:
        std_imports.append('os')
    if 'logging' in code:
        std_imports.append('logging')
    if 'uuid' in code:
        std_imports.append('uuid')
    if 'datetime' in code or 'timedelta' in code:
        imports.append('from datetime import datetime, timezone, timedelta')
    if std_imports:
        imports.insert(0, f"import {', '.join(std_imports)}")
    
    # FastAPI
    fastapi_imports = ['APIRouter']
    if 'HTTPException' in code:
        fastapi_imports.append('HTTPException')
    if 'BackgroundTasks' in code:
        fastapi_imports.append('BackgroundTasks')
    if 'Query' in code:
        fastapi_imports.append('Query')
    if 'Response' in code:
        fastapi_imports.append('Response')
    if 'Request' in code:
        fastapi_imports.append('Request')
    if 'Body' in code:
        fastapi_imports.append('Body')
    imports.append(f"from fastapi import {', '.join(fastapi_imports)}")
    
    if 'PlainTextResponse' in code:
        imports.append("from fastapi.responses import PlainTextResponse")
    if 'JSONResponse' in code:
        imports.append("from fastapi.responses import JSONResponse")
    
    # Typing
    typing_imports = []
    if 'List' in code:
        typing_imports.append('List')
    if 'Optional' in code:
        typing_imports.append('Optional')
    if 'Dict' in code:
        typing_imports.append('Dict')
    if 'Any' in code:
        typing_imports.append('Any')
    if typing_imports:
        imports.append(f"from typing import {', '.join(typing_imports)}")
    
    return imports

# Write route files
def write_route_file(filename, code, extra_imports=None, extra_init=None):
    imports = analyze_imports(code)
    
    # Add database import
    imports.append("from database import db")
    
    if extra_imports:
        imports.extend(extra_imports)
    
    # Replace api_router references with router
    code = code.replace('@api_router.', '@router.')
    code = code.replace('api_router', 'router')
    
    header = '\n'.join(imports)
    router_init = '\nrouter = APIRouter(prefix="/api")\n'
    if extra_init:
        router_init += extra_init + '\n'
    router_init += 'logger = logging.getLogger(__name__)\n' if 'logger' in code else ''
    
    content = header + '\n' + router_init + '\n' + code
    
    filepath = f'/app/backend/routes/{filename}'
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Created {filepath} ({len(content.splitlines())} lines)")

# Channels routes
write_route_file('channels.py', channels_code, 
    extra_imports=[
        "from models import ChannelCreate, ChannelResponse, CountryCreate, CountryResponse",
        "from services.youtube_service import youtube_service",
        "from services.growth_analyzer import get_growth_analyzer",
    ],
    extra_init="growth_analyzer = get_growth_analyzer(db)\n"
)

# Users routes
write_route_file('users.py', users_code,
    extra_imports=[
        "from models import UserResponse, SessionRequest",
    ]
)

# Engagement routes
write_route_file('engagement.py', engagement_code,
    extra_imports=[
        "from models import ChannelRequestCreate, PollCreate, PollVote, AlertCreate, AlertUpdate",
    ]
)

# Admin routes
write_route_file('admin.py', admin_code,
    extra_imports=[
        "from models import AdminStats",
        "from services.youtube_service import youtube_service",
        "from services.ranking_service import get_ranking_service",
        "from services.growth_analyzer import get_growth_analyzer",
    ],
    extra_init="ranking_service = get_ranking_service(db)\ngrowth_analyzer = get_growth_analyzer(db)\n"
)

# Contact routes
write_route_file('contact.py', contact_code,
    extra_imports=[
        "from models import NewsletterSubscribe, ContactFormRequest",
    ]
)

# Blog routes
write_route_file('blog.py', blog_code,
    extra_imports=[
        "from models import BlogPostCreate, BlogPostUpdate",
    ]
)

# SEO routes (sitemap, scheduler triggers)
write_route_file('seo.py', seo_code,
    extra_imports=[
        "from services.youtube_service import youtube_service",
        "from services.ranking_service import get_ranking_service",
        "from services.growth_analyzer import get_growth_analyzer",
        "from services.scheduler_service import get_scheduler_service",
    ],
    extra_init="ranking_service = get_ranking_service(db)\ngrowth_analyzer = get_growth_analyzer(db)\n"
)

print("\nAll route files created!")
