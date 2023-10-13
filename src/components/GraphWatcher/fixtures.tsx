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