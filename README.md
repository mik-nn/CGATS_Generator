# CGATS 1.7 Generator

A web-based tool for generating CGATS (Color Graphics Arts Technology Standard) 1.7 target files for CMYK printer linearization and color analysis.

## How to Use

1. **Select Primaries** - Choose which color primaries to include in your test target:
   - Single colors: C (Cyan), M (Magenta), Y (Yellow), K (Black)
   - Color combinations: CMY, CM, CY, MY, CK, MK, YK, CMYK

2. **Choose Step Preset** - Select from predefined step sequences:
   - Linear 21 (0–100% in 5% increments)
   - Linear 11 (0–100% in 10% increments)
   - 25 steps (P2P) - point-to-point linearization
   - HarlequinRIP - RIP-optimized steps
   - InkLimits - high ink density range (60–100%)
   - Custom presets from presets.json (if available)

3. **Configure Patch Settings**:
   - **Patch Width** - width in millimeters (default: 8mm)
   - **Patch Height** - height in millimeters (default: 8mm)
   - **Page Width** - maximum page width in mm (default: 196mm)

4. **Preview** - Real-time visual preview of the test chart with accurate CMYK-to-RGB color representation

5. **Download** - Generate and download the CGATS file as CMYK_Target.txt

## Abilities

- **Dynamic Primary Selection** - Toggle individual color primaries on/off
- **Multiple Step Presets** - Built-in profiles for different linearization methods
- **Custom Presets** - Load additional presets from presets.json
- **Real-Time Preview** - Live canvas visualization with CMYK color rendering
- **Flexible Layout** - Automatically calculates patch arrangement based on page and patch dimensions
- **CGATS 1.7 Compliance** - Generates standard-compliant CGATS files with proper headers and formatting
- **Batch Generation** - Create test targets for printer analysis and profiling

## Technical Details

- Generates CGATS 1.7 format files with SAMPLE_ID and CMYK values
- Calculates optimal patch arrangement using page width constraints
- Supports vertical patch ordering (primary-major layout)
- Includes date stamps in generated files
- CMYK color space calculations for accurate preview rendering

## Presets Configuration

Custom step presets can be defined in a `presets.json` file. The file should contain an array of preset objects, where each preset defines specific percentage values for CMYK channels.

### Example: DotGain Preset

The DotGain preset is commonly used for dot gain analysis and includes only single color patches (C, M, Y, K) at specific percentage values.

**presets.json:**
```json
[
  {
    "name": "DotGain",
    "steps": [
      { "C": 100, "M": 0, "Y": 0, "K": 0 },
      { "C": 80, "M": 0, "Y": 0, "K": 0 },
      { "C": 40, "M": 0, "Y": 0, "K": 0 },
      { "C": 0, "M": 100, "Y": 0, "K": 0 },
      { "C": 0, "M": 80, "Y": 0, "K": 0 },
      { "C": 0, "M": 40, "Y": 0, "K": 0 },
      { "C": 0, "M": 0, "Y": 100, "K": 0 },
      { "C": 0, "M": 0, "Y": 80, "K": 0 },
      { "C": 0, "M": 0, "Y": 40, "K": 0 },
      { "C": 0, "M": 0, "Y": 0, "K": 100 },
      { "C": 0, "M": 0, "Y": 0, "K": 80 },
      { "C": 0, "M": 0, "Y": 0, "K": 40 }
    ]
  }
]
```

This preset generates patches with the following characteristics:
- **Single colors only**: C, M, Y, K (no overprints)
- **Three percentage levels**: 100%, 80%, and 40%
- **Total patches**: 12 (3 steps × 4 primaries)

## Date of Update
2026-03-08 19:14:46 (UTC)