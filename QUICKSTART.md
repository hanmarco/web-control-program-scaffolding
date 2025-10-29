# Quick Start Guide

## 5-Minute Setup

### Install and Run

```bash
# Clone the repository
git clone https://github.com/hanmarco/web-control-program-scaffolding.git
cd web-control-program-scaffolding

# Install dependencies
npm install

# Run the application
npm run tauri:dev
```

### First Use

1. **Open Settings** (hamburger menu → Settings)
2. **Connect Device**:
   - Protocol: Select "Mock (Testing)" for first try
   - Device Path: Enter any name (e.g., "test-device")
   - Click **Connect**
3. **Load Sample Map**: Click "Load Sample Register Map"
4. **Go to Dashboard**: Use menu to navigate to Dashboard
5. **Try Controls**: Interact with different register types

## Register Types Quick Reference

| Type | Use Case | Read | Write | Features |
|------|----------|------|-------|----------|
| **Byte** | 8-bit control | ✅ | ✅ | Individual bit checkboxes |
| **Indicator** | Status display | ✅ | ❌ | Binary/Hex/Decimal formats |
| **Slider** | Voltage/Range | ✅ | ✅ | Custom formulas, units |
| **Combobox** | Mode selection | ✅ | ✅ | Predefined options |

## Sample Register Map

Available at: `public/sample-register-map.json`

Includes examples of:
- Device ID (read-only)
- Status registers
- Control registers  
- Voltage control (3.5V - 5.0V)
- Current limit (0 - 3000 mA)
- Operating modes
- GPIO control

## Commands

```bash
# Development
npm run tauri:dev          # Run dev server with hot reload

# Build
npm run build              # Build frontend only
npm run tauri:build        # Build complete desktop app

# Other
npm run preview            # Preview production build
```

## Keyboard Shortcuts

- `Ctrl/Cmd + R` - Refresh current page
- Click register card to view details
- Use hamburger menu for navigation

## Tips

💡 **Testing**: Use Mock communication mode to test UI without hardware  
💡 **Formulas**: Slider components support JavaScript expressions  
💡 **Bits**: Use byte type for precise bit-level control  
💡 **Status**: Watch connection indicator in top-right corner  

## Common Issues

**Can't connect?**
- Use "Mock" protocol for testing
- Check device path is correct
- On Linux: May need permissions (`sudo` or dialout group)

**Build fails?**
- Ensure Node.js 20+ and Rust 1.70+ installed
- Run `npm install` again
- Check platform-specific dependencies in README

## Next Steps

1. ✅ Run application with mock communication
2. ✅ Try all register types
3. ✅ Create your own register map
4. 🔲 Connect real hardware (when ready)
5. 🔲 Implement your IC-specific controls

## Resources

- **Full Documentation**: See README.md
- **Usage Guide**: See docs/USAGE.md
- **Architecture**: See docs/ARCHITECTURE.md
- **Contributing**: See CONTRIBUTING.md
- **Sample Map**: See public/sample-register-map.json

---

**Ready to go!** The application is fully functional and ready for use. Start with mock communication to explore features, then connect real hardware when ready.
