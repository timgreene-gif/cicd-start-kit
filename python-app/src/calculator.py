"""
Calculator Module
A simple module for learning CI/CD with Python.

Try breaking a test to see CI fail!
"""


def add(a: float, b: float) -> float:
    """Add two numbers."""
    return a + b


def subtract(a: float, b: float) -> float:
    """Subtract b from a."""
    return a - b


def multiply(a: float, b: float) -> float:
    """Multiply two numbers."""
    return a * b


def divide(a: float, b: float) -> float:
    """
    Divide a by b.
    
    Raises:
        ValueError: If b is zero.
    """
    if b == 0:
        raise ValueError("Cannot divide by zero!")
    return a / b


def percentage(value: float, total: float) -> float:
    """
    Calculate what percentage 'value' is of 'total'.
    
    Useful for PM work - burn rates, utilization, etc!
    
    Example:
        >>> percentage(75, 100)
        75.0
        >>> percentage(18, 30)  # $18M of $30M portfolio
        60.0
    """
    if total == 0:
        raise ValueError("Total cannot be zero!")
    return (value / total) * 100


def burn_rate(spent: float, months: float) -> float:
    """
    Calculate monthly burn rate.
    
    Args:
        spent: Total amount spent
        months: Number of months
    
    Returns:
        Average monthly spend
    
    Example:
        >>> burn_rate(900000, 6)  # $900K over 6 months
        150000.0
    """
    if months <= 0:
        raise ValueError("Months must be positive!")
    return spent / months


def months_remaining(budget: float, current_burn: float) -> float:
    """
    Calculate months until budget exhaustion.
    
    Args:
        budget: Remaining budget
        current_burn: Current monthly burn rate
    
    Returns:
        Months until budget runs out
    
    Example:
        >>> months_remaining(500000, 100000)
        5.0
    """
    if current_burn <= 0:
        raise ValueError("Burn rate must be positive!")
    return budget / current_burn
