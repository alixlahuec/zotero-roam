import { FC, FormEventHandler, ReactNode } from "react";
import { Switch, SwitchProps } from "@blueprintjs/core";

import { Description, Row, Title } from ".";


type OwnProps = {
	description?: ReactNode | null,
	isChecked: boolean,
	label: string,
	onChange?: FormEventHandler<HTMLInputElement>,
	title?: ReactNode | null
};
const Toggle: FC<OwnProps & Partial<SwitchProps>> = (props) => {
	const { description = null, isChecked, label, onChange = undefined, title = null, ...extraProps } = props;
	return (
		<Row>
			<div>
				{title && <Title>{title}</Title>}
				{description && <Description>{description}</Description>}
			</div>
			<Switch aria-checked={isChecked} checked={isChecked} aria-label={label} onChange={onChange} role="switch" {...extraProps} />
		</Row>
	);
};

export { Toggle };