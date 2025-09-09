import { groupBy, isNull } from "lodash"
import { AvailableBlock } from "@bluedotrobots/common-ts/types/career-quest"
import { ParentCategoryName, SensorCategoryName, LogicCategoryName } from "@bluedotrobots/common-ts/types/blockly/block-categories"
import { BlockNames} from "@bluedotrobots/common-ts/types/blockly/blockly"
import { BLOCK_REGISTRY } from "@bluedotrobots/common-ts/types/utils/blockly-registry"

interface CategorizedBlocks {
	flatCategories: Record<string, AvailableBlock[]>
	hierarchicalBlocks: Record<ParentCategoryName, Record<string, AvailableBlock[]>>
}

export class BlockFormatter {
	private static _allSandboxBlocks: AvailableBlock[] | null = null
	private static _categorizedBlocks: CategorizedBlocks | null = null
	private static _formattedSandboxText: string | null = null

	// Public methods stay the same, but now use caching
	public static formatBlocksForSandboxLLMContext(): string {
		if (isNull(this._formattedSandboxText)) {
			const { flatCategories, hierarchicalBlocks } = this.getCategorizedBlocks()

			let formattedText = ""
			formattedText += this.formatFlatCategories(flatCategories)
			formattedText += this.formatHierarchicalCategories(hierarchicalBlocks)

			this._formattedSandboxText = formattedText.trim()
		}

		return this._formattedSandboxText
	}

	public static formatChallengeBlocksForCqLLMContext(availableBlocks: AvailableBlock[]): string {
		// This one can't be fully cached since availableBlocks changes per challenge
		// But we can still use cached helper methods
		const blocksByCategory = this.createChallengeCategories(availableBlocks)
		const sortedCategories = this.sortCategoriesByHierarchy(Object.entries(blocksByCategory))

		return sortedCategories
			.map(([categoryPath, blocks]) => {
				const blockList = blocks.map(block =>
					this.formatBlockEntry(block, "challenge")
				).join("\n")

				const emoji = this.getCategoryEmojiUnified(categoryPath)
				return `${emoji} ${categoryPath}:\n${blockList}`
			}).join("\n\n")
	}

	// Cached helper methods
	private static getAllSandboxBlocks(): AvailableBlock[] {
		if (isNull(this._allSandboxBlocks)) {
			this._allSandboxBlocks = Object.entries(BLOCK_REGISTRY).map(([blockType, definition]) => ({
				type: blockType as BlockNames,
				description: definition.description,
				codeTemplate: definition.codeTemplate
			}))
		}
		return this._allSandboxBlocks
	}

	private static getCategorizedBlocks(): CategorizedBlocks {
		if (isNull(this._categorizedBlocks)) {
			const allBlocks = this.getAllSandboxBlocks()
			this._categorizedBlocks = this.categorizeBlocks(allBlocks)
		}
		return this._categorizedBlocks
	}

	private static categorizeBlocks(allBlocks: AvailableBlock[]): CategorizedBlocks {
		const flatCategoryBlocks: AvailableBlock[] = []
		const hierarchicalBlocks: Record<ParentCategoryName, Record<string, AvailableBlock[]>> = {
			"Sensors": {},
			"Logic": {}
		}

		// Categorize all blocks
		allBlocks.forEach(block => {
			const blockDef = BLOCK_REGISTRY[block.type]

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!blockDef) return

			if (blockDef.parentCategory) {
				// This is a hierarchical block

				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				if (!hierarchicalBlocks[blockDef.parentCategory][blockDef.category]) {
					hierarchicalBlocks[blockDef.parentCategory][blockDef.category] = []
				}
				hierarchicalBlocks[blockDef.parentCategory][blockDef.category].push(block)
			} else {
				// This is a flat category block
				flatCategoryBlocks.push(block)
			}
		})

		// Group flat category blocks by category
		const flatCategories = groupBy(flatCategoryBlocks, block =>
			BLOCK_REGISTRY[block.type].category
		)

