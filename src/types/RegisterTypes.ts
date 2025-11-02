/**
 * Register UI component types
 */
export type RegisterType = 'byte' | 'indicator' | 'slider' | 'combobox' | 'bitfield' | 'control';

/**
 * Base register definition
 */
export interface RegisterBase {
  address: string; // Hex format, e.g., "0x12"
  name: string;
  description?: string;
  writable: boolean;
}

/**
 * Byte type register - 8 checkboxes for bit manipulation
 */
export interface ByteRegister extends RegisterBase {
  type: 'byte';
}

/**
 * Control type register - compact 8-bit control with R/W buttons
 */
export interface ControlRegister extends RegisterBase {
  type: 'control';
  mode?: 'debug' | 'compact'; // debug: full featured, compact: minimal UI
}

/**
 * Indicator type register - read-only display
 */
export interface IndicatorRegister extends RegisterBase {
  type: 'indicator';
  format?: 'binary' | 'hex' | 'decimal';
}

/**
 * Slider type register - for voltage or value ranges
 */
export interface SliderRegister extends RegisterBase {
  type: 'slider';
  bits: number[]; // Which bits to use, e.g., [0, 1, 2, 3]
  min: number;
  max: number;
  step?: number;
  unit?: string; // e.g., "V", "mA"
  formula?: string; // JavaScript expression for value calculation
}

/**
 * Combobox type register - predefined options
 */
export interface ComboboxOption {
  value: number;
  label: string;
  description?: string;
}

export interface ComboboxRegister extends RegisterBase {
  type: 'combobox';
  bits?: number[]; // Optional: specific bits to use
  options: ComboboxOption[];
}

/**
 * Bit field register - individual bit control
 */
export interface BitFieldInfo {
  bit: number;
  name: string;
  description?: string;
  writable: boolean;
}

export interface BitFieldRegister extends RegisterBase {
  type: 'bitfield';
  fields: BitFieldInfo[];
}

/**
 * Union type for all register types
 */
export type Register =
  | ByteRegister
  | ControlRegister
  | IndicatorRegister
  | SliderRegister
  | ComboboxRegister
  | BitFieldRegister;

/**
 * Register map structure
 */
export interface RegisterMap {
  version: string;
  name: string;
  description?: string;
  defaultSlaveAddress: string; // Hex format, e.g., "0x50"
  registers: Register[];
}

/**
 * Register value cache
 */
export interface RegisterValue {
  address: string;
  value: number;
  timestamp: number;
}
