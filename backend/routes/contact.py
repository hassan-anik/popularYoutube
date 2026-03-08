import logging
import os
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request
from database import db
from models import NewsletterSubscribe, ContactFormRequest

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

# ==================== CONTACT FORM ====================

import resend
import asyncio

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@toptubeworldpro.com')


# ==================== NEWSLETTER ====================


@router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    """Subscribe to newsletter"""
    email = data.email.lower().strip()
    
    # Validate email format
    if not email or '@' not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    # Check if already subscribed
    existing = await db.newsletter_subscribers.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already subscribed")
    
    # Save subscriber
    subscriber_doc = {
        "email": email,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "status": "active"
    }
    await db.newsletter_subscribers.insert_one(subscriber_doc)
    
    logger.info(f"New newsletter subscriber: {email}")
    return {"status": "success", "message": "Successfully subscribed!"}

@router.get("/newsletter/subscribers")
async def get_newsletter_subscribers():
    """Get all newsletter subscribers (admin)"""
    subscribers = await db.newsletter_subscribers.find(
        {"status": "active"},
        {"_id": 0, "email": 1, "subscribed_at": 1}
    ).to_list(10000)
    return {"subscribers": subscribers, "total": len(subscribers)}


@router.post("/contact")
async def submit_contact_form(form: ContactFormRequest):
    """Handle contact form submissions"""
    try:
        # Build email HTML
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">New Contact Form Submission</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e5e5;">
                    <td style="padding: 12px 0; font-weight: bold; width: 120px;">Name:</td>
                    <td style="padding: 12px 0;">{form.name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e5e5;">
                    <td style="padding: 12px 0; font-weight: bold;">Email:</td>
                    <td style="padding: 12px 0;">{form.email}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e5e5;">
                    <td style="padding: 12px 0; font-weight: bold;">Subject:</td>
                    <td style="padding: 12px 0;">{form.subject}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; font-weight: bold; vertical-align: top;">Message:</td>
                    <td style="padding: 12px 0; white-space: pre-wrap;">{form.message}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
                Sent from TopTube World Pro Contact Form
            </p>
        </div>
        """
        
        # Check if Resend API key is configured
        if not resend.api_key or resend.api_key == '':
            # Log the contact form submission to database instead
            contact_doc = {
                "name": form.name,
                "email": form.email,
                "subject": form.subject,
                "message": form.message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "pending"
            }
            await db.contact_submissions.insert_one(contact_doc)
            logger.info(f"Contact form saved to database (no email configured): {form.email}")
            return {
                "status": "success",
                "message": "Your message has been received. We'll get back to you soon!"
            }
        
        # Send email via Resend
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "reply_to": form.email,
            "subject": f"[TopTube Contact] {form.subject} - from {form.name}",
            "html": html_content
        }
        
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        
        # Also save to database for records
        contact_doc = {
            "name": form.name,
            "email": form.email,
            "subject": form.subject,
            "message": form.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "sent",
            "email_id": email_result.get("id")
        }
        await db.contact_submissions.insert_one(contact_doc)
        
        logger.info(f"Contact form email sent: {form.email} -> {ADMIN_EMAIL}")
        return {
            "status": "success",
            "message": "Your message has been sent. We'll get back to you soon!"
        }
        
    except Exception as e:
        logger.error(f"Error processing contact form: {e}")
        # Save to database even on email failure
        contact_doc = {
            "name": form.name,
            "email": form.email,
            "subject": form.subject,
            "message": form.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "error",
            "error": str(e)
        }
        await db.contact_submissions.insert_one(contact_doc)
        return {
            "status": "success",
            "message": "Your message has been received. We'll get back to you soon!"
        }


