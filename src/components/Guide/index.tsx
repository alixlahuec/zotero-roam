import { ReactNode, useMemo } from "react";
import { H6, Icon } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";

import { CustomClasses } from "../../constants";
import "./_index.sass";


function GuideHeader({ children }: { children: ReactNode }){
	return <H6>{children}</H6>;
}


type LinkProps = {
	href: string,
	text: string
};

function Link({ href, text }: LinkProps){
	return <a href={href} rel="noreferrer" target="_blank" >{text}</a>;
}


const CitoidCopy = <>
	<p>Metadata is obtained through the <Link href="https://en.wikipedia.org/api/rest_v1/#/Citation/getCitation" text="Wikimedia API" />. It should give the same results as the Zotero Connector (note : PDFs are currently not added automatically).</p> 
	<p>If the API was unable to retrieve metadata for a given URL, the item will not appear below.</p>
</>;

const SemanticCopy = <>
	<p>References, citations, and their metadata are obtained through the <Link href="https://api.semanticscholar.org/corpus" text="Semantic Scholar API" />.</p> 
	<p>Note that the API does not guarantee the identification of all papers, and that the metadata available is limited (for example, abstracts are currently not available).</p>
</>;


type GuideProps = {
	content: ReactNode,
	header?: ReactNode
};

function Guide({ content, header = "" }: GuideProps){
	const guideContent = useMemo(() => {
		return <>
			{header && <GuideHeader>{header}</GuideHeader>}
			{content}
		</>;
	}, [content, header]);
	return <Popover2 className="zr-guide-popover--target" content={guideContent} interactionKind="hover-target" popoverClassName={[CustomClasses.POPOVER, "zr-guide-popover"].join(" ")} >
		<Icon icon="help" size={14} tabIndex={-1} />
	</Popover2>;
}


const CitoidGuide = () => <Guide header="About this data" content={CitoidCopy} />;
const SemanticGuide = () => <Guide header="About this data" content={SemanticCopy} />;

export {
	Guide,
	Link,
	CitoidGuide,
	SemanticGuide
};

