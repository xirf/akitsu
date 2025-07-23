# Security Policy

## 🔒 Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## 🚨 Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do Not** Create a Public Issue

Please do not create a GitHub issue for security vulnerabilities. This could put users at risk.

### 2. Send a Private Report

Email security reports to: [akitsu@andka.my.id](mailto:akitsu@andka.my.id)

Include the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if you have one)

### 3. Response Timeline

- **Initial Response**: Within 24 hours
- **Triage**: Within 72 hours
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 1-4 weeks
  - Medium: 1-3 months
  - Low: Next release cycle

### 4. Disclosure Process

1. We will acknowledge receipt of your report
2. We will investigate and validate the issue
3. We will develop and test a fix
4. We will coordinate disclosure timing with you
5. We will release the fix and security advisory
6. We will credit you (if desired) in our acknowledgments

## 🛡️ Security Best Practices

### For Users

- Always use HTTPS in production
- Use strong, unique passwords
- Regularly rotate API keys
- Keep dependencies updated
- Monitor your application logs
- Use environment variables for secrets

### For Developers

- Follow secure coding practices
- Validate all inputs
- Use parameterized queries
- Implement proper authentication and authorization
- Regular security audits
- Keep dependencies updated

## 🔍 Security Features

This CMS includes several security features:

### Authentication & Authorization
- JWT token-based authentication
- bcrypt password hashing
- Role-based access control (RBAC)
- API key management with permissions

### Input Validation
- Zod schema validation for all inputs
- SQL injection prevention
- XSS protection
- CSRF protection

### Infrastructure Security
- Cloudflare Workers security features
- D1 database encryption at rest
- TLS encryption in transit

## 📋 Security Checklist

### Development
- [ ] All inputs are validated
- [ ] Secrets are stored securely
- [ ] Dependencies are up to date
- [ ] Security headers are implemented
- [ ] Error messages don't leak sensitive info

### Deployment
- [ ] HTTPS is enforced
- [ ] Environment variables are set properly
- [ ] Database is secured
- [ ] Access logs are monitored
- [ ] Rate limiting is configured

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 🏆 Hall of Fame

We appreciate security researchers who help keep our project safe:

<!-- Security researchers who have responsibly disclosed vulnerabilities will be listed here -->

*No security issues have been reported yet.*

## 📞 Contact

For non-security related issues, please use our [GitHub Issues](https://github.com/xirf/akitsu/issues).

For security-related questions that are not vulnerabilities, you can reach out via our normal communication channels.
