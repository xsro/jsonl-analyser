# JSONL Analyser

A web-based tool for analyzing and visualizing JSON Lines (JSONL) data files.

## Features

### File Management
- **Open JSONL files** using the File System Access API
- **Auto Refresh** - Automatically reload file content every 10 seconds
- **Row Navigation** - Browse through data rows with navigation buttons

### Data Viewer
- **JSON Tree View** - Expandable/collapsible view of nested JSON objects
- **Matrix Visualization** - Display arrays as formatted tables
- **Row Selector** - Jump to specific rows by index

### Chart Visualization
- **Line Chart** - Plot multiple Y values against an X axis
- **Scatter Plot** - Visualize relationships between two variables with equal axis scaling
- **Key Configuration** - Click "Configure Keys" to customize X/Y keys via a modal table

#### Default Configurations
| Chart Type | X Key | Y Keys |
|------------|-------|--------|
| Line Chart | `t` | `state.debug.p1[0]`, `state.debug.p1[1]`, `state.debug.p1[2]` |
| Scatter Plot | `state.debug.p1[0]` | `state.debug.p1[1]` |

## Usage

1. Click **Open File** to select a JSONL file
2. Use the row selector to navigate through data
3. Select chart type (Line Chart / Scatter Plot)
4. Click **Configure Keys** to modify X/Y key paths
5. Click **Apply** to update the visualization

## Key Path Syntax

Use dot notation for nested objects and bracket notation for array indices:

```
state.debug.p1[1]
```

This accesses `data.state.debug.p1[1]`.

## Browser Compatibility

Requires a browser with File System Access API support (Chrome, Edge).
