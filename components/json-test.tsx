"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function JSONTest() {
  const [input, setInput] = useState(
    '{"confirm":1752210112744,"out_for_delivery":1752211377540,"ready_for_pickup":1752210720556}',
  )
  const [output, setOutput] = useState("")

  const processJSON = () => {
    try {
      const parsed = JSON.parse(input)

      const processValue = (obj: any): any => {
        if (typeof obj === "number" && obj > 946684800) {
          const date = new Date(obj > 946684800000 ? obj : obj * 1000)
          return {
            original: obj,
            iso: date.toISOString(),
            readable: date.toLocaleString(),
          }
        }

        if (typeof obj === "object" && obj !== null) {
          if (Array.isArray(obj)) {
            return obj.map(processValue)
          } else {
            const processed: any = {}
            for (const [key, value] of Object.entries(obj)) {
              processed[key] = processValue(value)
            }
            return processed
          }
        }

        return obj
      }

      const result = processValue(parsed)
      setOutput(JSON.stringify(result, null, 2))
    } catch (error) {
      setOutput(`Error: ${error}`)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>JSON Timestamp Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Input JSON:</label>
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} className="font-mono" />
        </div>

        <Button onClick={processJSON}>Process Timestamps</Button>

        <div>
          <label className="block text-sm font-medium mb-2">Output:</label>
          <Textarea value={output} readOnly rows={10} className="font-mono" />
        </div>
      </CardContent>
    </Card>
  )
}
