# Contributing to Video Studio

Thank you for your interest in contributing to Video Studio! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please refer to [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## Getting Started

### Prerequisites

- Docker Desktop (latest version)
- Git
- Basic knowledge of Python, Django, React, and Docker

### Setting Up Development Environment

1. **Fork and clone the repository**
```bash
git clone https://github.com/your-username/video-studio.git
cd video-studio
```

2. **Create a development branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. **Start the development environment**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
docker-compose exec backend python manage.py migrate
```

## Development Guidelines

### Coding Style

#### Python (Backend)
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Maximum line length: 88 characters (Black default)

#### JavaScript/React (Frontend)
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use functional components with hooks
- Use meaningful component and variable names
- Add JSDoc comments for complex functions

#### General
- Write self-documenting code
- Keep functions small and focused
- Avoid code duplication
- Use meaningful commit messages

### Branch Naming

Use the following branch naming conventions:

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `refactor/refactor-description` - Code refactoring
- `docs/documentation-update` - Documentation updates
- `test/test-improvement` - Test improvements

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

#### Examples
```
feat(video): add video trimming functionality
fix(auth): resolve CORS issues with API endpoints
docs(readme): update installation instructions
refactor(api): simplify video serializer logic
```

## Pull Request Process

### Before Submitting

1. **Test your changes**
   - Ensure all tests pass
   - Test the application manually
   - Check for console errors

2. **Update documentation**
   - Update README if needed
   - Add comments to complex code
   - Update API documentation if endpoints changed

3. **Clean your commits**
   - Squash related commits
   - Ensure commit messages follow conventions
   - Remove debugging code

### Submitting a Pull Request

1. **Push your branch**
```bash
git push origin feature/your-feature-name
```

2. **Create Pull Request**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

3. **PR Description**
   - Describe the changes made
   - Reference related issues
   - Add screenshots if applicable
   - List any breaking changes

### PR Review Process

- Maintainers will review your PR
- Address review comments promptly
- Keep discussions focused and constructive
- Update your branch as needed

### After Merge

- Delete your feature branch
- Update your local repository
- Celebrate your contribution! 🎉

## Testing

### Backend Testing
```bash
# Run all tests
docker-compose exec backend python manage.py test

# Run specific app tests
docker-compose exec backend python manage.py test video

# Run with coverage
docker-compose exec backend coverage run --source='.' manage.py test
```

### Frontend Testing
```bash
# Run tests
cd video_studio_module/video-frontend
npm test

# Run tests in watch mode
npm test -- --watch
```

## Reporting Issues

### Bug Reports

When reporting bugs, include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: OS, browser, Docker version
- **Logs**: Relevant error logs
- **Screenshots**: If applicable

### Feature Requests

When requesting features, include:

- **Description**: Clear description of the feature
- **Use case**: Why this feature is needed
- **Proposed solution**: How you envision the feature
- **Alternatives**: Alternative solutions considered

## Development Workflow

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch
4. **Make** your changes
5. **Test** thoroughly
6. **Commit** with conventional messages
7. **Push** to your fork
8. **Create** a Pull Request
9. **Address** review feedback
10. **Merge** and celebrate!

## Questions?

Feel free to:
- Open an issue for questions
- Contact maintainers directly
- Join community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Video Studio! 🚀