		return { flatCategories, hierarchicalBlocks }
	}

	private static formatFlatCategories(flatCategories: Record<string, AvailableBlock[]>): string {
		let formattedText = ""

		Object.entries(flatCategories).forEach(([categoryName, blocks]) => {
			if (blocks.length > 0) {
				const emoji = this.getCategoryEmojiUnified(categoryName) // CHANGED: use unified method
				formattedText += `${emoji} ${categoryName.toUpperCase()}:\n`

				blocks.forEach((block, index) => {
					formattedText += this.formatBlockEntry(block, "sandbox") // CHANGED: use unified formatting

					if (index < blocks.length - 1) {
						formattedText += "\n"
					}
				})
				formattedText += "\n\n"
			}
		})

		return formattedText
	}

	private static formatHierarchicalCategories(
		hierarchicalBlocks: Record<ParentCategoryName, Record<string, AvailableBlock[]>>
	): string {
		let formattedText = ""

		Object.entries(hierarchicalBlocks).forEach(([parentCategory, subCategories]) => {
			if (Object.keys(subCategories).length > 0) {
				const emoji = this.getParentCategoryEmoji(parentCategory as ParentCategoryName)
				formattedText += `${emoji} ${parentCategory.toUpperCase()}:\n`

				const subCategoryNames = Object.keys(subCategories).sort()

				subCategoryNames.forEach((subCategoryName, parentIndex) => {
					const blocks = subCategories[subCategoryName]
					const isLastParent = parentIndex === subCategoryNames.length - 1
					const subEmoji = this.getSubCategoryEmoji(subCategoryName as SensorCategoryName | LogicCategoryName)

					formattedText += `├─ ${subEmoji} ${subCategoryName}:\n`

					blocks.forEach((block, blockIndex) => {
						const isLastBlock = blockIndex === blocks.length - 1
						const connector = isLastParent && isLastBlock ? "   └─ " : "   ├─ "

						// CHANGED: Use unified formatting but customize the connector
						const blockEntry = this.formatBlockEntry(block, "sandbox")
						const lines = blockEntry.split("\n")
						formattedText += `${connector}${lines[0].substring(2)}\n` // Remove "  " prefix, add connector
						// eslint-disable-next-line max-len
						formattedText += `${isLastParent && isLastBlock ? "      " : "   │  "}${lines[1].substring(4)}\n` // Adjust code line

						if (!isLastBlock || !isLastParent) {
							formattedText += "\n"
						}
					})

					if (!isLastParent) {
						formattedText += "│\n"
					}
				})

				formattedText += "\n"
			}
		})

		return formattedText
	}

	private static getParentCategoryEmoji(parentCategory: ParentCategoryName): string {
		const emojis: Record<ParentCategoryName, string> = {
			"Sensors": "📡",
			"Logic": "🧠"
		}
		return emojis[parentCategory] || "📁"
	}

	private static getSubCategoryEmoji(subCategory: SensorCategoryName | LogicCategoryName): string {
		const emojis: Record<SensorCategoryName | LogicCategoryName, string> = {
			"IR Sensors": "👁️",
			"Distance Sensors": "📏",
			"Motion Sensor": "🎯",
			"Color Sensor": "🌈",
			"Variables": "📊",
			"Conditionals": "🤔",
			"Math": "🔢",
			"Loops": "🔄",
			"Start": "🚀"
		}
		return emojis[subCategory] || "📂"
	}

	// ADD - Unified emoji method
	private static getCategoryEmojiUnified(categoryPath: string): string {
		// Handle hierarchical categories (contains " > ")
		if (categoryPath.includes(" > ")) {
			if (categoryPath.includes("Sensors >")) return "📡"
			if (categoryPath.includes("Logic >")) return "🧠"
			return "📁"
		}

		// Handle flat categories
		const emojis: Record<string, string> = {
			"Motors": "🚗",
			"LED": "💡",
			"Screen": "📱",
			"Speaker": "🔊",
			"Buttons": "🎮"
		}
		return emojis[categoryPath] || "🔧"
	}

	// ADD - Unified block entry formatting
	private static formatBlockEntry(block: AvailableBlock, style: "sandbox" | "challenge"): string {
		const prefix = style === "challenge" ? "  • " : "  "
		const codeIndent = style === "challenge" ? "    " : "    "

		return `${prefix}${block.type}: ${block.description}\n${codeIndent}Code: ${block.codeTemplate}`
	}

	// ADD - Shared category sorting
	private static sortCategoriesByHierarchy(categories: [string, AvailableBlock[]][]): [string, AvailableBlock[]][] {
		return categories.sort(([a], [b]) => {
			const aHasParent = a.includes(" > ")
			const bHasParent = b.includes(" > ")
			if (aHasParent && !bHasParent) return 1
			if (!aHasParent && bHasParent) return -1
			return a.localeCompare(b)
		})
	}

	// ADD - Create challenge-style categories from any blocks
	private static createChallengeCategories(blocks: AvailableBlock[]): Record<string, AvailableBlock[]> {
		return blocks.reduce((acc, block) => {
			const blockDef = BLOCK_REGISTRY[block.type]

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (blockDef) {
				const categoryKey = blockDef.parentCategory
					? `${blockDef.parentCategory} > ${blockDef.category}`
					: blockDef.category


				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				if (!acc[categoryKey]) {
					acc[categoryKey] = []
				}
				acc[categoryKey].push(block)
			}
			return acc
		}, {} as Record<string, AvailableBlock[]>)
	}
}
