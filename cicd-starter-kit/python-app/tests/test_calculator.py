"""
Unit Tests for Calculator Module

🎓 LEARNING NOTES:
- Each test function starts with 'test_'
- pytest automatically finds and runs these
- Try making a test fail to see CI catch it!
"""

import pytest
import sys
import os

# Add src to path so we can import calculator
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from calculator import (
    add, subtract, multiply, divide,
    percentage, burn_rate, months_remaining
)


class TestBasicMath:
    """Tests for basic arithmetic operations."""
    
    def test_add_positive_numbers(self):
        assert add(2, 3) == 5
    
    def test_add_negative_numbers(self):
        assert add(-1, -1) == -2
    
    def test_add_mixed_numbers(self):
        assert add(-1, 5) == 4
    
    def test_subtract(self):
        assert subtract(10, 4) == 6
    
    def test_multiply(self):
        assert multiply(3, 4) == 12
    
    def test_multiply_by_zero(self):
        assert multiply(100, 0) == 0
    
    def test_divide(self):
        assert divide(10, 2) == 5
    
    def test_divide_by_zero_raises_error(self):
        """CI should catch if we remove error handling!"""
        with pytest.raises(ValueError, match="Cannot divide by zero"):
            divide(10, 0)


class TestPMFunctions:
    """Tests for Program Management calculations."""
    
    def test_percentage_basic(self):
        assert percentage(75, 100) == 75.0
    
    def test_percentage_portfolio(self):
        """$18M of $30M portfolio = 60%"""
        result = percentage(18, 30)
        assert result == 60.0
    
    def test_percentage_zero_total_raises_error(self):
        with pytest.raises(ValueError):
            percentage(50, 0)
    
    def test_burn_rate_calculation(self):
        """$900K over 6 months = $150K/month"""
        result = burn_rate(900000, 6)
        assert result == 150000.0
    
    def test_burn_rate_invalid_months(self):
        with pytest.raises(ValueError):
            burn_rate(100000, 0)
    
    def test_months_remaining(self):
        """$500K budget at $100K/month = 5 months"""
        result = months_remaining(500000, 100000)
        assert result == 5.0
    
    def test_months_remaining_invalid_burn(self):
        with pytest.raises(ValueError):
            months_remaining(500000, 0)


class TestEdgeCases:
    """Edge cases - good practice for robust code."""
    
    def test_add_floats(self):
        result = add(0.1, 0.2)
        assert abs(result - 0.3) < 0.0001  # Float comparison
    
    def test_large_numbers(self):
        """Handle large DoD contract values!"""
        result = add(18_000_000, 12_000_000)
        assert result == 30_000_000
    
    def test_percentage_over_100(self):
        """Over budget scenario"""
        result = percentage(120, 100)
        assert result == 120.0


# 🎓 TRY THIS: Uncomment the test below to see CI fail!
# 
# def test_intentional_failure():
#     """This test will fail - try it!"""
#     assert 1 == 2, "This should fail and CI will catch it!"
