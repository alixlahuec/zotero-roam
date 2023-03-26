import { FC, ReactNode } from "react";
import { Code, H4, H5 } from "@blueprintjs/core";

import { CustomClasses } from "../../../constants";


const Title: FC = ({ children }) => <H4>{children}</H4>;
const OptionTitle: FC = ({ children }) => <H5>{children}</H5>;

const Description: FC = ({ children }) => (
	<span className={[CustomClasses.TEXT_SECONDARY, CustomClasses.TEXT_SMALL].join(" ")}>
		{children}
	</span>
);

const Definition = ({ item, text = null }: { item: string, text?: string | null }) => (
	<div className="zr-definition--wrapper">
		<Code className="zr-definition--item">{item}</Code>
		{text && <span>{text}</span>}
	</div>
);

const Row: FC = ({ children }) => <div zr-role="settings-row">{children}</div>;

type RowColProps = {
	description?: ReactNode | null,
	rightElement?: ReactNode | null,
	title?: ReactNode | null
}
const RowCol: FC<RowColProps> = (props) => {
	const { children, description = null, rightElement = null, title = null } = props;
	return (
		<div zr-role="settings-row-col">
			<div>
				{title && <Title>{title}</Title>}
				{description && <Description>{description}</Description>}
			</div>
			{rightElement}
			<div zr-role="settings-row-col--container">
				{children}
			</div>
		</div>
	);
};


export {
	Title,
	OptionTitle,
	Description,
	Definition,
	Row,
	RowCol
};