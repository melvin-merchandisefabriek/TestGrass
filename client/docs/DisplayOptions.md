# Shape Display Options

The Shape component supports various display options that can be controlled through the `displayOptions` property in the shape JSON files. These options allow you to customize how a shape is visualized, specifically what elements are shown or hidden.

## Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showControlPoints` | boolean | true | Controls visibility of control points (non-anchor points) used for Bezier curves |
| `showAnchorPoints` | boolean | true | Controls visibility of anchor points for all segments |
| `showPositionAnchor` | boolean | true | Controls visibility of the main position anchor (yellow dot) |
| `showBorder` | boolean | true | Controls visibility of the dashed border around the SVG element |

## Usage in JSON

Add the `displayOptions` object to your shape JSON file:

```json
{
  "id": "my-shape",
  "name": "My Shape",
  "width": 200,
  "height": 200,
  "displayOptions": {
    "showControlPoints": true,
    "showAnchorPoints": false,
    "showPositionAnchor": true,
    "showBorder": false
  },
  // ... other shape properties
}
```

## Examples

### Show Only Control Points

This setup will only show control points but hide anchor points, position anchor and border:

```json
"displayOptions": {
  "showControlPoints": true,
  "showAnchorPoints": false,
  "showPositionAnchor": false,
  "showBorder": false
}
```

### Hide All Visual Aids

To create a "clean" shape with no visual aids (useful for production):

```json
"displayOptions": {
  "showControlPoints": false,
  "showAnchorPoints": false,
  "showPositionAnchor": false,
  "showBorder": false
}
```

### Development Mode

For development and debugging, show all visual aids:

```json
"displayOptions": {
  "showControlPoints": true,
  "showAnchorPoints": true,
  "showPositionAnchor": true,
  "showBorder": true
}
```
