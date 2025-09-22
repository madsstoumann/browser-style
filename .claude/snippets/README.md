# Claude Code Snippets

This directory contains reusable command-line snippets and scripts that agents can reference and use.

## Directory Structure

```
.claude/snippets/
├── security/           # Security testing commands and scripts
│   ├── test-headers.sh # Comprehensive security header testing script
│   └── curl-commands.md # Collection of curl commands for security testing
└── README.md          # This file
```

## Usage

### For Agents
Agents can reference these snippets when performing tasks:
- Read snippet files to get proven command patterns
- Use scripts directly or adapt them for specific needs
- Reference documentation for command explanations

### For Developers
- Add new snippets to appropriate subdirectories
- Keep scripts executable and well-documented
- Include both simple commands and complex scripts

## Categories

### Security (`security/`)
- **test-headers.sh**: Automated security header testing for any URL
- **curl-commands.md**: Collection of curl commands for various security tests

## Adding New Snippets

1. Create appropriate subdirectory if needed
2. Add well-documented scripts or command collections
3. Update this README with new entries
4. Make scripts executable: `chmod +x script-name.sh`

## Example Usage

```bash
# Test security headers
./snippets/security/test-headers.sh https://example.com

# Reference curl commands
cat snippets/security/curl-commands.md
```