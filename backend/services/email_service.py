import os
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"

# ── Shared design tokens ───────────────────────────────────────────────────
_BG       = "#0C1323"   # deep navy outer background
_CARD     = "#0F1A2E"   # card surface
_CARD2    = "#131F35"   # slightly lighter card (for note boxes)
_GOLD     = "#D4A520"   # primary gold
_GOLD2    = "#B8881A"   # darker gold (gradient end)
_CREAM    = "#F5EDD8"   # warm cream (headings)
_MUTED    = "#9B8E78"   # muted text
_BORDER   = "rgba(212,165,32,0.20)"  # subtle gold border


def _base(logo_url: str, header_subtitle: str, body_html: str, footer_extra: str = "") -> str:
    """
    Shared email shell — dark navy card with gold logo header.
    All emails use this wrapper for visual consistency.
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:{_BG};font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:{_BG};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" width="100%" style="max-width:580px;" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background:{_CARD};border-radius:16px;border:1px solid {_BORDER};overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.5);">

              <!-- Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:32px 32px 28px;text-align:center;border-bottom:1px solid {_BORDER};">
                    <!-- Logo row -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td style="vertical-align:middle;padding-right:10px;">
                          <img src="{logo_url}" alt="SoulSathiya" width="40" height="40"
                               style="display:block;width:40px;height:40px;object-fit:contain;border:0;"
                               onerror="this.style.display='none'">
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:{_CREAM};letter-spacing:-0.3px;">
                            Soul<span style="color:{_GOLD};">Sathiya</span>
                          </span>
                        </td>
                      </tr>
                    </table>
                    <!-- Subtitle -->
                    <p style="margin:10px 0 0;font-size:13px;color:{_MUTED};letter-spacing:0.8px;text-transform:uppercase;">
                      {header_subtitle}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:36px 32px 28px;">
                    {body_html}
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:20px 32px;text-align:center;border-top:1px solid {_BORDER};">
                    <p style="margin:0;font-size:12px;color:{_MUTED};">
                      © 2026 SoulSathiya · India's First AI-Powered Relationship Intelligence Platform
                    </p>
                    {footer_extra}
                    <p style="margin:8px 0 0;font-size:11px;color:rgba(155,142,120,0.55);">
                      This email was sent from a no-reply address. Contact
                      <a href="mailto:support@soulsathiya.com"
                         style="color:{_GOLD};text-decoration:none;">support@soulsathiya.com</a>
                      for help.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>"""


def _cta_button(url: str, label: str) -> str:
    """Gold CTA button — email-safe table-based."""
    return f"""
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:32px auto;">
      <tr>
        <td style="border-radius:10px;background:linear-gradient(135deg,{_GOLD} 0%,{_GOLD2} 100%);
                   box-shadow:0 4px 16px rgba(212,165,32,0.35);">
          <a href="{url}"
             style="display:inline-block;padding:15px 44px;font-family:Arial,Helvetica,sans-serif;
                    font-size:15px;font-weight:700;color:#000000;text-decoration:none;
                    letter-spacing:0.3px;border-radius:10px;">
            {label}
          </a>
        </td>
      </tr>
    </table>"""


def _note_box(content: str) -> str:
    """Subtle note / warning box."""
    return f"""
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
           style="margin:24px 0 0;background:{_CARD2};border:1px solid {_BORDER};border-radius:10px;">
      <tr>
        <td style="padding:16px 20px;font-size:13px;color:{_MUTED};line-height:1.7;">
          {content}
        </td>
      </tr>
    </table>"""


def _stat_box(value: str, label: str) -> str:
    """Stat tile for weekly digest."""
    return f"""
    <td width="33%" style="text-align:center;padding:0 6px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
             style="background:{_CARD2};border:1px solid {_BORDER};border-radius:12px;">
        <tr>
          <td style="padding:20px 12px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:{_GOLD};font-family:Georgia,serif;">{value}</div>
            <div style="font-size:12px;color:{_MUTED};margin-top:5px;">{label}</div>
          </td>
        </tr>
      </table>
    </td>"""


