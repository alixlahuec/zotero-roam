import { Children, ComponentType, FC, ReactElement, ReactNode, cloneElement, useCallback, useMemo } from "react";
import { Checkbox } from "@blueprintjs/core";

import { Description, OptionTitle, Title } from ".";


type RowGroupArgs = {
	description?: ReactNode | null,
	onChange: (id: string) => void,
	options: Record<string, string>,
	selected: string,
	title?: string | null
};
const RowGroup: FC<RowGroupArgs> = (props) => {
	const { children, description = null, onChange, options, selected, title = null } = props;

	return <div zr-role="settings-row-group">
		<div>
			{title && <Title>{title}</Title>}
			{description && <Description>{description}</Description>}
		</div>
		{Children.map<ReactNode, ReactNode>(children, (child) => {
			return cloneElement(
				child as ReactElement<RowGroupOptionProps>,
				{ handleSelect: onChange, options, selected }
			);
		})}
	</div>;
};


type Options = Record<string, string>;

type RowGroupOptionPublicProps = {
	alignToBaseline?: boolean,
	description?: ReactNode | null,
	id: keyof Options
};

type RowGroupOptionProps = RowGroupOptionPublicProps & {
	handleSelect: (id: keyof Options) => void,
	options: Options,
	selected: keyof Options
};

const _RowGroupOption: FC<RowGroupOptionProps> = (props) => {
	const { alignToBaseline = false, children, description = null, handleSelect, id, options, selected } = props;
	const isSelected = useMemo(() => selected == id, [id, selected]);
	const onChange = useCallback(() => handleSelect(id), [handleSelect, id]);

	return <div className={["zr-settings-rowgroup--option", alignToBaseline && "align-items-baseline"].filter(Boolean).join(" ")} >
		<Checkbox
			checked={selected == id}
			className={["zr-settings-rowgroup--option-label", isSelected && "selected"].filter(Boolean).join(" ")}
			inline={false}
			labelElement={<div>
				<OptionTitle>{options[id]}</OptionTitle>
				{description && <Description>{description}</Description>}
			</div>}
			onChange={onChange}
		/>
		{children}
	</div>;
};

const RowGroupOption = _RowGroupOption as ComponentType<RowGroupOptionPublicProps>;

export {
	RowGroup,
	RowGroupOption
};