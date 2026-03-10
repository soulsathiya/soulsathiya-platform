import os
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


class EmailService:
    def __init__(self):
        self.api_key: str = os.environ.get("RESEND_API_KEY", "")
        self.from_email: str = os.environ.get(
            "EMAIL_FROM", "SoulSathiya <noreply@soulsathiya.com>"
        )
        self.frontend_url: str = os.environ.get(
            "FRONTEND_URL", "http://localhost:3000"
        ).rstrip("/")

    # ------------------------------------------------------------------
    # Internal send helper
    # ------------------------------------------------------------------
    async def _send(self, to: str, subject: str, html: str) -> bool:
        """Send an email via the Resend API."""
        if not self.api_key:
            logger.warning("RESEND_API_KEY not configured — email not sent to %s", to)
            return False
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    RESEND_API_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": self.from_email,
                        "to": [to],
                        "subject": subject,
                        "html": html,
                    },
                )
            if resp.status_code in (200, 201):
                logger.info("Email sent to %s | subject: %s", to, subject)
                return True
            logger.error(
                "Resend API error %s for %s: %s", resp.status_code, to, resp.text
            )
            return False
        except Exception as exc:
            logger.error("Email send exception for %s: %s", to, exc)
            return False

    # ------------------------------------------------------------------
    # Email verification
    # ------------------------------------------------------------------
    async def send_verification_email(
        self, to: str, name: str, token: str
    ) -> bool:
        """Send an email verification link to the user."""
        verify_url = f"{self.frontend_url}/verify-email?token={token}"
        first_name = name.split()[0] if name else "there"
        html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">💑</div>
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">SoulSathiya</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Find Your Soulmate</p>
    </div>
    <!-- Body -->
    <div style="padding:40px 32px;">
      <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:22px;">Hi {first_name}, please verify your email 👋</h2>
      <p style="color:#555555;line-height:1.7;margin:0 0 28px;font-size:15px;">
        Welcome to SoulSathiya! You're one step away from starting your journey to find meaningful connections.
        Click the button below to verify your email address.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{verify_url}"
           style="display:inline-block;background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);
                  color:#ffffff;padding:15px 40px;border-radius:10px;text-decoration:none;
                  font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(232,121,106,0.35);">
          ✉️ Verify My Email
        </a>
      </div>
      <div style="background:#FFF8F7;border:1px solid #FCE4E1;border-radius:8px;padding:16px 20px;margin:24px 0 0;">
        <p style="color:#888888;font-size:13px;margin:0 0 8px;">⏱ This link expires in <strong>24 hours</strong>.</p>
        <p style="color:#888888;font-size:13px;margin:0;">
          If you didn't create a SoulSathiya account, you can safely ignore this email.
        </p>
      </div>
      <p style="color:#bbbbbb;font-size:11px;margin:20px 0 0;word-break:break-all;line-height:1.5;">
        Or copy and paste this URL into your browser:<br>{verify_url}
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eeeeee;">
      <p style="color:#aaaaaa;font-size:12px;margin:0;">© 2024 SoulSathiya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>"""
        return await self._send(to, "Verify your email — SoulSathiya", html)

    # ------------------------------------------------------------------
    # Password reset
    # ------------------------------------------------------------------
    async def send_password_reset_email(
        self, to: str, name: str, token: str
    ) -> bool:
        """Send a password reset link to the user."""
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        first_name = name.split()[0] if name else "there"
        html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🔐</div>
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">SoulSathiya</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Password Reset</p>
    </div>
    <!-- Body -->
    <div style="padding:40px 32px;">
      <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:22px;">Hi {first_name}, reset your password</h2>
      <p style="color:#555555;line-height:1.7;margin:0 0 28px;font-size:15px;">
        We received a request to reset the password for your SoulSathiya account.
        Click the button below to create a new password.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{reset_url}"
           style="display:inline-block;background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);
                  color:#ffffff;padding:15px 40px;border-radius:10px;text-decoration:none;
                  font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(232,121,106,0.35);">
          🔑 Reset My Password
        </a>
      </div>
      <div style="background:#FFF8F7;border:1px solid #FCE4E1;border-radius:8px;padding:16px 20px;margin:24px 0 0;">
        <p style="color:#888888;font-size:13px;margin:0 0 8px;">⏱ This link expires in <strong>1 hour</strong>.</p>
        <p style="color:#888888;font-size:13px;margin:0;">
          If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
        </p>
      </div>
      <p style="color:#bbbbbb;font-size:11px;margin:20px 0 0;word-break:break-all;line-height:1.5;">
        Or copy and paste this URL into your browser:<br>{reset_url}
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f9f9f9;padding:20px 32px;text-align:center;border-top:1px solid #eeeeee;">
      <p style="color:#aaaaaa;font-size:12px;margin:0;">© 2024 SoulSathiya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>"""
        return await self._send(to, "Reset your password — SoulSathiya", html)

    # ------------------------------------------------------------------
    # Interest received notification
    # ------------------------------------------------------------------
    async def send_interest_received_email(
        self, to: str, recipient_name: str, sender_name: str,
        sender_city: str = "", unsubscribe_token: str = ""
    ) -> bool:
        """Notify a user that someone sent them an interest."""
        first_name = recipient_name.split()[0] if recipient_name else "there"
        sender_first = sender_name.split()[0] if sender_name else "Someone"
        interests_url = f"{self.frontend_url}/interests"
        unsub_url = f"{self.frontend_url}/unsubscribe?token={unsubscribe_token}" if unsubscribe_token else ""
        location_line = f" from {sender_city}" if sender_city else ""
        html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">💌</div>
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">SoulSathiya</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">You have a new interest!</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:22px;">Hi {first_name} 👋</h2>
      <p style="color:#555555;line-height:1.7;margin:0 0 24px;font-size:15px;">
        <strong>{sender_first}</strong>{location_line} has expressed interest in connecting with you on SoulSathiya.
        View their profile and decide if you'd like to accept.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{interests_url}"
           style="display:inline-block;background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);
                  color:#ffffff;padding:15px 40px;border-radius:10px;text-decoration:none;
                  font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(232,121,106,0.35);">
          💑 View Interest
        </a>
      </div>
    </div>
    <div style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #eeeeee;">
      <p style="color:#aaaaaa;font-size:12px;margin:0;">© 2024 SoulSathiya. All rights reserved.</p>
      {f'<p style="color:#aaaaaa;font-size:11px;margin:4px 0 0;"><a href="{unsub_url}" style="color:#aaaaaa;">Unsubscribe</a></p>' if unsub_url else ''}
    </div>
  </div>
