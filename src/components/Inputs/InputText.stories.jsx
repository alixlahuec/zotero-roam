import React, { useState } from "react";
import InputText from "./InputText";

export default {
	component: InputText
};

const Template = (args) => {
	const { value: valueFromArgs, setValue: setFromArgs, ...argList } = args;
	const [value, setValue] = useState(valueFromArgs || "");
	return <InputText value={value} setValue={setValue} {...argList} />;
};

export const Default = Template.bind({});
Default.args = {

};