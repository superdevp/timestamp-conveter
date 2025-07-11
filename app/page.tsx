"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Calendar, Globe, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Upload, Download, FileText } from "lucide-react"
import { CSVTimestampProcessor } from "@/lib/csv-processor"
import { JSONTest } from "@/components/json-test"

export default function TimestampConverter() {
  const [timestamp, setTimestamp] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [convertedTime, setConvertedTime] = useState<Date | null>(null)
  const [error, setError] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Convert timestamp whenever input changes
  useEffect(() => {
    if (!timestamp.trim()) {
      setConvertedTime(null)
      setError("")
      return
    }

    try {
      const num = Number.parseFloat(timestamp)

      if (isNaN(num)) {
        setError("Invalid timestamp format")
        setConvertedTime(null)
        return
      }

      let date: Date

      // Determine if it's seconds or milliseconds based on length
      if (timestamp.length <= 10) {
        // Unix timestamp in seconds
        date = new Date(num * 1000)
      } else {
        // Unix timestamp in milliseconds
        date = new Date(num)
      }

      if (isNaN(date.getTime())) {
        setError("Invalid timestamp")
        setConvertedTime(null)
        return
      }

      setConvertedTime(date)
      setError("")
    } catch (err) {
      setError("Invalid timestamp")
      setConvertedTime(null)
    }
  }, [timestamp])

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (Math.abs(diffInSeconds) < 60) {
      return diffInSeconds === 0
        ? "now"
        : `${Math.abs(diffInSeconds)} seconds ${diffInSeconds > 0 ? "ago" : "from now"}`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (Math.abs(diffInMinutes) < 60) {
      return `${Math.abs(diffInMinutes)} minutes ${diffInMinutes > 0 ? "ago" : "from now"}`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (Math.abs(diffInHours) < 24) {
      return `${Math.abs(diffInHours)} hours ${diffInHours > 0 ? "ago" : "from now"}`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    return `${Math.abs(diffInDays)} days ${diffInDays > 0 ? "ago" : "from now"}`
  }

  const processCSVFile = async (file: File) => {
    setIsProcessing(true)
    setError("")

    try {
      console.log("Processing file:", file.name, "Size:", file.size)

      // Read first few lines for debugging
      const text = await file.text()
      const lines = text.split("\n")
      console.log("First 3 lines of CSV:")
      lines.slice(0, 3).forEach((line, i) => {
        console.log(`Line ${i}:`, line.substring(0, 200))
      })

      const processor = new CSVTimestampProcessor()
      const processedCSV = await processor.processCSV(file)

      console.log("Processing completed successfully")
      console.log("Output preview:", processedCSV.substring(0, 500))

      setProcessedData(processedCSV)
      setFileName(`converted_${file.name}`)
    } catch (error) {
      console.error("Error processing file:", error)
      setError(`Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`)
      setProcessedData(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/csv") {
      setUploadedFile(file)
      setError("")
      processCSVFile(file)
    } else {
      setError("Please upload a valid CSV file")
    }
  }

  const downloadProcessedFile = () => {
    if (processedData) {
      const blob = new Blob([processedData], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getCurrentTimestamp = () => {
    return Math.floor(currentTime.getTime() / 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Timestamp Converter</h1>
          <p className="text-gray-600">Convert Unix timestamps to human-readable time formats</p>
        </div>

        {/* Current Time Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Current Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Local Time</Label>
                <div className="text-lg font-mono bg-gray-50 p-3 rounded-md">{currentTime.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Unix Timestamp</Label>
                <div className="text-lg font-mono bg-gray-50 p-3 rounded-md">{getCurrentTimestamp()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timestamp Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Convert Timestamp
            </CardTitle>
            <CardDescription>
              Enter a Unix timestamp (seconds or milliseconds) to convert it to human-readable format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timestamp">Timestamp</Label>
              <Input
                id="timestamp"
                type="text"
                placeholder="e.g., 1703980800 or 1703980800000"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="font-mono"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            {convertedTime && (
              <div className="space-y-4">
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Converted Time</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Local Time</Label>
                      <div className="text-lg font-mono bg-green-50 p-3 rounded-md border border-green-200">
                        {convertedTime.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        UTC Time
                      </Label>
                      <div className="text-lg font-mono bg-blue-50 p-3 rounded-md border border-blue-200">
                        {convertedTime.toUTCString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">ISO 8601 Format</Label>
                    <div className="text-lg font-mono bg-purple-50 p-3 rounded-md border border-purple-200">
                      {convertedTime.toISOString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Relative Time</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        {formatRelativeTime(convertedTime)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Year</Label>
                      <div className="font-mono bg-gray-50 p-2 rounded text-center">{convertedTime.getFullYear()}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Month</Label>
                      <div className="font-mono bg-gray-50 p-2 rounded text-center">{convertedTime.getMonth() + 1}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Day</Label>
                      <div className="font-mono bg-gray-50 p-2 rounded text-center">{convertedTime.getDate()}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Weekday</Label>
                      <div className="font-mono bg-gray-50 p-2 rounded text-center">
                        {convertedTime.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Batch Convert CSV File
            </CardTitle>
            <CardDescription>
              Upload a CSV file to convert all timestamp columns to human-readable format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-upload">Upload CSV File</Label>
              <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} disabled={isProcessing} />
            </div>

            {uploadedFile && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{uploadedFile.name}</span>
                <Badge variant="secondary">{(uploadedFile.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span className="text-sm">Processing file...</span>
              </div>
            )}

            {processedData && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">File processed successfully!</span>
                </div>

                <Button onClick={downloadProcessedFile} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Converted File
                </Button>

                <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded space-y-2">
                  <div>
                    <strong>What was converted:</strong>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Simple timestamp columns (createdAt, updatedAt) → Added readable date columns</li>
                    <li>JSON timestamp fields → Expanded with original + converted + readable formats</li>
                    <li>Nested timestamps in trackingHistory → Processed recursively</li>
                  </ul>
                  <div className="mt-2">
                    <strong>Example conversion:</strong> 1752210112744 → 2025-07-11T05:41:52.744Z
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* JSON Test Component */}
        <JSONTest />

        {/* Quick Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Examples</CardTitle>
            <CardDescription>Click on any example to try it</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Common Timestamps</Label>
                <div className="space-y-2">
                  {[
                    { label: "Unix Epoch", value: "0" },
                    { label: "Y2K", value: "946684800" },
                    { label: "Current Time", value: getCurrentTimestamp().toString() },
                  ].map((example) => (
                    <button
                      key={example.label}
                      onClick={() => setTimestamp(example.value)}
                      className="w-full text-left p-2 rounded border hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-sm">{example.label}</div>
                      <div className="font-mono text-xs text-gray-600">{example.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Format Info</Label>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="p-2 bg-gray-50 rounded">
                    <strong>Unix Timestamp:</strong> Seconds since January 1, 1970 UTC
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <strong>Milliseconds:</strong> For timestamps longer than 10 digits
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <strong>Auto-detection:</strong> Automatically detects seconds vs milliseconds
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
