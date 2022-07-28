import React, { useState } from "react";
import InputText from "./InputText";

export default {
	component: InputText
};

const Template = (args) => {
	const { defaultValue = "", ...argList } = args;
	const [value, setValue] = useState(defaultValue);
	return <InputText value={value} setValue={setValue} {...argList} />;
};

export const Default = Template.bind({});
Default.args = {

};