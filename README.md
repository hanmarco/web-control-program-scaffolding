# IC Evaluation Board Application

A modern desktop application for controlling IC (Integrated Circuit) evaluation boards through various communication protocols (I2C, Serial, SPI, etc.).

## Features

- **Multi-Protocol Communication**: Supports I2C, Serial, and extensible to other protocols
- **Dynamic UI Generation**: Automatically generates UI from JSON/YAML register maps
- **Custom Components**: 
  - ByteType: 8-bit register control with individual bit manipulation
  - Indicator: Read-only status display
  - Slider: Voltage/value range control with custom formulas
  - Combobox: Predefined option selection
- **State Management**: Centralized state with Pinia
- **Modern UI**: Built with Vuetify Material Design components
- **Cross-Platform**: Windows and Linux support via Tauri

## Technology Stack

### Frontend
- **Vue 3**: Progressive JavaScript framework with Composition API
- **TypeScript**: Type-safe development
- **Vuetify**: Material Design component library
- **Pinia**: State management
- **Vue Router**: Navigation and routing
- **Vite**: Fast build tool

### Backend
- **Tauri**: Lightweight desktop application framework
- **Rust**: High-performance backend

## Project Structure

```
├── src/
│   ├── components/
│   │   └── custom/         # Custom UI components
│   │       ├── ByteType.vue
│   │       ├── Indicator.vue
│   │       ├── Slider.vue
│   │       └── Combobox.vue
│   ├── views/              # Page components
│   │   ├── DashboardView.vue
│   │   ├── SettingsView.vue
│   │   └── RegisterDetailView.vue
│   ├── stores/             # Pinia stores
│   │   ├── communicationStore.ts
│   │   └── registerStore.ts
│   ├── interfaces/         # Communication interfaces
│   │   ├── CommunicationInterface.ts
│   │   └── MockCommunication.ts
│   ├── types/              # TypeScript types
│   │   └── RegisterTypes.ts
│   └── router/             # Vue Router configuration
│       └── index.ts
├── src-tauri/              # Tauri backend
├── public/                 # Static assets
│   └── sample-register-map.json
└── .github/workflows/      # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- Rust 1.70 or higher
- Platform-specific dependencies:
  - **Linux**: `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `libwebkit2gtk-4.1-dev`
  - **Windows**: Visual Studio Build Tools

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hanmarco/web-control-program-scaffolding.git
cd web-control-program-scaffolding
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run tauri:dev
```

This will start both the Vite dev server and the Tauri application.

### Building

Build the application for production:
```bash
npm run tauri:build
```

The built application will be available in `src-tauri/target/release/bundle/`.

## Register Map Format

The application uses JSON files to define register maps. Here's an example:

```json
{
  "version": "1.0.0",
  "name": "Sample IC",
  "defaultSlaveAddress": "0x50",
  "registers": [
    {
      "address": "0x12",
      "name": "Output Voltage",
      "type": "slider",
      "bits": [0, 1, 2, 3],
      "min": 3.5,
      "max": 5.0,
      "unit": "V",
      "formula": "3.5 + (value / 15) * 1.5",
      "writable": true
    }
  ]
}
```

### Supported Register Types

1. **byte**: Full 8-bit control with checkboxes
2. **indicator**: Read-only display (hex, binary, or decimal)
3. **slider**: Range control with custom formulas
4. **combobox**: Select from predefined options

## Communication Interface

The application uses an abstract communication interface for extensibility:

```typescript
interface CommunicationInterface {
  connect(device: string): Promise<void>;
  disconnect(): Promise<void>;
  read(slaveAddr: number, regAddr: number, length: number): Promise<Uint8Array>;
  write(slaveAddr: number, regAddr: number, data: Uint8Array): Promise<void>;
}
```

Implementations:
- `MockCommunication`: For testing and development
- Future: `I2CCommunication`, `SerialCommunication`, etc.

## Docker Support

Build for Windows from Linux using Docker:

```bash
docker build -t ic-eval-app .
docker run --rm -v $(pwd)/dist:/app/src-tauri/target ic-eval-app
```

## CI/CD

GitHub Actions workflows automatically build the application for both Linux and Windows on every push to main or when creating a release tag.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Roadmap

- [ ] Real I2C communication implementation (FT260, FT2232D/H)
- [ ] Serial port communication
- [ ] SPI protocol support
- [ ] Register map editor
- [ ] Data logging and export
- [ ] Scripting/automation support
- [ ] Multi-language support

