"""Email routes for sending reminders and notifications."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings
from ..utils.auth_dep import get_current_user
from sqlalchemy.orm import Session
from ..db import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


class TaskItem(BaseModel):
    text: str
    completed: bool = False


class SendReminderRequest(BaseModel):
    email: str
    tasks: List[TaskItem]
    user_id: Optional[int] = None


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send email using configured SMTP settings."""
    try:
        # Check if email settings are available
        if not settings.SMTP_SERVER or not settings.SMTP_PORT:
            logger.warning("SMTP not configured, skipping email send")
            return False
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM_EMAIL or "noreply@learnbuddy.local"
        msg["To"] = to_email
        
        # Attach HTML body
        msg.attach(MIMEText(body, "html"))
        
        # Send email
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


@router.post("/send-task-reminder")
def send_task_reminder(request: SendReminderRequest):
    """Send email reminder with pending tasks."""
    if not request.email:
        raise HTTPException(status_code=400, detail="Email address required")
    
    if not request.tasks:
        raise HTTPException(status_code=400, detail="No tasks provided")
    
    # Filter pending tasks
    pending_tasks = [t for t in request.tasks if not t.completed]
    
    if not pending_tasks:
        raise HTTPException(status_code=400, detail="No pending tasks to remind")
    
    # Build HTML email
    task_list_html = "\n".join([
        f"<li style='margin: 8px 0;'>{task.text}</li>"
        for task in pending_tasks
    ])
    
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Your Pending Tasks 📋</h2>
            <p>Here are your pending tasks that need attention:</p>
            <ul style="list-style-type: none; padding-left: 0;">
                {task_list_html}
            </ul>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">
                Login to your LearnBuddy account to manage these tasks.
            </p>
        </body>
    </html>
    """
    
    # Send email
    success = send_email(
        to_email=request.email,
        subject=f"Your LearnBuddy Task Reminder ({len(pending_tasks)} pending)",
        body=html_body
    )
    
    if not success:
        raise HTTPException(
            status_code=500, 
            detail="Failed to send email. Please try again later or contact support."
        )
    
    return {
        "status": "success",
        "message": f"Reminder email sent to {request.email}",
        "pending_count": len(pending_tasks)
    }


@router.get("/config")
def email_config():
    """Get email configuration status."""
    return {
        "smtp_configured": bool(settings.SMTP_SERVER),
        "from_email": settings.SMTP_FROM_EMAIL or "noreply@learnbuddy.local"
    }
