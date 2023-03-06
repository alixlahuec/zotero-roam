/** 
 * A custom SmartBlock command
 * @see https://roamjs.com/extensions/smartblocks/developer_docs#xB__yUfkW
*/
export interface SmartblockCommand {
	/** The name for the command. Must be all capital letters. */
	text: string,
	/** A user-facing description for the command  */
	help?: string,
	/** The callback to execute when the command is run. It takes in a context object and returns a second callback. The second callback takes in a list of string arguments and returns the text or list of texts to be outputted by the command. */
	handler: (args: { variables: Record<string, any> }) => (...params: any[]) => string | string[] | Promise<string> | Promise<string[]>
}