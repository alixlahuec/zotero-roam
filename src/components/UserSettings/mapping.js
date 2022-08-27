import { AnnotationsProvider, AnnotationsWidget } from "./Annotations";
import { AutocompleteProvider, AutocompleteWidget } from "./Autocomplete";
import { CopyProvider, CopyWidget } from "./Copy";
import { MetadataProvider, MetadataWidget } from "./Metadata";
import { NotesProvider, NotesWidget } from "./Notes";
import { OtherSettingsProvider, OtherSettingsWidget } from "./Other";
import { PageMenuProvider, PageMenuWidget } from "./PageMenu";
import { ShortcutsProvider, ShortcutsWidget } from "./Shortcuts";
import { WebImportProvider, WebImportWidget } from "./WebImport";

import { RequestsProvider } from "./Requests";
import RequestsWidget from "./Requests/RequestsWidget";
import { SciteProvider } from "./Scite";
import { TypemapProvider } from "./Typemap";


export const SETTINGS_CONFIG = [
	{
		component: RequestsProvider,
		id: "requests",
		widget: RequestsWidget
	},
	{
		component: AnnotationsProvider,
		id: "annotations",
		widget: AnnotationsWidget
	},
	{
		component: AutocompleteProvider,
		id: "autocomplete",
		widget: AutocompleteWidget
	},
	{
		component: CopyProvider,
		id: "copy",
		widget: CopyWidget
	},
	{
		component: MetadataProvider,
		id: "metadata",
		widget: MetadataWidget
	},
	{
		component: NotesProvider,
		id: "notes",
		widget: NotesWidget
	},
	{
		component: PageMenuProvider,
		id: "pageMenu",
		widget: PageMenuWidget
	},
	{
		component: SciteProvider,
		id: "sciteBadge"
	},
	{
		component: ShortcutsProvider,
		id: "shortcuts",
		widget: ShortcutsWidget
	},
	{
		component: TypemapProvider,
		id: "typemap"
	},
	{
		component: WebImportProvider,
		id: "webimport",
		widget: WebImportWidget
	},
	{
		component: OtherSettingsProvider,
		id: "other",
		widget: OtherSettingsWidget
	}
];