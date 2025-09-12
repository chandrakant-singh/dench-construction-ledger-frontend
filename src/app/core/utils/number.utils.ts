/**
 * Number utility functions for data sanitization and conversion
 */
export class NumberUtils {
  
  /**
   * Convert any value to integer, handling strings, null, undefined
   * @param value - The value to convert
   * @returns Integer value (0 if conversion fails)
   */
  static sanitizeToInteger(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Convert any value to number (float), handling strings, null, undefined
   * @param value - The value to convert
   * @returns Number value (0 if conversion fails)
   */
  static sanitizeToNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Check if a value is a valid number
   * @param value - The value to check
   * @returns True if the value is a valid number
   */
  static isValidNumber(value: any): boolean {
    return !isNaN(Number(value)) && isFinite(Number(value));
  }

  /**
   * Format a number with commas for display
   * @param value - The number to format
   * @param decimals - Number of decimal places (default: 0)
   * @returns Formatted number string
   */
  static formatNumber(value: any, decimals: number = 0): string {
    const num = this.sanitizeToNumber(value);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Round a number to specified decimal places
   * @param value - The number to round
   * @param decimals - Number of decimal places (default: 0)
   * @returns Rounded number
   */
  static roundTo(value: any, decimals: number = 0): number {
    const num = this.sanitizeToNumber(value);
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
