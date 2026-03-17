from .auth import router as auth_router
from .profiles import router as profiles_router
from .compatibility import router as compatibility_router
from .matches import router as matches_router
from .messaging import router as messaging_router
from .subscriptions import router as subscriptions_router
from .notifications import router as notifications_router
from .boosts import router as boosts_router
from .admin import admin_router
from .account import router as account_router
from .kyc import router as kyc_router

__all__ = [
    "auth_router",
    "profiles_router",
    "compatibility_router",
    "matches_router",
    "messaging_router",
    "subscriptions_router",
    "notifications_router",
    "boosts_router",
    "admin_router",
    "account_router",
    "kyc_router",
]
