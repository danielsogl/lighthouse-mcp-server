# Security Policy

## Reporting Security Issues

**Please do not report security vulnerabilities through public GitHub issues.**

If you believe you have found a security vulnerability in the Lighthouse MCP Server, please report it responsibly by following the steps below.

### How to Report

For security issues, please email [security@codingrules.ai](mailto:security@codingrules.ai) with the following information:

- **Subject**: "SECURITY: Lighthouse MCP Server - [Brief Description]"
- **Description**: A clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: Description of the potential impact and attack scenarios
- **Environment**: Node.js version, operating system, and MCP client details
- **Proof of Concept**: If available, include proof-of-concept code (responsibly)

### What to Include

Please include as much of the following information as possible to help us better understand and address the security issue:

- **Type of vulnerability** (e.g., code injection, information disclosure, privilege escalation)
- **Full paths of source file(s)** related to the manifestation of the issue
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Any special configuration** required to reproduce the issue
- **Step-by-step instructions** to reproduce the issue
- **Impact assessment** including how an attacker might exploit the issue
- **Suggested mitigation** if you have ideas on how to fix it

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Status Updates**: We will keep you informed of our progress toward resolution
- **Resolution**: We aim to resolve critical issues within 30 days

### Safe Harbor

We support responsible disclosure of security vulnerabilities. If you comply with the policies below when reporting a security issue to us, we will not initiate legal action against you in response to your report:

- Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of services
- Only interact with accounts you own or with explicit permission of the account holder
- Do not access, modify, or delete data belonging to others
- Contact us immediately if you inadvertently access someone else's data

## Security Considerations

### MCP Server Security

The Lighthouse MCP Server operates with the following security considerations:

- **Chrome/Chromium Usage**: The server launches Chrome/Chromium instances to perform audits
- **Network Access**: The server makes HTTP/HTTPS requests to analyze websites
- **File System Access**: Limited to Chrome's user data directory and temporary files
- **No Persistent Storage**: No user data is stored permanently by the server

### Recommended Security Practices

When deploying the Lighthouse MCP Server:

1. **Network Isolation**: Run in isolated network environments when possible
2. **URL Validation**: Validate and sanitize URLs before auditing
3. **Resource Limits**: Set appropriate resource limits for Chrome processes
4. **Access Control**: Restrict access to the MCP server to authorized clients only
5. **Regular Updates**: Keep the server and its dependencies up to date

### Known Limitations

- The server requires Chrome/Chromium, which may have its own security considerations
- Network requests are made to user-provided URLs, which should be validated
- Chrome processes may consume significant system resources

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Vulnerability Disclosure Policy

- We follow coordinated vulnerability disclosure principles
- We will work with security researchers to validate and address reported issues
- We will provide credit to researchers who report valid security issues (unless they prefer to remain anonymous)
- We will publish security advisories for confirmed vulnerabilities after fixes are available

## Contact Information

For security-related questions or concerns:

- **Email**: [security@codingrules.ai](mailto:security@codingrules.ai)
- **GitHub Issues**: Only for non-security related bugs and features
- **GitHub Security**: Use GitHub's security advisory feature for coordinated disclosure

## Dependencies

This project relies on several key dependencies that have their own security considerations:

- **Google Lighthouse**: Web auditing engine
- **Chrome Launcher**: Browser automation
- **Model Context Protocol SDK**: MCP server implementation

We regularly monitor and update these dependencies to address known security issues.

---

Thank you for helping to keep the Lighthouse MCP Server and its users safe!
