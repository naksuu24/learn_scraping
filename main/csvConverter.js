import fs from "fs";

/**
 * Convert structured data to CSV format
 * @param {Array} data - Array of objects to convert to CSV
 * @param {Array} headers - Optional array of headers. If not provided, will use keys from first object
 * @returns {string} CSV content
 */
export function convertToCSV(data, headers = null) {
  if (!data || data.length === 0) {
    return "";
  }

  // If headers not provided, use keys from first object
  if (!headers) {
    headers = Object.keys(data[0]);
  }

  // Create CSV header row
  const csvRows = [headers.join(",")];

  // Convert each data row
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];

      // Handle null/undefined values
      if (value == null) {
        return "";
      }

      // Convert to string and escape quotes
      const stringValue = String(value);

      // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });

    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Save data to CSV file
 * @param {Array} data - Array of objects to save
 * @param {string} filename - Output filename
 * @param {Array} headers - Optional headers array
 */
export function saveToCSV(data, filename, headers = null) {
  const csvContent = convertToCSV(data, headers);

  try {
    // Ensure the filename has .csv extension
    if (!filename.endsWith(".csv")) {
      filename += ".csv";
    }

    fs.writeFileSync(filename, csvContent, "utf8");
    console.log(`✅ CSV file saved: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ Error saving CSV file: ${error.message}`);
    throw error;
  }
}
