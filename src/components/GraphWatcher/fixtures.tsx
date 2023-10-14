/* eslint-disable react/jsx-no-target-blank */
import { Fragment } from "react";


const roamMainPage = (title: string) => <div className="rm-article-wrapper">
	<div className="roam-article">
		<div>
			<div>
				<h1 className="rm-title-display">
					<span>{title}</span>
				</h1>
			</div>
			<div className="rm-block-children rm-block__children rm-block--ghost rm-level-0">
				<div className="roam-block-container rm-block rm-block--ghost">
					<div className="rm-block-main rm-block__self">
						<div className="controls rm-block__controls">
							<span>
								<span className="bp3-icon-standard bp3-icon-minus"></span>
							</span>
							<span className="simple-bullet-outer">
								<span className="simple-bullet-inner"></span>
							</span>
						</div>
						<div id="block-input-ghost" className="roam-block dont-unfocus-block">
							<span>Click here to start writing.</span>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div>
			<div className="rm-reference-main">
				<div>
					<div>
						<div className="flex-h-box">
							<span className="bp3-icon-standard bp3-icon-caret-down rm-caret rm-caret-closed rm-caret-hidden dont-focus-block"></span>
							<div></div>
							<strong>Unlinked References</strong>
							<div></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>;


const dnpLogEntry = (title: string) => <div className="roam-log-page">
	<h1 className="rm-title-display">{title}</h1>
	<div className="rm-block-children rm-block__children rm-block--ghost rm-level-0">
		<div className="roam-block-container rm-block rm-block--ghost">
			<div className="rm-block-main rm-block__self">
				<div className="controls rm-block__controls">
					<span>
						<span className="bp3-icon-standard bp3-icon-minus"></span>
					</span>
					<span className="simple-bullet-outer">
						<span className="simple-bullet-inner"></span>
					</span>
				</div>
				<div id="block-input-ghost" className="roam-block dont-unfocus-block">
					<span>Click here to start writing.</span>
				</div>
			</div>
		</div>
	</div>
	<div>
		<div className="rm-reference-main">
			<div></div>
		</div>
	</div>
</div>;


const dnpLogEntryPreview = (title: string) => <div className="roam-log-page roam-log-preview">
	<div>
		<h1 className="level2">{title}</h1>
	</div>
</div>;


const dnpLogView = ({ entries = [], preview = null }: { entries?: string[], preview?: string | null }) => <div id="rm-log-container" className="rm-article-wrapper">
	<div className="roam-article">
		<div className="roam-log-container">
			{entries.map((title, index) => <Fragment key={index}>{dnpLogEntry(title)}</Fragment>)}
			{preview && dnpLogEntryPreview(preview)}
		</div>
	</div>
</div>;


const inlinePageReference = (title: string) => <span data-link-title={title} data-link-uid="some-page-uid" data-testid="reference-wrapper">
	<span tabIndex={-1} className="rm-page-ref rm-page-ref--link" data-testid="reference-link">{title}</span>
</span>;


const aliasedLink = (href: string, title: string = "Some link title") => <span>
	<span className="bp3-popover-wrapper">
		<span aria-haspopup="true" className="bp3-popover-target">
			<a target="_blank" href={href} className="rm-alias rm-alias--external" tabIndex={0}>{title}</a>
		</span>
	</span>
</span>;


const plainHrefLink = (href: string) => <a target="_blank" href={href}>{href}</a>;


const roamBlock = ({ content, pageLinks = [] }) => <div data-create-time="1650246111969" data-page-links={JSON.stringify(pageLinks)} data-edit-display-name="Jane Doe" data-edit-time="1650246563557" className="roam-block-container rm-block rm-block--mine  rm-block--open rm-block--editable rm-not-focused block-bullet-view" data-page-title="Some Page Title" data-path-page-links="[]">
	<div className="rm-block-main rm-block__self">
		<div className="controls rm-block__controls">
			<span className="block-expand">
				<span className="bp3-icon-standard bp3-icon-caret-down rm-caret rm-caret-open rm-caret-hidden"></span>
			</span>
			<span className="rm-bullet " draggable="true">
				<span className="bp3-popover-wrapper">
					<span aria-haspopup="true" className="bp3-popover-target">
						<span className="rm-bullet__inner" tabIndex={0}></span>
					</span>
				</span>
			</span>
		</div>
		<div id="block-input-AZ9ct58wG4byaQ4uRDyR4rsw6Pv2-body-outline-9tXf3-XPq-3ieD1-zDn" className="rm-block__input rm-block__input--view roam-block dont-unfocus-block hoverparent rm-block-text" tabIndex={0}>
			<span>{content}</span>
		</div>
		<div className="rm-block-separator"></div>
		<div style={{ minWidth: "24px" }}></div>
	</div>
	<div className="rm-block-children rm-block__children rm-level-1">
		<div className="rm-multibar"></div>
	</div>
</div>;


export const DnpLogWithItems = () => dnpLogView({ entries: ["November 12th, 2021"] });
export const DnpPageWithItems = () => roamMainPage("June 19th, 2021");
export const DnpLogWithoutItems = () => dnpLogView({ entries: ["April 6th, 1999"] });
export const DnpPageWithoutItems = () => roamMainPage("April 6th, 1999");
export const DnpPreviewWithItems = () => dnpLogView({ preview: "June 19th, 2021" });

export const CitekeyPageValid = () => roamMainPage("@blochImplementingSocialInterventions2021");
export const CitekeyPageInvalid = () => roamMainPage("@nonExistentCitekey");

export const NormalPageWithoutTaggingContent = () => roamMainPage("September");
export const NormalPageWithTaggingContent = () => roamMainPage("housing");

export const CitekeyReferenceValid = () => inlinePageReference("@blochImplementingSocialInterventions2021");
export const CitekeyReferenceInvalid = () => inlinePageReference("@nonExistentCitekey");

export const blockWithHrefLink = (tags) => roamBlock({ content: plainHrefLink("https://plain-example.com"), pageLinks: tags });
export const blockWithAliasedLink = (tags) => roamBlock({ content: aliasedLink("https://aliased-example.com"), pageLinks: tags });
