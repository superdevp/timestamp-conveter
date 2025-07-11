export interface TimestampColumn {
  index: number
  name: string
  type: "simple" | "json" | "nested"
}

export class CSVTimestampProcessor {
  private detectTimestampColumns(headers: string[]): TimestampColumn[] {
    const timestampColumns: TimestampColumn[] = []

    headers.forEach((header, index) => {
      const cleanHeader = header.replace(/"/g, "").trim().toLowerCase()

      // Direct timestamp columns (numeric values)
      if (
        cleanHeader.includes("createdat") ||
        cleanHeader.includes("updatedat") ||
        cleanHeader.includes("closedat") ||
        cleanHeader.includes("processedat") ||
        cleanHeader.includes("cancelledat")
      ) {
        timestampColumns.push({
          index,
          name: header.replace(/"/g, "").trim(),
          type: "simple",
        })
      }

      // JSON columns that contain timestamps
      if (cleanHeader === "timestamp" || cleanHeader === "trackinghistory" || cleanHeader.includes("timestamp")) {
        timestampColumns.push({
          index,
          name: header.replace(/"/g, "").trim(),
          type: "json",
        })
      }
    })

    return timestampColumns
  }

  private convertTimestamp(value: string | number): string {
    const num = typeof value === "string" ? Number.parseFloat(value) : value

    if (isNaN(num) || num <= 0) return value.toString()

    let date: Date

    // Determine if seconds or milliseconds based on magnitude
    // Timestamps after year 2000 in seconds: > 946684800
    // Timestamps in milliseconds: > 946684800000
    if (num > 946684800000) {
      // Milliseconds
      date = new Date(num)
    } else if (num > 946684800) {
      // Seconds
      date = new Date(num * 1000)
    } else {
      return value.toString()
    }

    if (isNaN(date.getTime())) return value.toString()

    return date.toISOString()
  }

  private processJSONTimestamps(jsonString: string): string {
    if (!jsonString || jsonString.trim() === "" || jsonString === "null") {
      return jsonString
    }

    try {
      // Clean the JSON string
      let cleanJson = jsonString.trim()

      // Remove outer quotes if present
      if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
        cleanJson = cleanJson.slice(1, -1)
        // Unescape quotes
        cleanJson = cleanJson.replace(/""/g, '"')
      }

      console.log("Processing JSON:", cleanJson)

      const parsed = JSON.parse(cleanJson)

      const processValue = (obj: any, path = ""): any => {
        if (typeof obj === "number" && obj > 946684800) {
          // This looks like a timestamp (after year 2000)
          const converted = this.convertTimestamp(obj)
          const readable = new Date(obj > 946684800000 ? obj : obj * 1000).toLocaleString()

          console.log(`Converting timestamp at ${path}: ${obj} -> ${converted}`)

          return {
            original: obj,
            iso: converted,
            readable: readable,
          }
        }

        if (typeof obj === "object" && obj !== null) {
          if (Array.isArray(obj)) {
            return obj.map((item, index) => processValue(item, `${path}[${index}]`))
          } else {
            const processed: any = {}
            for (const [key, value] of Object.entries(obj)) {
              processed[key] = processValue(value, path ? `${path}.${key}` : key)
            }
            return processed
          }
        }

        return obj
      }

      const processedObj = processValue(parsed)
      return JSON.stringify(processedObj, null, 2)
    } catch (error) {
      console.error("Error processing JSON:", error, "Original:", jsonString)
      return jsonString
    }
  }

  public async processCSV(file: File): Promise<string> {
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim() !== "")

    if (lines.length === 0) throw new Error("Empty file")

    console.log("Processing CSV with", lines.length, "lines")

    const headers = this.parseCSVLine(lines[0])
    const timestampColumns = this.detectTimestampColumns(headers)

    console.log("Headers:", headers)
    console.log("Detected timestamp columns:", timestampColumns)

    // Create new headers - don't modify original structure for JSON columns
    const newHeaders = [...headers]
    timestampColumns.forEach((col) => {
      if (col.type === "simple") {
        newHeaders.push(`${col.name}_converted`)
      }
      // For JSON columns, we'll modify the content in place
    })

    const processedLines = [this.formatCSVLine(newHeaders)]

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      if (i % 100 === 0) {
        console.log(`Processing row ${i}/${lines.length}`)
      }

      const columns = this.parseCSVLine(lines[i])
      const newColumns = [...columns]

      timestampColumns.forEach((col) => {
        if (col.index < columns.length) {
          const value = columns[col.index]?.trim() || ""

          if (col.type === "simple" && value && value !== "null") {
            const converted = this.convertTimestamp(value)
            if (converted !== value) {
              newColumns.push(converted)
            } else {
              newColumns.push("")
            }
          } else if (col.type === "json" && value && value !== "null") {
            console.log(`Processing JSON in column ${col.name} at row ${i}`)
            newColumns[col.index] = this.processJSONTimestamps(value)
          }
        }
      })

      // Ensure all columns have values
      while (newColumns.length < newHeaders.length) {
        newColumns.push("")
      }

      processedLines.push(this.formatCSVLine(newColumns))
    }

    console.log("CSV processing completed")
    return processedLines.join("\n")
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote - add one quote and skip the next
          current += '"'
          i++
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }

    // Add the last field
    result.push(current)
    return result
  }

  private formatCSVLine(columns: string[]): string {
    return columns
      .map((col) => {
        const cleanCol = col || ""
        // Always quote fields that contain commas, quotes, newlines, or JSON
        if (
          cleanCol.includes(",") ||
          cleanCol.includes('"') ||
          cleanCol.includes("\n") ||
          cleanCol.includes("{") ||
          cleanCol.includes("[")
        ) {
          return `"${cleanCol.replace(/"/g, '""')}"`
        }
        return cleanCol
      })
      .join(",")
  }
}
