"""
Tests for Phase 4 features:
- Demo Deep Compatibility Report API
- Notification API endpoints
- Admin password change endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDemoDeepReport:
    """Tests for Demo Deep Compatibility Report (public endpoint)"""
    
    def test_demo_report_returns_200(self):
        """Demo report should be accessible without authentication"""
        response = requests.get(f"{BASE_URL}/api/deep/demo-report")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"PASS: Demo report endpoint returned 200")
    
    def test_demo_report_has_required_fields(self):
        """Demo report should contain all required fields"""
        response = requests.get(f"{BASE_URL}/api/deep/demo-report")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = [
            "pair_id", "is_demo", "deep_score", "long_term_outlook",
            "strengths", "growth_areas", "dimension_scores", 
            "conversation_prompts", "generated_at"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        print(f"PASS: Demo report contains all required fields")
    
    def test_demo_report_is_demo_flag(self):
        """Demo report should have is_demo = True"""
        response = requests.get(f"{BASE_URL}/api/deep/demo-report")
        data = response.json()
        
        assert data.get("is_demo") == True, "Demo report should have is_demo=True"
        print(f"PASS: Demo report has is_demo=True")
    
    def test_demo_report_dimension_scores(self):
        """Demo report should have all dimension scores"""
        response = requests.get(f"{BASE_URL}/api/deep/demo-report")
        data = response.json()
        
        expected_dimensions = [
            "expectations_roles", "conflict_repair", "attachment_trust",
            "lifestyle_integration", "intimacy_communication", "family_inlaw_dynamics"
        ]
        
        dimension_scores = data.get("dimension_scores", {})
        for dim in expected_dimensions:
            assert dim in dimension_scores, f"Missing dimension: {dim}"
            assert isinstance(dimension_scores[dim], (int, float)), f"{dim} should be numeric"
        print(f"PASS: Demo report has all dimension scores")
    
    def test_demo_report_deep_score_range(self):
        """Deep score should be in valid range (0-100)"""
        response = requests.get(f"{BASE_URL}/api/deep/demo-report")
        data = response.json()
        
        deep_score = data.get("deep_score")
        assert 0 <= deep_score <= 100, f"Deep score {deep_score} not in valid range 0-100"
        print(f"PASS: Deep score {deep_score} is in valid range")


class TestNotificationAPIUnauthenticated:
    """Tests for notification endpoints without authentication"""
    
    def test_notifications_requires_auth(self):
        """Notifications endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: /api/notifications requires auth (401)")
    
    def test_notification_count_requires_auth(self):
        """Notification count endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/notifications/count")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: /api/notifications/count requires auth (401)")
    
    def test_mark_notification_read_requires_auth(self):
        """Mark notification as read should require authentication"""
        response = requests.post(f"{BASE_URL}/api/notifications/test-notif-id/read")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: POST /api/notifications/<id>/read requires auth (401)")
    
    def test_mark_all_notifications_read_requires_auth(self):
        """Mark all notifications as read should require authentication"""
        response = requests.post(f"{BASE_URL}/api/notifications/read-all")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: POST /api/notifications/read-all requires auth (401)")


class TestAdminPasswordChange:
    """Tests for admin password change functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin session for tests"""
        self.session = requests.Session()
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": "admin@soulsathiya.com", "password": "admin123"}
        )
        self.logged_in = login_response.status_code == 200
        if self.logged_in:
            print("Admin login successful for password change tests")
        yield
        # Logout
        self.session.post(f"{BASE_URL}/api/admin/logout")
    
    def test_admin_login_successful(self):
        """Admin should be able to login with valid credentials"""
        assert self.logged_in, "Admin login failed"
        print("PASS: Admin login successful")
    
    def test_password_change_wrong_old_password(self):
        """Password change should fail with wrong old password"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        response = self.session.post(
            f"{BASE_URL}/api/admin/change-password",
            params={"old_password": "wrongpassword", "new_password": "newpassword123"}
        )
        # Should return 400 for wrong old password
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"PASS: Password change fails with wrong old password (400)")
    
    def test_password_change_requires_auth(self):
        """Password change endpoint should require authentication"""
        # Use a new session without login
        new_session = requests.Session()
        response = new_session.post(
            f"{BASE_URL}/api/admin/change-password",
            params={"old_password": "admin123", "new_password": "newpassword123"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"PASS: Password change requires admin auth (401)")
    
    def test_admin_me_endpoint(self):
        """Admin /me endpoint should return admin info"""
        if not self.logged_in:
            pytest.skip("Admin login failed")
        
        response = self.session.get(f"{BASE_URL}/api/admin/me")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "admin_id" in data, "Response should include admin_id"
        assert "email" in data, "Response should include email"
        assert data["email"] == "admin@soulsathiya.com"
        print(f"PASS: Admin /me endpoint returns admin info")


class TestNotificationAPIAuthenticated:
    """Tests for notification endpoints with user authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup user session for tests"""
        self.session = requests.Session()
        # Register and login a test user
        timestamp = str(int(__import__('time').time()))
        self.test_email = f"test_notif_{timestamp}@test.com"
        
        # Try to register
        register_response = self.session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": self.test_email,
                "full_name": "Test Notification User",
                "password": "testpass123"
            }
        )
        
        if register_response.status_code == 200:
            self.logged_in = True
            print(f"User registered: {self.test_email}")
        elif register_response.status_code == 400:
            # Email might exist, try login
            login_response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": self.test_email, "password": "testpass123"}
            )
            self.logged_in = login_response.status_code == 200
        else:
            self.logged_in = False
        
        yield
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_get_notifications_authenticated(self):
        """Authenticated user should be able to get notifications"""
        if not self.logged_in:
            pytest.skip("User login failed")
        
        response = self.session.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "notifications" in data, "Response should include notifications"
        assert "unread_count" in data, "Response should include unread_count"
        assert isinstance(data["notifications"], list), "Notifications should be a list"
        print(f"PASS: Authenticated user can get notifications")
    
    def test_get_notification_count_authenticated(self):
        """Authenticated user should be able to get notification count"""
        if not self.logged_in:
            pytest.skip("User login failed")
        
        response = self.session.get(f"{BASE_URL}/api/notifications/count")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "unread_count" in data, "Response should include unread_count"
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        print(f"PASS: Authenticated user can get notification count: {data['unread_count']}")
    
    def test_mark_all_as_read_authenticated(self):
        """Authenticated user should be able to mark all notifications as read"""
        if not self.logged_in:
            pytest.skip("User login failed")
        
        response = self.session.post(f"{BASE_URL}/api/notifications/read-all")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should include message"
        print(f"PASS: Authenticated user can mark all notifications as read")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
