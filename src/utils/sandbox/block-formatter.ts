import { groupBy } from "lodash"
import { BlockNames, AvailableBlock, ParentCategoryName,
	SensorCategoryName, LogicCategoryName, BLOCK_REGISTRY } from "@bluedotrobots/common-ts"

export class BlockFormatter {
	//Formats all available blocks for LLM context with hierarchical organization
	public static formatBlocksForSandboxLLMContext(): string {
		const allBlocks = this.getAllSandboxBlocks()
		const { flatCategories, hierarchicalBlocks } = this.categorizeBlocks(allBlocks)

		let formattedText = ""
		formattedText += this.formatFlatCategories(flatCategories)
		formattedText += this.formatHierarchicalCategories(hierarchicalBlocks)

		return formattedText.trim()
	}

	private static categorizeBlocks(allBlocks: AvailableBlock[]): {
		flatCategories: Record<string, AvailableBlock[]>,
		hierarchicalBlocks: Record<ParentCategoryName, Record<string, AvailableBlock[]>>
	} {
		const flatCategoryBlocks: AvailableBlock[] = []
		const hierarchicalBlocks: Record<ParentCategoryName, Record<string, AvailableBlock[]>> = {
			"Sensors": {},
			"Logic": {}
		}

		// Categorize all blocks
		allBlocks.forEach(block => {
			const blockDef = BLOCK_REGISTRY[block.type]
			if (!blockDef) return

			if (blockDef.parentCategory) {
				// This is a hierarchical block
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
			BLOCK_REGISTRY[block.type]?.category
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
	// Simpler format for challenges (less visual noise)
	public static formatChallengeBlocksForCqLLMContext(availableBlocks: AvailableBlock[]): string {
		const blocksByCategory = this.createChallengeCategories(availableBlocks) // CHANGED: use shared method

		const sortedCategories = this.sortCategoriesByHierarchy(Object.entries(blocksByCategory)) // CHANGED: use shared sorting

		return sortedCategories
			.map(([categoryPath, blocks]) => {
				const blockList = blocks.map(block =>
					this.formatBlockEntry(block, "challenge") // CHANGED: use unified formatting
				).join("\n")

				const emoji = this.getCategoryEmojiUnified(categoryPath) // CHANGED: use unified emoji

				return `${emoji} ${categoryPath}:\n${blockList}`
			}).join("\n\n")
	}

	// Get all blocks for sandbox mode
	private static getAllSandboxBlocks(): AvailableBlock[] {
		return Object.entries(BLOCK_REGISTRY).map(([blockType, definition]) => ({
			type: blockType as BlockNames,
			description: definition.description,
			codeTemplate: definition.codeTemplate
		}))
	}

	// Private helper methods for emojis
	private static getCategoryEmoji(category: string): string {
		const emojis: Record<string, string> = {
			"Motors": "🚗",
			"LED": "💡",
			"Screen": "📱",
			"Speaker": "🔊",
			"Buttons": "🎮"
		}
		return emojis[category] || "🔧"
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
			if (blockDef) {
				const categoryKey = blockDef.parentCategory
					? `${blockDef.parentCategory} > ${blockDef.category}`
					: blockDef.category

				if (!acc[categoryKey]) {
					acc[categoryKey] = []
				}
				acc[categoryKey].push(block)
			}
			return acc
		}, {} as Record<string, AvailableBlock[]>)
	}
}
