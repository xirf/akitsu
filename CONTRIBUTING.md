# Contributing to Serverless Headless CMS

Thank you for your interest in contributing to this project! We welcome all kinds of contributions, from bug reports and feature requests to code improvements and documentation updates.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Architecture Guidelines](#architecture-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and help them learn
- **Be collaborative**: Work together and share knowledge
- **Be constructive**: Provide helpful feedback and suggestions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare Workers CLI (`wrangler`)
- Git

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/cms.git
   cd cms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp wrangler.toml.example wrangler.toml
   # Edit wrangler.toml with your configuration
   ```

4. **Create and setup database**
   ```bash
   npx wrangler d1 create cms-db
   npx wrangler d1 migrations apply cms-db --local
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/api-key-management`
- `fix/auth-token-expiry`
- `docs/update-readme`
- `refactor/shared-schemas`

### Commit Messages

Follow conventional commits format:
```
type(scope): description

Examples:
feat(auth): add JWT refresh token functionality
fix(content): resolve content model validation issue
docs(readme): update API documentation
refactor(schemas): extract shared response schemas
test(auth): add unit tests for login endpoint
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

## 📏 Coding Standards

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use `const assertions` where appropriate
- Avoid `any` - use proper typing

### Code Style

- Use Prettier for formatting
- Use ESLint for linting
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

## Architecture

This CMS use custom modular architecture with the following structure:

```
src/
├── features/           # Self-contained feature modules
│   ├── auth/           # Authentication & authorization
│   ├── content/        # Content management (TODO)
│   └── media/          # Media management (TODO)
├── io/                 # Input/Output adapters
│   ├── api/            # HTTP API routes
│   │   ├── routes/     # Modular route definitions
│   │   ├── base/       # Base route classes
│   │   ├── registry.ts # Route registration system
│   │   └── routeMap.ts # Main route setup
│   └── cli/            # CLI commands (TODO)
├── infra/              # Infrastructure adapters
│   ├── auth/           # Auth providers (D1, JWT)
│   └── database/       # Database adapters
├── shared/             # Shared utilities & types
├── composition/        # Feature composition & DI
└── runtime/            # Application bootstrap
```

### File Organization

```
src/
├── features/              # Feature modules
│   └── feature-name/
│       ├── feature.io.ts     # Input/Output schemas & routes
│       ├── feature.unit.ts   # Business logic
│       ├── feature.fx.ts     # Side effects
│       ├── feature.runner.ts # Feature orchestration
│       └── index.ts          # Public exports
├── shared/
│   ├── schemas/           # Shared Zod schemas
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Shared utilities
├── infra/                # Infrastructure adapters
└── io/                   # Input/Output adapters
```

### Naming Conventions

- **Files**: `dot.notation.ts` (e.g., `auth.io.ts`)
- **Directories**: `camelCase`
- **Variables/Functions**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`
- **Zod Schemas**: `PascalCase` with `Schema` suffix

## 🏗️ Architecture Guidelines

### Feature Development

When adding a new feature, follow the modular architecture:

1. **Create feature module** in `src/features/featureName/`
2. **Define schemas** in `feature.io.ts` using shared schemas where possible
3. **Implement business logic** in `feature.unit.ts`
4. **Handle side effects** in `feature.fx.ts`
5. **Create orchestration** in `feature.runner.ts` if needed (recommended for complex features)
6. **Add infrastructure adapter** in `src/infra/featureName/`
7. **Create API routes** in `src/io/api/routes/featureName.routes.ts`
8. **Enable feature** in `src/composition/features.ts`

### Schema Design

- Use shared schemas from `src/shared/schemas/common.ts`
- Create reusable schema builders
- Follow DRY principles
- Add proper validation messages
- Use Zod transforms where appropriate

### API Design

- Follow RESTful conventions
- Use consistent response formats
- Include proper error handling
- Add OpenAPI documentation
- Use appropriate HTTP status codes

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for business logic
- Write integration tests for API endpoints
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

### Test Structure

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return JWT token for valid credentials', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password' };
      
      // Act
      const result = await authService.login(credentials);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
    });
  });
});
```

## 🛠️ Submitting Changes

### Pull Request Process

1. **Update documentation** if needed
2. **Add/update tests** for your changes
3. **Run linting and tests** locally
4. **Create pull request** with descriptive title and description
5. **Link related issues** using keywords (closes #123)
6. **Request review** from maintainers

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (please describe)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
```

## 📚 Documentation

### API Documentation

- Update OpenAPI schemas when adding/modifying endpoints
- Include examples in route definitions
- Document error responses
- Keep README.md API section updated

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex business logic
- Include usage examples
- Update architecture diagrams if needed

## 🎯 Areas for Contribution

### High Priority
- [ ] Media management feature
- [ ] File upload functionality
- [ ] Webhook system
- [ ] Rate limiting
- [ ] Caching layer

### Medium Priority
- [ ] Multi-tenancy support
- [ ] Analytics feature
- [ ] CLI tool improvements
- [ ] Performance optimizations

### Low Priority
- [ ] Admin dashboard
- [ ] GraphQL API
- [ ] Export/import functionality
- [ ] Advanced querying

## 🤔 Questions or Need Help?

- **Documentation**: Check the README and inline code comments
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Architecture**: Review the existing codebase structure

## 🏷️ Labels

We use labels to categorize issues and PRs:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra help needed
- `priority:high` - High priority items
- `priority:medium` - Medium priority items
- `priority:low` - Low priority items

Thank you for contributing! 🎉
