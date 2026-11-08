import * as XLSX from 'xlsx';

export class ERPAdapter {
  /**
   * Export records array to Excel Buffer
   */
  public static exportToExcel(records: Record<string, any>[], sheetName: string = 'Data'): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Export records array to CSV string
   */
  public static exportToCSV(records: Record<string, any>[]): string {
    const worksheet = XLSX.utils.json_to_sheet(records);
    return XLSX.utils.sheet_to_csv(worksheet);
  }

  /**
   * Parse uploaded Excel or CSV buffer into JSON array
   */
  public static parseFile(buffer: Buffer): Record<string, any>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }
}