class EmailService:
    def __init__(self):
        self.api_key: str = os.environ.get("RESEND_API_KEY", "")
        self.from_email: str = os.environ.get(
            "EMAIL_FROM", "SoulSathiya <noreply@soulsathiya.com>"
        )
        self.frontend_url: str = os.environ.get(
            "FRONTEND_URL", "http://localhost:3000"
        ).rstrip("/")

    # ── Internal send helper ───────────────────────────────────────────────
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

    # ── Email verification ─────────────────────────────────────────────────
    async def send_verification_email(self, to: str, name: str, token: str) -> bool:
        """Send an email verification link to the user."""
        verify_url  = f"{self.frontend_url}/verify-email?token={token}"
        logo_url    = f"{self.frontend_url}/logo.png"
        first_name  = name.split()[0].title() if name else "there"

        body = f"""
          <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;
                     font-size:24px;font-weight:700;color:{_CREAM};line-height:1.3;">
            Hi {first_name}, please verify your email
          </h2>
          <p style="margin:0 0 6px;font-size:15px;color:{_MUTED};line-height:1.75;">
            Welcome to <strong style="color:{_CREAM};">SoulSathiya</strong>! You're one step away
            from beginning your journey toward a meaningful, compatibility-driven relationship.
          </p>
          <p style="margin:0 0 4px;font-size:15px;color:{_MUTED};line-height:1.75;">
            Click the button below to verify your email address and activate your account.
          </p>
          {_cta_button(verify_url, "✦ Verify My Email")}
          {_note_box(f'''
            <p style="margin:0 0 6px;">
              ⏱ &nbsp;This link expires in <strong style="color:{_CREAM};">24 hours</strong>.
            </p>
            <p style="margin:0;">
              If you didn't create a SoulSathiya account, you can safely ignore this email —
              no action is needed.
            </p>
          ''')}
          <p style="margin:20px 0 0;font-size:11px;color:rgba(155,142,120,0.5);
                    word-break:break-all;line-height:1.6;">
            Or copy this link into your browser:<br>
            <span style="color:rgba(212,165,32,0.55);">{verify_url}</span>
          </p>"""

        html = _base(logo_url, "Email Verification", body)
        return await self._send(to, "Please verify your email — SoulSathiya", html)

    # ── Password reset ─────────────────────────────────────────────────────
    async def send_password_reset_email(self, to: str, name: str, token: str) -> bool:
        """Send a password reset link to the user."""
        reset_url  = f"{self.frontend_url}/reset-password?token={token}"
        logo_url   = f"{self.frontend_url}/logo.png"
        first_name = name.split()[0].title() if name else "there"

        body = f"""
          <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;
                     font-size:24px;font-weight:700;color:{_CREAM};line-height:1.3;">
            Reset your password, {first_name}
          </h2>
          <p style="margin:0 0 6px;font-size:15px;color:{_MUTED};line-height:1.75;">
            We received a request to reset the password for your SoulSathiya account.
          </p>
          <p style="margin:0 0 4px;font-size:15px;color:{_MUTED};line-height:1.75;">
            Click the button below to create a new password. If you did not request this,
            your account remains secure — simply ignore this email.
          </p>
          {_cta_button(reset_url, "✦ Reset My Password")}
          {_note_box(f'''
            <p style="margin:0 0 6px;">
              ⏱ &nbsp;This link expires in <strong style="color:{_CREAM};">1 hour</strong>.
            </p>
            <p style="margin:0;">
              If you didn't request a password reset, your password will remain unchanged.
              Contact <a href="mailto:support@soulsathiya.com"
              style="color:{_GOLD};text-decoration:none;">support@soulsathiya.com</a>
              if you have concerns.
            </p>
          ''')}
          <p style="margin:20px 0 0;font-size:11px;color:rgba(155,142,120,0.5);
                    word-break:break-all;line-height:1.6;">
            Or copy this link into your browser:<br>
            <span style="color:rgba(212,165,32,0.55);">{reset_url}</span>
          </p>"""

        html = _base(logo_url, "Password Reset", body)
        return await self._send(to, "Reset your password — SoulSathiya", html)

    # ── Interest received notification ─────────────────────────────────────
    async def send_interest_received_email(
        self, to: str, recipient_name: str, sender_name: str,
        sender_city: str = "", unsubscribe_token: str = ""
    ) -> bool:
        """Notify a user that someone sent them an interest."""
        first_name   = recipient_name.split()[0].title() if recipient_name else "there"
        sender_first = sender_name.split()[0].title()    if sender_name    else "Someone"
        logo_url     = f"{self.frontend_url}/logo.png"
        interests_url = f"{self.frontend_url}/interests"
        unsub_url    = f"{self.frontend_url}/unsubscribe?token={unsubscribe_token}" if unsubscribe_token else ""
        location_line = f" from <strong style='color:{_CREAM};'>{sender_city}</strong>" if sender_city else ""

        footer_extra = (
            f'<p style="margin:6px 0 0;font-size:11px;color:rgba(155,142,120,0.45);">'
            f'<a href="{unsub_url}" style="color:rgba(155,142,120,0.45);text-decoration:underline;">Unsubscribe</a>'
            f'</p>'
        ) if unsub_url else ""

        body = f"""
          <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;
                     font-size:24px;font-weight:700;color:{_CREAM};line-height:1.3;">
            You have a new interest, {first_name}
          </h2>
          <p style="margin:0 0 6px;font-size:15px;color:{_MUTED};line-height:1.75;">
            <strong style="color:{_CREAM};">{sender_first}</strong>{location_line} has expressed
            interest in connecting with you on SoulSathiya.
          </p>
          <p style="margin:0 0 4px;font-size:15px;color:{_MUTED};line-height:1.75;">
            View their profile and decide if you'd like to accept. Compatibility-matched
            connections are waiting.
          </p>
          {_cta_button(interests_url, "✦ View Interest")}
          {_note_box(f'<p style="margin:0;">Respond promptly — engaged profiles get more quality matches on SoulSathiya.</p>')}"""

        html = _base(logo_url, "New Interest Received", body, footer_extra)
        return await self._send(to, f"{sender_first} is interested in you — SoulSathiya", html)

    # ── New message notification ───────────────────────────────────────────
    async def send_message_notification_email(
        self, to: str, recipient_name: str, sender_name: str,
        preview: str = "", unsubscribe_token: str = ""
    ) -> bool:
        """Notify a user they received a new message."""
        first_name   = recipient_name.split()[0].title() if recipient_name else "there"
        sender_first = sender_name.split()[0].title()    if sender_name    else "Someone"
        logo_url     = f"{self.frontend_url}/logo.png"
        messages_url = f"{self.frontend_url}/messages"
        unsub_url    = f"{self.frontend_url}/unsubscribe?token={unsubscribe_token}" if unsubscribe_token else ""
        safe_preview = (preview[:80] + "…") if len(preview) > 80 else preview

        footer_extra = (
            f'<p style="margin:6px 0 0;font-size:11px;color:rgba(155,142,120,0.45);">'
            f'<a href="{unsub_url}" style="color:rgba(155,142,120,0.45);text-decoration:underline;">Unsubscribe</a>'
            f'</p>'
        ) if unsub_url else ""

        preview_block = f"""
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="margin:16px 0 24px;background:{_CARD2};
                        border-left:3px solid {_GOLD};border-radius:0 8px 8px 0;">
            <tr>
              <td style="padding:14px 18px;font-size:14px;color:{_MUTED};
                         font-style:italic;line-height:1.65;">
                "{safe_preview}"
              </td>
            </tr>
          </table>""" if safe_preview else ""

        body = f"""
          <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;
                     font-size:24px;font-weight:700;color:{_CREAM};line-height:1.3;">
            New message from {sender_first}
          </h2>
          <p style="margin:0 0 6px;font-size:15px;color:{_MUTED};line-height:1.75;">
            <strong style="color:{_CREAM};">{sender_first}</strong> sent you a message on SoulSathiya.
          </p>
          {preview_block}
          {_cta_button(messages_url, "✦ Reply Now")}
          {_note_box(f'<p style="margin:0;">Keep conversations active — responsive members build stronger compatibility signals.</p>')}"""

        html = _base(logo_url, f"New Message from {sender_first}", body, footer_extra)
        return await self._send(to, f"New message from {sender_first} — SoulSathiya", html)

    # ── Weekly digest ──────────────────────────────────────────────────────
    async def send_weekly_digest_email(
        self, to: str, name: str,
        new_matches: int = 0, unread_messages: int = 0, pending_interests: int = 0,
        unsubscribe_token: str = ""
    ) -> bool:
        """Send a weekly activity digest."""
        first_name    = name.split()[0].title() if name else "there"
        logo_url      = f"{self.frontend_url}/logo.png"
        dashboard_url = f"{self.frontend_url}/dashboard"
        unsub_url     = f"{self.frontend_url}/unsubscribe?token={unsubscribe_token}" if unsubscribe_token else ""

        footer_extra = (
            f'<p style="margin:6px 0 0;font-size:11px;color:rgba(155,142,120,0.45);">'
            f'<a href="{unsub_url}" style="color:rgba(155,142,120,0.45);text-decoration:underline;">Unsubscribe from digest</a>'
            f'</p>'
        ) if unsub_url else ""

        body = f"""
          <h2 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;
                     font-size:24px;font-weight:700;color:{_CREAM};line-height:1.3;">
            Your weekly summary, {first_name}
          </h2>
          <p style="margin:0 0 28px;font-size:15px;color:{_MUTED};line-height:1.75;">
            Here's what happened on your SoulSathiya journey this week.
          </p>

          <!-- Stats row -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="margin:0 0 28px;">
            <tr>
              {_stat_box(str(new_matches),       "New Matches")}
              {_stat_box(str(unread_messages),   "Unread Messages")}
              {_stat_box(str(pending_interests), "Pending Interests")}
            </tr>
          </table>

          {_cta_button(dashboard_url, "✦ Go to Dashboard")}
          {_note_box(f'''
            <p style="margin:0;">
              Complete your compatibility profile to attract more high-intent matches.
              <a href="{dashboard_url}" style="color:{_GOLD};text-decoration:none;">
                Continue your journey →
              </a>
            </p>
          ''')}"""

        html = _base(logo_url, "Your Weekly Summary", body, footer_extra)
        return await self._send(to, "Your weekly SoulSathiya summary", html)

    # ── OTP login ──────────────────────────────────────────────────────────
    async def send_otp_email(self, to: str, otp: str) -> bool:
        """Send a 6-digit OTP for passwordless login (Insights unlock flow)."""
        logo_url = f"{self.frontend_url}/logo.png"

        body = f"""
          <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;
                     font-size:24px;font-weight:700;color:{_CREAM};line-height:1.3;">
            Your one-time login code
          </h2>
          <p style="margin:0 0 24px;font-size:15px;color:{_MUTED};line-height:1.75;">
            Use the code below to sign in to SoulSathiya and unlock your
            <strong style="color:{_CREAM};">Relationship Intelligence Report</strong>.
          </p>

          <!-- OTP display box -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                 style="margin:0 0 28px;">
            <tr>
              <td align="center"
                  style="background:{_CARD2};border:2px solid {_GOLD};border-radius:14px;
                         padding:28px 32px;">
                <span style="font-family:Georgia,'Times New Roman',serif;
                             font-size:48px;font-weight:700;color:{_GOLD};
                             letter-spacing:0.25em;line-height:1;">
                  {otp}
                </span>
              </td>
            </tr>
          </table>

          {_note_box(f'''
            <p style="margin:0 0 6px;">
              ⏱ &nbsp;This code expires in <strong style="color:{_CREAM};">10 minutes</strong>.
            </p>
            <p style="margin:0;">
              If you didn't request this code, you can safely ignore this email —
              no account has been created.
            </p>
          ''')}"""

        html = _base(logo_url, "Your Login Code", body)
        return await self._send(to, "Your SoulSathiya login code", html)

    # ── Account deletion confirmation ──────────────────────────────────────
    async def send_account_deletion_email(self, to: str, name: str) -> bool:
        """Send a confirmation email when a user deletes their account."""
        first_name = name.split()[0].title() if name else "there"
        logo_url   = f"{self.frontend_url}/logo.png"

        body = f"""
          <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;
                     font-size:24px;font-weight:700;color:{_CREAM};line-height:1.3;">
            Goodbye, {first_name}
          </h2>
          <p style="margin:0 0 14px;font-size:15px;color:{_MUTED};line-height:1.75;">
            Your SoulSathiya account has been successfully deleted. Your profile is no longer
            visible to other members and your login has been disabled.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:{_MUTED};line-height:1.75;">
            We're sorry to see you go. If this was a mistake or you'd like to return, please
            reach out to our support team — we'll be glad to help restore your account.
          </p>
          {_note_box(f'''
            <p style="margin:0;">
              📧 &nbsp;Need help? Contact us at
              <a href="mailto:support@soulsathiya.com"
                 style="color:{_GOLD};text-decoration:none;">support@soulsathiya.com</a>
            </p>
          ''')}
          <p style="margin:24px 0 0;font-size:14px;color:rgba(155,142,120,0.6);line-height:1.7;">
            Thank you for being part of the SoulSathiya community. We wish you all the best
            in your journey toward a meaningful relationship.
          </p>"""

        html = _base(logo_url, "Account Deleted", body)
        return await self._send(to, "Your SoulSathiya account has been deleted", html)
