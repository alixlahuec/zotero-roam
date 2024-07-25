export interface SBConfig {
	/** The type of SmartBlock identifier provided */
	param: "srcName" | "srcUid",
	/** The value of the SmartBlock identifier */
	paramValue: string
}

export namespace SmartblocksPlugin {
	/**
	 * The context passed to a SmartBlock command
	 */
	export interface CommandContext {
		/** The UID of the block where the SmartBlock was triggered */
		targetUid: string,
		/** Variables passed to the command */
		variables: Record<string, any>
	}

	export type ImportableBlock = {
		children: ImportableBlock[]
		text: string
	} & Record<string, any>;

	type ImportableElement = ImportableBlock | string;

	/**
	 * Parameters for triggering a SmartBlock. Both the SmartBlock and the target block can be described by either their Roam UID or their name; an identifier must be provided for each (`srcName` or `srcUid`; `targetName` or `targetUid`).
	 * Additional `variables` can be passed to the SmartBlock context.
	 */
	interface TriggerSmartblockArgs {
		/** The Smartblock's name */
		srcName?: string,
		/** The Smartblock's block UID */
		srcUid?: string,
		/** The name of the page where the Smartblock should be triggered. The workflow will be triggered at the bottom of the page. */
		targetName?: string,
		/** The UID of the page or block where the Smartblock should be triggered. */
		targetUid?: string,
		/** Additional variables to pass to the Smartblock's context. */
		variables?: Record<string, any>
	}

	/**
	 * Methods available via the `window.roamjs.extension.smartblocks` object.
	 */
	export interface API {
		/**
		 * @see https://roamjs.com/extensions/smartblocks/developer_docs#xB__yUfkW
		 * @param cmd - The SmartBlock command to register
		 */
		registerCommand: (cmd: Command) => void,
		/**
		 * @see https://roamjs.com/extensions/smartblocks/developer_docs#nJ8-c8efE
		 * @returns `0` if  no blocks were outputted, otherwise  the UID of the first outputted block
		 */
		triggerSmartblock: (sb: TriggerSmartblockArgs) => Promise<0 | string>,
		/** @see https://github.com/dvargas92495/roamjs-components/blob/7aeae1482714a4c829c8141667eb1d459403b4ec/src/util/registerSmartBlocksCommand.ts 
		 * @param label - The label of the SmartBlock command to unregister
		 */
		unregisterCommand: (label: string) => void
	}

	/** 
	  * A custom SmartBlock command
	  * @see https://roamjs.com/extensions/smartblocks/developer_docs#xB__yUfkW
	*/
	export interface Command {
		/** The name for the command. Must be all capital letters. */
		text: string,
		/** A user-facing description for the command  */
		help?: string,
		/** The callback to execute when the command is run. It takes in a context object and returns a second callback. The second callback takes in a list of string arguments and returns the text or list of texts to be outputted by the command. */
		handler: (ctx: CommandContext) => (...params: any[]) => ImportableElement | ImportableElement[] | Promise<ImportableElement> | Promise<ImportableElement[]>
	}

}
