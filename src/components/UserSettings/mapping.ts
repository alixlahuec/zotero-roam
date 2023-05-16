import { AnnotationsProvider, AnnotationsWidget } from "./Annotations";
import { AutocompleteProvider, AutocompleteWidget } from "./Autocomplete";
import { CopyProvider, CopyWidget } from "./Copy";
import { MetadataProvider, MetadataWidget } from "./Metadata";
import { NotesProvider, NotesWidget } from "./Notes";
import { OtherSettingsProvider, OtherSettingsWidget } from "./Other";
import { PageMenuProvider, PageMenuWidget } from "./PageMenu";
import { SciteProvider, SciteWidget } from "./Scite";
import { ShortcutsProvider, ShortcutsWidget } from "./Shortcuts";
import { TypemapProvider, TypemapWidget } from "./Typemap";
import { WebImportProvider, WebImportWidget } from "./WebImport";

import { RequestsProvider, RequestsWidget } from "./Requests";
import { SettingsProvider } from "./SettingsManager";
import { InitSettings } from "Types/extension";


type SettingsConfig = {
	component: SettingsProvider<keyof InitSettings>,
	id: keyof InitSettings,
	widget: () => JSX.Element
}[];

export const SETTINGS_CONFIG: SettingsConfig = [
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
		id: "sciteBadge",
		widget: SciteWidget
	},
	{
		component: ShortcutsProvider,
		id: "shortcuts",
		widget: ShortcutsWidget
	},
	{
		component: TypemapProvider,
		id: "typemap",
		widget: TypemapWidget
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