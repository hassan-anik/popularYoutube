"""
Widget Routes for TopTube World Pro
Provides embeddable widgets for external sites
"""
import logging
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/widgets", tags=["widgets"])

def get_db():
    """Get database instance"""
    from database import db
    return db


# ==================== LIVE SUBSCRIBER COUNT WIDGET ====================

@router.get("/embed/{channel_id}")
async def get_widget_embed_code(
    channel_id: str,
    theme: str = Query("dark", description="Widget theme: dark, light, or transparent"),
    size: str = Query("medium", description="Widget size: small, medium, or large"),
    show_name: bool = Query(True, description="Show channel name"),
    show_thumbnail: bool = Query(True, description="Show channel thumbnail"),
    show_growth: bool = Query(True, description="Show 24h growth"),
    animate: bool = Query(True, description="Enable count animation")
):
    """
    Get embeddable HTML/JS code for a live subscriber count widget
    """
    db = get_db()
    channel = await db.channels.find_one({"channel_id": channel_id}, {"_id": 0})
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Build embed URL
    base_url = "https://mostpopularyoutubechannel.com"
    embed_url = f"{base_url}/api/widgets/live/{channel_id}?theme={theme}&size={size}&show_name={show_name}&show_thumbnail={show_thumbnail}&show_growth={show_growth}&animate={animate}"
    
    # Generate embed code
    iframe_code = f'''<iframe 
    src="{embed_url}" 
    width="{300 if size == 'small' else 400 if size == 'medium' else 500}" 
    height="{80 if size == 'small' else 100 if size == 'medium' else 130}" 
    frameborder="0" 
    scrolling="no"
    style="border: none; overflow: hidden;"
    title="{channel.get('title', 'Channel')} Live Subscriber Count"
></iframe>'''

    # JavaScript embed code (alternative)
    js_code = f'''<div id="toptube-widget-{channel_id}"></div>
<script src="{base_url}/api/widgets/script.js" data-channel="{channel_id}" data-theme="{theme}" data-size="{size}"></script>'''

    return {
        "channel_id": channel_id,
        "channel_name": channel.get("title"),
        "current_subscribers": channel.get("subscriber_count"),
        "embed_codes": {
            "iframe": iframe_code,
            "javascript": js_code,
            "direct_url": embed_url
        },
        "customization_options": {
            "themes": ["dark", "light", "transparent"],
            "sizes": ["small", "medium", "large"],
            "options": ["show_name", "show_thumbnail", "show_growth", "animate"]
        }
    }


@router.get("/live/{channel_id}", response_class=HTMLResponse)
async def get_live_widget(
    channel_id: str,
    theme: str = Query("dark", description="Widget theme"),
    size: str = Query("medium", description="Widget size"),
    show_name: bool = Query(True),
    show_thumbnail: bool = Query(True),
    show_growth: bool = Query(True),
    animate: bool = Query(True)
):
    """
    Returns an HTML widget showing live subscriber count
    Auto-refreshes every 60 seconds
    """
    db = get_db()
    channel = await db.channels.find_one({"channel_id": channel_id}, {"_id": 0})
    
    if not channel:
        return HTMLResponse(
            content="<div style='padding:20px;color:#ef4444;'>Channel not found</div>",
            status_code=404
        )
    
    # Theme colors
    themes = {
        "dark": {
            "bg": "#0a0a0a",
            "text": "#ffffff",
            "subtext": "#9ca3af",
            "accent": "#ef4444",
            "border": "#333333"
        },
        "light": {
            "bg": "#ffffff",
            "text": "#111827",
            "subtext": "#6b7280",
            "accent": "#dc2626",
            "border": "#e5e7eb"
        },
        "transparent": {
            "bg": "transparent",
            "text": "#ffffff",
            "subtext": "#9ca3af",
            "accent": "#ef4444",
            "border": "transparent"
        }
    }
    
    colors = themes.get(theme, themes["dark"])
    
    # Size configurations
    sizes = {
        "small": {"width": 280, "height": 70, "font_size": 18, "thumbnail": 36, "padding": 12},
        "medium": {"width": 360, "height": 90, "font_size": 24, "thumbnail": 48, "padding": 16},
        "large": {"width": 450, "height": 120, "font_size": 32, "thumbnail": 64, "padding": 20}
    }
    
    s = sizes.get(size, sizes["medium"])
    
    # Format subscriber count
    subs = channel.get("subscriber_count", 0)
    growth = channel.get("daily_subscriber_gain", 0)
    
    # Build HTML content conditionally
    thumbnail_html = f'<img class="thumbnail" src="{channel.get("thumbnail_url", "")}" alt="" loading="lazy">' if show_thumbnail else ""
    name_html = f'<div class="name">{channel.get("title", "Channel")[:30]}</div>' if show_name else ""
    growth_html = f'<div class="growth">+{growth:,} today</div>' if show_growth and growth > 0 else ""
    
    # Build animation script
    animation_script = ""
    if animate:
        animation_script = f'''
        let currentCount = {subs};
        const countEl = document.getElementById("subCount");
        
        function animateCount(start, end, duration) {{
            const startTime = performance.now();
            const diff = end - start;
            
            function update(currentTime) {{
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(start + diff * easeOut);
                countEl.textContent = current.toLocaleString();
                
                if (progress < 1) {{
                    requestAnimationFrame(update);
                }}
            }}
            
            requestAnimationFrame(update);
        }}
        
        async function refreshCount() {{
            try {{
                const res = await fetch("/api/widgets/data/{channel_id}");
                const data = await res.json();
                if (data.subscriber_count !== currentCount) {{
                    animateCount(currentCount, data.subscriber_count, 1000);
                    currentCount = data.subscriber_count;
                }}
            }} catch (e) {{
                console.error("Refresh failed:", e);
            }}
        }}
        
        setInterval(refreshCount, 60000);
        '''
    
    html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: {colors["bg"]};
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .widget {{
            background: {colors["bg"]};
            border: 1px solid {colors["border"]};
            border-radius: 12px;
            padding: {s["padding"]}px;
            display: flex;
            align-items: center;
            gap: {s["padding"]}px;
            width: {s["width"]}px;
            max-width: 100%;
        }}
        .thumbnail {{
            width: {s["thumbnail"]}px;
            height: {s["thumbnail"]}px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
        }}
        .info {{
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }}
        .name {{
            color: {colors["text"]};
            font-size: {s["font_size"] * 0.5}px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 4px;
        }}
        .count {{
            color: {colors["accent"]};
            font-size: {s["font_size"]}px;
            font-weight: 700;
            line-height: 1.2;
        }}
        .growth {{
            color: #22c55e;
            font-size: {s["font_size"] * 0.4}px;
            margin-top: 2px;
        }}
        .label {{
            color: {colors["subtext"]};
            font-size: {s["font_size"] * 0.35}px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .powered {{
            color: {colors["subtext"]};
            font-size: 9px;
            text-align: right;
            margin-top: 4px;
            opacity: 0.7;
        }}
        .powered a {{
            color: {colors["accent"]};
            text-decoration: none;
        }}
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; }}
            50% {{ opacity: 0.7; }}
        }}
        .live-indicator {{
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
            margin-right: 6px;
            animation: pulse 2s infinite;
        }}
    </style>
