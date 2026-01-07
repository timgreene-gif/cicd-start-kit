# CI/CD Starter Kit 🚀

A hands-on learning project for mastering CI/CD with GitHub Actions.

## What's Inside

```
cicd-starter-kit/
├── .github/
│   └── workflows/
│       ├── python-ci.yml      # Python testing & linting
│       ├── web-ci.yml         # Web app build & deploy
│       └── learning-pipeline.yml  # Beginner-friendly example
├── python-app/
│   ├── src/
│   │   └── calculator.py      # Simple app to test
│   ├── tests/
│   │   └── test_calculator.py # Unit tests
│   └── requirements.txt
├── web-dashboard/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md
```

## Quick Start

1. Fork this repo to your GitHub account
2. Clone it locally: `git clone https://github.com/YOUR-USERNAME/cicd-starter-kit`
3. Make a change to any file
4. Commit and push
5. Watch the Actions tab light up! ✨

## Learning Path

1. **Start here**: Look at `.github/workflows/learning-pipeline.yml`
2. **Level up**: Try the Python CI pipeline
3. **Go further**: Deploy the web dashboard

## Key Concepts

- **CI (Continuous Integration)**: Automatically test code when you push
- **CD (Continuous Deployment)**: Automatically deploy when tests pass
- **Workflow**: A YAML file that defines your automation
- **Job**: A set of steps that run on the same runner
- **Step**: Individual tasks (run a script, install dependencies, etc.)
