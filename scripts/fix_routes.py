#!/usr/bin/env python3
"""Fix route files: remove duplicate classes, fix imports."""
import re

# Fix users.py - remove duplicate class defs, use shared get_current_user
with open('/app/backend/routes/users.py', 'r') as f:
    content = f.read()

# Remove duplicate class definitions
content = re.sub(r'^class UserResponse\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)
content = re.sub(r'^class SessionRequest\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)

# The get_current_user is still defined here but also in utils - keep it here since users.py is the auth module
# Other files will import from utils

with open('/app/backend/routes/users.py', 'w') as f:
    f.write(content)
print("Fixed users.py")

# Fix engagement.py - remove duplicate classes, add utils import
with open('/app/backend/routes/engagement.py', 'r') as f:
    content = f.read()

# Remove ALL class definitions (they come from models.py now)
content = re.sub(r'^class ChannelRequestCreate\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)
content = re.sub(r'^class PollCreate\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)
content = re.sub(r'^class PollVote\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)
content = re.sub(r'^class AlertCreate\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)
content = re.sub(r'^class AlertUpdate\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)

# Add utils import
if 'from routes.utils import' not in content:
    content = content.replace(
        'from database import db',
        'from database import db\nfrom routes.utils import get_current_user'
    )

with open('/app/backend/routes/engagement.py', 'w') as f:
    f.write(content)
print("Fixed engagement.py")

# Fix blog.py - remove duplicate classes, remove local verify_admin_key and format_number_simple
with open('/app/backend/routes/blog.py', 'r') as f:
    content = f.read()

content = re.sub(r'^class BlogPostCreate\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)
content = re.sub(r'^class BlogPostUpdate\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)

# Remove local function definitions that are now in utils
content = re.sub(r'^def verify_admin_key\(admin_key.*?\n\n', '', content, flags=re.DOTALL|re.MULTILINE)
content = re.sub(r'^def format_number_simple\(num\).*?(?=\n@|\ndef |\nasync def |\nclass )', '', content, flags=re.DOTALL|re.MULTILINE)

# Add utils import
if 'from routes.utils import' not in content:
    content = content.replace(
        'from database import db',
        'from database import db\nfrom routes.utils import verify_admin_key, format_number_simple'
    )

with open('/app/backend/routes/blog.py', 'w') as f:
    f.write(content)
print("Fixed blog.py")

# Fix contact.py - remove duplicate class
with open('/app/backend/routes/contact.py', 'r') as f:
    content = f.read()

content = re.sub(r'^class NewsletterSubscribe\(BaseModel\):.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)

with open('/app/backend/routes/contact.py', 'w') as f:
    f.write(content)
print("Fixed contact.py")

# Fix admin.py - remove local store_channel_stats, add utils import
with open('/app/backend/routes/admin.py', 'r') as f:
    content = f.read()

# Remove local store_channel_stats definition
content = re.sub(r'^async def store_channel_stats\(channel_id.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)

# Add utils import
if 'from routes.utils import' not in content:
    content = content.replace(
        'from database import db',
        'from database import db\nfrom routes.utils import store_channel_stats'
    )

with open('/app/backend/routes/admin.py', 'w') as f:
    f.write(content)
print("Fixed admin.py")

# Fix channels.py - remove local store_channel_stats if present
with open('/app/backend/routes/channels.py', 'r') as f:
    content = f.read()

# Remove local store_channel_stats if defined
content = re.sub(r'^async def store_channel_stats\(channel_id.*?(?=\n@|\ndef |\nasync def )', '', content, flags=re.DOTALL|re.MULTILINE)

# Add utils import if store_channel_stats is used
if 'store_channel_stats' in content and 'from routes.utils import' not in content:
    content = content.replace(
        'from database import db',
        'from database import db\nfrom routes.utils import store_channel_stats'
    )

with open('/app/backend/routes/channels.py', 'w') as f:
    f.write(content)
print("Fixed channels.py")

print("\nAll route files fixed!")
