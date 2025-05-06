"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportVotingData } from "@/app/actions/admin"

export function ExportResultsButton() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsExporting(true)

      const result = await exportVotingData(format)

      if (result.error) {
        throw new Error(result.error)
      }

      // Create and download file
      const blob = new Blob([result.data], { type: result.contentType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setIsExporting(false)
    } catch (error) {
      console.error("Export error:", error)
      setIsExporting(false)
      alert("Failed to export results. Please try again.")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export Results"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>Export as JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
