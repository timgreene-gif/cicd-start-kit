/**
 * CI/CD Learning Dashboard JavaScript
 * 
 * This file is checked by the CI pipeline!
 * Try introducing a syntax error and watch CI catch it.
 */

// Set deployment timestamp
document.addEventListener('DOMContentLoaded', function() {
    const timestamp = new Date().toLocaleString();
    document.getElementById('deploy-time').textContent = timestamp;
});

/**
 * Calculator function
 * Demonstrates simple interactive functionality
 */
function calculate() {
    const num1 = parseFloat(document.getElementById('num1').value) || 0;
    const num2 = parseFloat(document.getElementById('num2').value) || 0;
    const operation = document.getElementById('operation').value;
    
    let result;
    let display;
    
    switch (operation) {
        case 'add':
            result = num1 + num2;
            display = `${num1} + ${num2} = ${result}`;
            break;
        case 'subtract':
            result = num1 - num2;
            display = `${num1} - ${num2} = ${result}`;
            break;
        case 'multiply':
            result = num1 * num2;
            display = `${num1} × ${num2} = ${result}`;
            break;
        case 'divide':
            if (num2 === 0) {
                display = "Error: Can't divide by zero!";
            } else {
                result = num1 / num2;
                display = `${num1} ÷ ${num2} = ${result.toFixed(2)}`;
            }
            break;
        case 'percentage':
            if (num2 === 0) {
                display = "Error: Total can't be zero!";
            } else {
                result = (num1 / num2) * 100;
                display = `${num1} is ${result.toFixed(1)}% of ${num2}`;
            }
            break;
        default:
            display = "Unknown operation";
    }
    
    document.getElementById('result').textContent = display;
    
    // Add a little animation
    const resultEl = document.getElementById('result');
    resultEl.style.transform = 'scale(1.05)';
    setTimeout(() => {
        resultEl.style.transform = 'scale(1)';
    }, 150);
}

// Allow Enter key to trigger calculation
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calculate();
    }
});

// Console message for learners
console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎓 CI/CD Learning Dashboard                               ║
║                                                            ║
║  This page was deployed automatically by GitHub Actions!   ║
║                                                            ║
║  To learn more:                                            ║
║  1. Check the Actions tab in your GitHub repo              ║
║  2. Look at .github/workflows/ in your code                ║
║  3. Try making a change and watch it deploy                ║
╚════════════════════════════════════════════════════════════╝
`);
