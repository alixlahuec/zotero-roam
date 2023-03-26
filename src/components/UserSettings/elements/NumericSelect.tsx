import { FC, ReactNode, useCallback } from "react";
import { NumericInput, NumericInputProps } from "@blueprintjs/core";

import { Description, Row, Title } from ".";


type OwnProps = {
	description?: ReactNode | null,
	label: string,
	setValue: (val: number) => void,
	title?: ReactNode | null,
	value: number
};

const NumericSelect: FC<OwnProps & Partial<NumericInputProps>> = (props) => {
	const { description = null, label, setValue, title = null, value, ...extraProps } = props;
	const handler = useCallback((num, _numAsString) => setValue(num), [setValue]);

	return <Row>
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		<NumericInput aria-label={label} min={0} minorStepSize={1} onValueChange={handler} selectAllOnFocus={true} selectAllOnIncrement={true} {...extraProps} />
	</Row>;
};

export { NumericSelect };