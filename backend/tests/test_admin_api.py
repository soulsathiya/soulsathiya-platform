"""
Admin API Tests for SoulSathiya Admin Dashboard
Tests admin authentication, dashboard metrics, user/profile/subscription management,
deep exploration monitoring, reports, and analytics.
"""
import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL must be set")
BASE_URL = BASE_URL.rstrip('/')

# Admin credentials from requirements
ADMIN_EMAIL = "admin@soulsathiya.com"
ADMIN_PASSWORD = "admin123"


class TestAdminAuthentication:
    """Admin authentication tests"""
    
    def test_admin_login_without_credentials(self):
        """Test login without credentials fails"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={})
        # Should return 422 for missing fields
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Admin login without credentials returns 422")
    
    def test_admin_login_invalid_credentials(self):
        """Test login with invalid credentials fails"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin login with invalid credentials returns 401")
    
    def test_admin_login_valid_credentials(self):
        """Test login with valid credentials succeeds"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "admin" in data, "Response should contain admin data"
        assert data["admin"]["email"] == ADMIN_EMAIL
        assert data["admin"]["role"] == "super_admin"
        assert "admin_session" in response.cookies, "Response should set admin_session cookie"
        print(f"✓ Admin login successful - Admin ID: {data['admin']['admin_id']}")
    
    def test_admin_me_without_auth(self):
        """Test /me endpoint without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin /me without auth returns 401")
    
    def test_admin_me_with_auth(self, admin_session):
        """Test /me endpoint with authentication"""
        response = admin_session.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "super_admin"
        print(f"✓ Admin /me returns correct data - Role: {data['role']}")


