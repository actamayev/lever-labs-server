import path from "path"
import Papa from "papaparse"
import { readFileSync } from "fs"

export default function parseCSV(filePath: string): AllSeedData[] {
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	const csvFile = readFileSync(path.join(__dirname, filePath), "utf-8")
	return Papa.parse(csvFile, {
		header: true,
		skipEmptyLines: true,
		transform: (value) => {
			if (value.toLowerCase() === "true") return true
			if (value.toLowerCase() === "false") return false
			return value
		}
	}).data as AllSeedData[]
}
