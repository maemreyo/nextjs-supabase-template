# MCP Server Integrations

Model Context Protocol (MCP) servers extend Claude Code capabilities with specialized tools and integrations.

## Available MCP Servers

| Server | Purpose | Status |
|--------|---------|--------|
| Context7 | Up-to-date library documentation | Optional |
| Sequential | Multi-step reasoning tools | Optional |
| Puppeteer | Browser automation | Optional |
| Magic | UI component generation | Optional |

## Installation

### Prerequisites
- Node.js 18+
- npx available in PATH

### Global Configuration

MCP servers are configured in your Claude Code settings:

**Location**: `~/.claude/settings.json` (user) or `.claude/settings.json` (project)

### Quick Setup

1. Copy the desired configuration from the server-specific JSON files
2. Add to your `settings.json` under `mcpServers`
3. Restart Claude Code

## Server Configurations

### Context7 (Documentation Lookup)

Provides up-to-date documentation for libraries and frameworks.

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  }
}
```

**Usage**: Ask about any library and get current documentation.

### Sequential Thinking

Provides structured reasoning tools for complex problem-solving.

```json
{
  "mcpServers": {
    "sequential": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Usage**: Complex analysis with step-by-step reasoning.

### Puppeteer (Browser Automation)

Enables browser automation for testing and web interaction.

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**Usage**: Web testing, screenshots, form automation.

### Magic (UI Generation)

Generates UI components from descriptions.

```json
{
  "mcpServers": {
    "magic": {
      "command": "npx",
      "args": ["-y", "@anthropic/magic-mcp-server"]
    }
  }
}
```

**Usage**: Generate React/Vue components from descriptions.

## Full Configuration Example

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    },
    "sequential": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

## Verification

After configuration, verify servers are loaded:

1. Start a new Claude Code session
2. Check for MCP tools in available capabilities
3. Test with a simple request

## Troubleshooting

### Server Not Loading
- Check Node.js version (18+ required)
- Verify npx is in PATH
- Check for typos in configuration
- Review Claude Code logs

### Permission Errors
- Ensure network access for package installation
- Check firewall settings
- Verify npm registry access

### Slow Startup
- First run downloads packages (one-time)
- Subsequent starts should be faster
- Consider pre-installing packages globally

## Security Notes

- MCP servers run with your user permissions
- Review server source before installing
- Puppeteer has browser access - use carefully
- Context7 makes network requests to documentation sources

## Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude-code/mcp)
