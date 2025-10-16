import path from "path"
import { readFileSync } from "fs"

function isCodingBlockData(data: unknown): data is CodingBlockData {
	const d = data as CodingBlockData
	return (
		typeof d === "object" &&
		d !== null &&
		typeof d.coding_block_id === "number" &&
		typeof d.coding_block_json === "object"
	)
}

// ADD THIS:
function isFillInTheBlankData(data: unknown): data is FillInTheBlankData {
	const d = data as FillInTheBlankData
	return (
		typeof d === "object" &&
		d !== null &&
		typeof d.question_id === "string" &&
		typeof d.initial_blockly_json === "object" &&
		(typeof d.reference_solution_cpp === "string" || d.reference_solution_cpp === null) &&
		typeof d.question_text === "string"
	)
}

export default function parseJSON(filePath: string): AllSeedData[] {
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	const jsonFile = readFileSync(path.join(__dirname, filePath), "utf-8")
	const parsedData = JSON.parse(jsonFile)

	const fileName = path.basename(filePath)

	if (fileName === "coding_block.json") {
		return parsedData.map((row: unknown, index: number) => {
			if (!isCodingBlockData(row)) {
				throw new Error(`Invalid coding block data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as CodingBlockData
		})
	}

	// ADD THIS:
	if (fileName === "fill_in_the_blank.json") {
		return parsedData.map((row: unknown, index: number) => {
			if (!isFillInTheBlankData(row)) {
				throw new Error(`Invalid fill in the blank data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as FillInTheBlankData
		})
	}

	throw new Error(`Unknown JSON file type: ${filePath}`)
}
