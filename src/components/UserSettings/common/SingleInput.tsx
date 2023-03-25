import { FC, ReactNode, useMemo } from "react";
import { ButtonProps } from "@blueprintjs/core";

import { BetterSelect, Description, Row, Title } from ".";


type OwnProps = {
	buttonProps?: Partial<ButtonProps>,
	description?: ReactNode | null,
	menuTitle: string,
	onChange: (val: string) => void,
	options: { label: string, value: string | boolean }[],
	selectProps?: Record<string, any>,
	title?: ReactNode | null,
	value: string | boolean
};

const SingleInput: FC<OwnProps> = (props) => {
	const { buttonProps = {}, description = null, menuTitle, onChange, options, selectProps = {}, title = null, value } = props;

	const suppProps = useMemo(() => ({
		title: menuTitle
	}), [menuTitle]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<BetterSelect buttonProps={buttonProps} options={options} onSelect={onChange} popoverTargetProps={suppProps} selectedValue={value} {...selectProps} />
	</Row>;
};

export { SingleInput };