</body>
</html>"""
        return await self._send(to, f"{sender_first} is interested in you — SoulSathiya", html)

    # ------------------------------------------------------------------
    # New message notification
    # ------------------------------------------------------------------
    async def send_message_notification_email(
        self, to: str, recipient_name: str, sender_name: str,
        preview: str = "", unsubscribe_token: str = ""
    ) -> bool:
        """Notify a user they received a new message."""
        first_name = recipient_name.split()[0] if recipient_name else "there"
        sender_first = sender_name.split()[0] if sender_name else "Someone"
        messages_url = f"{self.frontend_url}/messages"
        unsub_url = f"{self.frontend_url}/unsubscribe?token={unsubscribe_token}" if unsubscribe_token else ""
        # Truncate preview for safety
        safe_preview = (preview[:80] + "…") if len(preview) > 80 else preview
        html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">💬</div>
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">SoulSathiya</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">New message from {sender_first}</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:22px;">Hi {first_name} 👋</h2>
      <p style="color:#555555;line-height:1.7;margin:0 0 16px;font-size:15px;">
        <strong>{sender_first}</strong> sent you a message on SoulSathiya.
      </p>
      {f'<div style="background:#FFF8F7;border-left:4px solid #E8796A;padding:12px 16px;border-radius:4px;margin:0 0 24px;color:#444;font-size:14px;font-style:italic;">{safe_preview}</div>' if safe_preview else ''}
      <div style="text-align:center;margin:24px 0;">
        <a href="{messages_url}"
           style="display:inline-block;background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);
                  color:#ffffff;padding:15px 40px;border-radius:10px;text-decoration:none;
                  font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(232,121,106,0.35);">
          💬 Reply Now
        </a>
      </div>
    </div>
    <div style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #eeeeee;">
      <p style="color:#aaaaaa;font-size:12px;margin:0;">© 2024 SoulSathiya. All rights reserved.</p>
      {f'<p style="color:#aaaaaa;font-size:11px;margin:4px 0 0;"><a href="{unsub_url}" style="color:#aaaaaa;">Unsubscribe</a></p>' if unsub_url else ''}
    </div>
  </div>
</body>
</html>"""
        return await self._send(to, f"New message from {sender_first} — SoulSathiya", html)

    # ------------------------------------------------------------------
    # Weekly digest
    # ------------------------------------------------------------------
    async def send_weekly_digest_email(
        self, to: str, name: str,
        new_matches: int = 0, unread_messages: int = 0, pending_interests: int = 0,
        unsubscribe_token: str = ""
    ) -> bool:
        """Send a weekly activity digest."""
        first_name = name.split()[0] if name else "there"
        dashboard_url = f"{self.frontend_url}/dashboard"
        unsub_url = f"{self.frontend_url}/unsubscribe?token={unsubscribe_token}" if unsubscribe_token else ""
        html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">📊</div>
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">SoulSathiya</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Your Weekly Summary</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:22px;">Hi {first_name}, here's your week 👋</h2>
      <p style="color:#555555;line-height:1.7;margin:0 0 28px;font-size:15px;">
        Here's a summary of your activity on SoulSathiya this week.
      </p>
      <div style="display:flex;gap:16px;justify-content:center;margin:0 0 32px;flex-wrap:wrap;">
        <div style="background:#FFF8F7;border:1px solid #FCE4E1;border-radius:12px;padding:20px 24px;text-align:center;min-width:120px;">
          <div style="font-size:28px;font-weight:700;color:#E8796A;">{new_matches}</div>
          <div style="color:#888;font-size:13px;margin-top:4px;">New Matches</div>
        </div>
        <div style="background:#FFF8F7;border:1px solid #FCE4E1;border-radius:12px;padding:20px 24px;text-align:center;min-width:120px;">
          <div style="font-size:28px;font-weight:700;color:#E8796A;">{unread_messages}</div>
          <div style="color:#888;font-size:13px;margin-top:4px;">Unread Messages</div>
        </div>
        <div style="background:#FFF8F7;border:1px solid #FCE4E1;border-radius:12px;padding:20px 24px;text-align:center;min-width:120px;">
          <div style="font-size:28px;font-weight:700;color:#E8796A;">{pending_interests}</div>
          <div style="color:#888;font-size:13px;margin-top:4px;">Pending Interests</div>
        </div>
      </div>
      <div style="text-align:center;">
        <a href="{dashboard_url}"
           style="display:inline-block;background:linear-gradient(135deg,#E8796A 0%,#c0555a 100%);
                  color:#ffffff;padding:15px 40px;border-radius:10px;text-decoration:none;
                  font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(232,121,106,0.35);">
          🏠 Go to Dashboard
        </a>
      </div>
    </div>
    <div style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #eeeeee;">
      <p style="color:#aaaaaa;font-size:12px;margin:0;">© 2024 SoulSathiya. All rights reserved.</p>
      {f'<p style="color:#aaaaaa;font-size:11px;margin:4px 0 0;"><a href="{unsub_url}" style="color:#aaaaaa;">Unsubscribe from digest</a></p>' if unsub_url else ''}
    </div>
  </div>
</body>
</html>"""
        return await self._send(to, "Your weekly SoulSathiya summary", html)