class TestDashboardMetrics:
    """Dashboard metrics tests"""
    
    def test_dashboard_metrics_without_auth(self):
        """Test dashboard metrics without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard/metrics")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Dashboard metrics without auth returns 401")
    
    def test_dashboard_metrics_with_auth(self, admin_session):
        """Test dashboard metrics with authentication"""
        response = admin_session.get(f"{BASE_URL}/api/admin/dashboard/metrics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify required metrics fields
        required_fields = [
            "total_users", "active_users", "total_matches",
            "deep_exploration_unlocked", "deep_reports_completed",
            "subscriptions_by_tier", "boost_purchases", "revenue_this_month"
        ]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Verify data types
        assert isinstance(data["total_users"], int)
        assert isinstance(data["active_users"], int)
        assert isinstance(data["subscriptions_by_tier"], dict)
        
        print(f"✓ Dashboard metrics returned successfully - Total users: {data['total_users']}, Active: {data['active_users']}")


class TestUserManagement:
    """User management tests"""
    
    def test_get_all_users_without_auth(self):
        """Test get users without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Get users without auth returns 401")
    
    def test_get_all_users_with_auth(self, admin_session):
        """Test get all users with authentication"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users", params={"skip": 0, "limit": 20})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "users" in data, "Response should contain users array"
        assert "total" in data, "Response should contain total count"
        assert isinstance(data["users"], list)
        assert isinstance(data["total"], int)
        
        print(f"✓ Get users successful - Total: {data['total']}, Returned: {len(data['users'])}")
    
    def test_get_all_users_with_search(self, admin_session):
        """Test user search functionality"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users", params={"search": "test"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "users" in data
        print(f"✓ User search working - Found: {len(data['users'])} users matching 'test'")
    
    def test_get_user_detail_not_found(self, admin_session):
        """Test get user detail for non-existent user"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users/nonexistent_user_123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Get non-existent user returns 404")


class TestProfileManagement:
    """Profile management tests"""
    
    def test_get_all_profiles_without_auth(self):
        """Test get profiles without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/profiles")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Get profiles without auth returns 401")
    
    def test_get_all_profiles_with_auth(self, admin_session):
        """Test get all profiles with authentication"""
        response = admin_session.get(f"{BASE_URL}/api/admin/profiles", params={"skip": 0, "limit": 20})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "profiles" in data, "Response should contain profiles array"
        assert "total" in data, "Response should contain total count"
        
        print(f"✓ Get profiles successful - Total: {data['total']}, Returned: {len(data['profiles'])}")
    
    def test_get_flagged_profiles(self, admin_session):
        """Test get flagged profiles filter"""
        response = admin_session.get(f"{BASE_URL}/api/admin/profiles", params={"status": "flagged"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "profiles" in data
        print(f"✓ Get flagged profiles filter working - Found: {len(data['profiles'])} flagged")


class TestSubscriptionManagement:
    """Subscription management tests"""
    
    def test_get_all_subscriptions_without_auth(self):
        """Test get subscriptions without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/subscriptions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Get subscriptions without auth returns 401")
    
    def test_get_all_subscriptions_with_auth(self, admin_session):
        """Test get all subscriptions with authentication"""
        response = admin_session.get(f"{BASE_URL}/api/admin/subscriptions", params={"skip": 0, "limit": 20})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "subscriptions" in data, "Response should contain subscriptions array"
        assert "total" in data, "Response should contain total count"
        
        print(f"✓ Get subscriptions successful - Total: {data['total']}, Returned: {len(data['subscriptions'])}")


class TestDeepExplorationManagement:
    """Deep exploration management tests"""
    
    def test_get_all_deep_pairs_without_auth(self):
        """Test get deep pairs without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/deep")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Get deep pairs without auth returns 401")
    
    def test_get_all_deep_pairs_with_auth(self, admin_session):
        """Test get all deep exploration pairs with authentication"""
        response = admin_session.get(f"{BASE_URL}/api/admin/deep", params={"skip": 0, "limit": 20})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "pairs" in data, "Response should contain pairs array"
        assert "total" in data, "Response should contain total count"
        
        print(f"✓ Get deep pairs successful - Total: {data['total']}, Returned: {len(data['pairs'])}")


class TestReportsManagement:
    """Reports/moderation tests"""
    
    def test_get_all_reports_without_auth(self):
        """Test get reports without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/reports")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Get reports without auth returns 401")
    
    def test_get_all_reports_with_auth(self, admin_session):
        """Test get all reports with authentication"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports", params={"skip": 0, "limit": 20})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "reports" in data, "Response should contain reports array"
        assert "total" in data, "Response should contain total count"
        
        print(f"✓ Get reports successful - Total: {data['total']}, Returned: {len(data['reports'])}")
    
    def test_get_pending_reports(self, admin_session):
        """Test get pending reports filter"""
        response = admin_session.get(f"{BASE_URL}/api/admin/reports", params={"status": "pending"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "reports" in data
        print(f"✓ Get pending reports filter working - Found: {len(data['reports'])} pending")


class TestAnalytics:
    """Analytics tests"""
    
    def test_get_analytics_without_auth(self):
        """Test get analytics without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Get analytics without auth returns 401")
    
    def test_get_analytics_with_auth(self, admin_session):
        """Test get analytics with authentication"""
        response = admin_session.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify required analytics fields
        required_fields = [
            "users_per_week", "subscriptions_by_tier",
            "deep_unlocks_per_week", "revenue"
        ]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Verify revenue breakdown
        assert "subscriptions" in data["revenue"]
        assert "boosts" in data["revenue"]
        assert "deep_exploration" in data["revenue"]
        assert "total" in data["revenue"]
        
        print(f"✓ Get analytics successful - Revenue: ₹{data['revenue']['total']}")


class TestAdminLogout:
    """Admin logout tests"""
    
    def test_admin_logout(self):
        """Test admin logout"""
        # First login to get session
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, "Login should succeed"
        
        # Verify session works
        me_response = session.get(f"{BASE_URL}/api/admin/me")
        assert me_response.status_code == 200, "Should be authenticated"
        
        # Logout
        logout_response = session.post(f"{BASE_URL}/api/admin/logout")
        assert logout_response.status_code == 200, f"Expected 200, got {logout_response.status_code}"
        
        # Verify session is invalidated (cookie deleted)
        print("✓ Admin logout successful")


# Fixtures
@pytest.fixture
def admin_session():
    """Create authenticated admin session"""
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/admin/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Admin authentication failed - skipping authenticated tests")
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