</head>
<body>
    <div class="widget">
        {thumbnail_html}
        <div class="info">
            {name_html}
            <div class="count" id="subCount">{subs:,}</div>
            <div class="label"><span class="live-indicator"></span>Subscribers</div>
            {growth_html}
        </div>
    </div>
    <script>
        {animation_script}
    </script>
</body>
</html>
'''
    
    return HTMLResponse(content=html)


@router.get("/data/{channel_id}")
async def get_widget_data(channel_id: str):
    """
    Get channel data for widget refresh (JSON endpoint)
    """
    db = get_db()
    channel = await db.channels.find_one({"channel_id": channel_id}, {"_id": 0})
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    return {
        "channel_id": channel_id,
        "title": channel.get("title"),
        "subscriber_count": channel.get("subscriber_count", 0),
        "daily_subscriber_gain": channel.get("daily_subscriber_gain", 0),
        "thumbnail_url": channel.get("thumbnail_url"),
        "updated_at": channel.get("updated_at")
    }


@router.get("/script.js", response_class=HTMLResponse)
async def get_widget_script():
    """
    Returns JavaScript SDK for embedding widgets
    """
    js_code = '''
(function() {
    'use strict';
    
    const TOPTUBE_BASE = 'https://mostpopularyoutubechannel.com';
    
    function initTopTubeWidgets() {
        // Find all widget containers
        const containers = document.querySelectorAll('[id^="toptube-widget-"]');
        const scripts = document.querySelectorAll('script[data-channel]');
        
        scripts.forEach(script => {
            const channelId = script.dataset.channel;
            const theme = script.dataset.theme || 'dark';
            const size = script.dataset.size || 'medium';
            const container = script.previousElementSibling;
            
            if (container && channelId) {
                const iframe = document.createElement('iframe');
                iframe.src = `${TOPTUBE_BASE}/api/widgets/live/${channelId}?theme=${theme}&size=${size}`;
                iframe.style.border = 'none';
                iframe.style.width = size === 'small' ? '300px' : size === 'large' ? '500px' : '400px';
                iframe.style.height = size === 'small' ? '80px' : size === 'large' ? '130px' : '100px';
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('frameborder', '0');
                container.appendChild(iframe);
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTopTubeWidgets);
    } else {
        initTopTubeWidgets();
    }
})();
'''
    
    return HTMLResponse(
        content=js_code,
        media_type="application/javascript",
        headers={"Cache-Control": "public, max-age=3600"}
    )


# ==================== WIDGET PAGE DATA ====================

@router.get("/channels")
async def get_popular_channels_for_widgets(limit: int = Query(20, le=100)):
    """
    Get popular channels for widget showcase
    """
    db = get_db()
    cursor = db.channels.find(
        {},
        {"_id": 0, "channel_id": 1, "title": 1, "subscriber_count": 1, "thumbnail_url": 1}
    ).sort("subscriber_count", -1).limit(limit)
    channels = await cursor.to_list(length=limit)
    
    return {
        "channels": channels,
        "total": len(channels)
    }
