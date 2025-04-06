from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
import logging

logger = logging.getLogger(__name__)

async def send_password_reset_email(email: EmailStr, reset_link: str):
    # TODO: Implement actual email sending
    # For now, log the details
    logger.info(f"Password reset link for {email}: {reset_link}")
    print(f"Password reset link for {email}: {reset_link}")  # Console output
    return True