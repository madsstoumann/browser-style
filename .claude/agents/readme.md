# Claude Code Subagents

This project manages Claude Code subagents for specialized, task-specific workflows and improved context management.

## What are Subagents?

Subagents are pre-configured AI personalities that Claude Code can delegate tasks to. Each subagent:
- Has a specific purpose and expertise area
- Uses its own context window separate from the main conversation
- Can be configured with specific tools it’s allowed to use
- Includes a custom system prompt that guides its behavior

Claude Code delegates tasks to subagents based on their expertise, allowing them to work independently and return results.

## Key Benefits
- **Context preservation:** Each subagent operates in its own context, keeping the main conversation focused.
- **Specialized expertise:** Subagents can be fine-tuned for specific domains.
- **Reusability:** Subagents can be reused across projects and shared with teams.
- **Flexible permissions:** Each subagent can have different tool access levels.

## Quick Start
1. Open the subagents interface:
   ```
   /agents
   ```
2. Select 'Create New Agent' and choose project-level or user-level.
3. Define the subagent:
   - Generate with Claude, then customize
   - Describe the subagent and when it should be used
   - Select tools to grant access (or inherit all)
   - Edit the system prompt as needed
4. Save and use. Claude will use the subagent automatically or you can invoke it explicitly:
   ```
   > Use the code-reviewer subagent to check my recent changes
   ```

## Subagent Configuration
- **File locations:**
  - Project subagents: `.claude/agents/` (project-specific)
  - User subagents: `~/.claude/agents/` (available across projects)
- **File format:** Markdown with YAML frontmatter:
  ```
  ---
  name: your-sub-agent-name
  description: Description of when this subagent should be invoked
  tools: tool1, tool2, tool3  # Optional
  model: sonnet  # Optional
  ---

  Your subagent's system prompt goes here.
  ```
- **Configuration fields:**
  - `name`: Unique identifier (lowercase, hyphens)
  - `description`: Purpose of the subagent
  - `tools`: Comma-separated list (optional)
  - `model`: Model alias or 'inherit' (optional)

## Managing Subagents
- Use `/agents` for an interactive management interface.
- Or manage subagent files directly in the appropriate directory.

## Using Subagents Effectively
- Claude Code delegates tasks based on the subagent's `description` and available tools.
- Invoke a subagent explicitly by mentioning it in your command:
  ```
  > Use the test-runner subagent to fix failing tests
  > Have the code-reviewer subagent look at my recent changes
  > Ask the debugger subagent to investigate this error
  ```

## Example Subagents
### Code Reviewer
```
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
---

You are a senior code reviewer ensuring high standards of code quality and security.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:
- Code is simple and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented
- Good test coverage
- Performance considerations addressed

Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)

Include specific examples of how to fix issues.
```

### Debugger
```
---
name: debugger
description: Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues.
tools: Read, Edit, Bash, Grep, Glob
---

You are an expert debugger specializing in root cause analysis.

When invoked:
1. Capture error message and stack trace
2. Identify reproduction steps
3. Isolate the failure location
4. Implement minimal fix
5. Verify solution works

Debugging process:
- Analyze error messages and logs
- Check recent code changes
- Form and test hypotheses
- Add strategic debug logging
- Inspect variable states

For each issue, provide:
- Root cause explanation
- Evidence supporting the diagnosis
- Specific code fix
- Testing approach
- Prevention recommendations

Focus on fixing the underlying issue, not just symptoms.
```

### Data Scientist
```
---
name: data-scientist
description: Data analysis expert for SQL queries, BigQuery operations, and data insights. Use proactively for data analysis tasks and queries.
tools: Bash, Read, Write
model: sonnet
---

You are a data scientist specializing in SQL and BigQuery analysis.

When invoked:
1. Understand the data analysis requirement
2. Write efficient SQL queries
3. Use BigQuery command line tools (bq) when appropriate
4. Analyze and summarize results
5. Present findings clearly

Key practices:
- Write optimized SQL queries with proper filters
- Use appropriate aggregations and joins
- Include comments explaining complex logic
- Format results for readability
- Provide data-driven recommendations

For each analysis:
- Explain the query approach
- Document any assumptions
- Highlight key findings
- Suggest next steps based on data

Always ensure queries are efficient and cost-effective.
```

## Best Practices
- Start with Claude-generated agents, then customize.
- Design focused subagents with single responsibilities.
- Write detailed prompts with specific instructions.
- Limit tool access to what's necessary.
- Version control project subagents for team collaboration.

## Advanced Usage
- **Chaining subagents:**
  ```
  > First use the code-analyzer subagent to find performance issues, then use the optimizer subagent to fix them
  ```
- **Dynamic selection:** Claude Code selects subagents based on context and `description` fields.

## Performance Considerations
- Subagents help preserve main context for longer sessions.
- Each subagent starts with a clean context, which may add some latency.

## Agent Colors

Each subagent has an assigned color for visual identification in the Claude Code interface. To maintain uniqueness and prevent conflicts, we track color assignments in `agent-colors.json`.

### Color Management System

The `agent-colors.json` file contains:
- **agents**: Maps each agent name to its assigned color
- **available_colors**: List of unused colors available for new agents

### Creating New Agents

When creating a new subagent:

1. **Choose a color**: Select an unused color from the `available_colors` array in `agent-colors.json`
2. **Update the JSON**:
   - Add your new agent to the `agents` object with the chosen color
   - Remove the chosen color from the `available_colors` array
3. **Set the color**: Use the chosen color in your agent's markdown file frontmatter:
   ```yaml
   ---
   name: my-new-agent
   description: Agent description here
   color: chosen-color-name
   model: inherit
   ---
   ```

### Example

```json
{
  "agents": {
    "my-new-agent": "coral",
    // ... existing agents
  },
  "available_colors": [
    // "coral" removed from this list
    "aqua",
    "beige",
    // ... remaining colors
  ]
}
```

This system ensures all agents have unique, visually distinct colors while maintaining an organized reference for future agent creation.

## Related Documentation
- [Slash commands](https://docs.claude.com/en/docs/claude-code/slash-commands)
- [Settings](https://docs.claude.com/en/docs/claude-code/settings)
- [Hooks](https://docs.claude.com/en/docs/claude-code/hooks)
- [Tools available to Claude](https://docs.claude.com/en/docs/claude-code/settings#tools-available-to-claude)

---

All content above is sourced directly from the official Claude Code documentation on subagents.
