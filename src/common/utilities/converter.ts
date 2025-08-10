export class Converter {
  public static convertStringToArray(value: string): string[] {
    return value.split(',').map((item) => item.trim());
  }

  public static convertDateTimeToString(date: Date, format: string): string {
    switch (format) {
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }
}
