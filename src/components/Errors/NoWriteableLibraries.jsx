import { Callout } from "@blueprintjs/core";


const NoWriteableLibraries = () => <Callout>No writeable libraries were found. Please check that your API key(s) have the permission to write to at least one of the Zotero libraries you use. <a href="https://alix-lahuec.gitbook.io/zotero-roam/getting-started/prereqs#zotero-api-credentials" target="_blank" rel="noreferrer">Refer to the extension docs</a> for more details.</Callout>;

export { NoWriteableLibraries };