# Git Branch Alias

[中文](./README.zh-cn.md) | English

A Visual Studio Code extension that manages aliases for Git branches and integrates with JIRA.

## Features

- **Automatic JIRA Integration**: Automatically extracts JIRA keys from branch names and fetches issue titles as aliases
- **Multi-Repository Support**: Manages aliases for multiple Git repositories in your workspace
- **Smart Status Bar**: Click the status bar to intelligently open JIRA links
- **Branch Fork Detection**: Automatically detects different branches across repositories and opens corresponding JIRA links
- **Tree View Display**: Shows branch aliases in an organized tree view in the Explorer panel
- **Multilingual Support**: Supports English and Chinese interfaces

## Installation

1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Git Branch Alias"
4. Click Install

## Configuration

Configure the following settings in your VS Code settings:

```json
{
    "branchAlias.jiraBaseUrl": "https://your-jira-instance.com",
    "branchAlias.jiraToken": "your-jira-api-token",
    "branchAlias.branchPattern": ".*_(PROJ-\\d+)"
}
```

### Configuration Options

- **`branchAlias.jiraBaseUrl`**: Base URL of your JIRA instance
- **`branchAlias.jiraToken`**: JIRA API access token for authentication
- **`branchAlias.branchPattern`**: Regular expression to extract JIRA keys from branch names (use parentheses to mark the extraction part)

## Usage

### Basic Features

1. **View Branch Aliases**: Open the "Git Branch Aliases" panel in the Explorer sidebar
2. **Refresh Information**: Click the refresh button to sync the latest JIRA information
3. **Toggle Remote Branches**: Click the globe icon to show/hide remote branches
4. **Status Bar Integration**: View current branch status in the status bar

### Smart JIRA Link Opening

Click the Git branch information in the status bar:

- **Single Repository or Same Branch**: Opens one JIRA link
- **Multiple Repositories with Different Branches**: Opens all corresponding JIRA links

### Automatic Sync

The extension automatically:
- Detects new branches and syncs JIRA information
- Updates aliases when switching branches
- Monitors repository changes and updates the display

## Branch Naming Convention

The extension extracts JIRA keys from branch names using configurable regular expressions. Default pattern:

```
.*_(PROJ-\d+)
```

Example branch names:
- `feature_PROJ-1234` → Extracts `PROJ-1234`
- `bugfix_PROJ-5678_description` → Extracts `PROJ-5678`

## Requirements

- Visual Studio Code 1.73.0 or higher
- Git repositories in your workspace
- JIRA instance with API access

## Architecture

The extension is built with a modular architecture for better maintainability:

- **ConfigService**: Centralized configuration management with validation and defaults
- **SyncService**: Handles all JIRA synchronization logic
- **CommandHandlers**: Manages command implementations and user interactions
- **GitRepositoryManager**: Manages Git repository operations
- **StatusBarManager**: Controls the status bar display and interactions
- **BranchAliasManager**: Core service for branch alias management
- **BranchAliasState**: Manages extension state persistence

## Extension Commands

- `branchAlias.refresh`: Refresh branch information
- `branchAlias.toggleRemoteBranches`: Toggle remote branch display
- `branchAlias.toggleRepository`: Expand/collapse repository view

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Changelog

### 0.0.1

- Initial release
- Basic JIRA integration
- Multi-repository support
- Status bar integration
- Multilingual support (English/Chinese) 