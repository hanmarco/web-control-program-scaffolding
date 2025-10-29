# Usage Guide

## Getting Started

### 1. Start the Application

For development:
```bash
npm run tauri:dev
```

For production build:
```bash
npm run tauri:build
```

### 2. Configure Connection

1. Navigate to the **Settings** page using the hamburger menu
2. Select your communication protocol:
   - **I2C**: For I2C communication via FT260, FT2232D/H
   - **Serial**: For serial communication via SC4420 or Arduino
   - **Mock**: For testing without hardware
3. Enter the device path:
   - Linux: `/dev/i2c-1`, `/dev/ttyUSB0`, etc.
   - Windows: `COM3`, `COM4`, etc.
4. For Serial: Set the baud rate (default: 115200)
5. Click **Connect**

### 3. Load Register Map

1. In the **Settings** page, click **Load Sample Register Map**
2. Or create your own JSON file following the format below

### 4. Control Registers

Navigate to the **Dashboard** to see all available registers. Each register type has different controls:

#### Byte Type
- View and edit all 8 bits individually using checkboxes
- See hex and decimal values in real-time
- Click **Read** to fetch current value from device
- Click **Write** to send changes to device

#### Indicator Type
- Read-only display of register value
- Shows value in binary, hex, or decimal format
- Click **Refresh** to update the value
- Optional auto-refresh for monitoring

#### Slider Type
- Control voltage or value ranges
- Supports custom formulas for value calculation
- Shows raw and calculated values
- Uses specific bits from the register

#### Combobox Type
- Select from predefined options
- Each option has a label and optional description
- Can use specific bits from the register

## Register Map Format

Create a JSON file with the following structure:

```json
{
  "version": "1.0.0",
  "name": "My IC Register Map",
  "description": "Description of your IC",
  "defaultSlaveAddress": "0x50",
  "registers": [
    {
      "address": "0x10",
      "name": "Control Register",
      "description": "Main control register",
      "type": "byte",
      "writable": true
    }
  ]
}
```

See the full documentation in README.md for complete register type specifications.

## Tips

1. **Mock Mode**: Use mock communication for UI development and testing without hardware
2. **Connection Status**: Check the connection status in the top-right corner
3. **Error Handling**: Error messages appear at the bottom of components
4. **Refresh**: Click refresh on indicators to update values
5. **Bit Manipulation**: For precise control, use byte type to set individual bits

## Troubleshooting

### Cannot Connect
- Verify device path is correct
- Check device permissions (Linux: may need `sudo` or add user to dialout group)
- Ensure device is not in use by another application

### Register Read/Write Fails
- Check slave address is correct
- Verify register address exists in device
- Ensure device is powered and responding
