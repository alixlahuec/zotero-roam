export type ExtensionContextValue = {
	portalId: string,
	version: string
};

export enum ExtensionStatusEnum {
	DISABLED = "disabled",
	OFF = "off",
	ON = "on"
}

export type ZItemReferenceFormat = "inline" | "tag" | "pageref" | "citation" | "popover" | "zettlr" | "citekey" | "key";