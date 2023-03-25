import { InputMultiSelect } from "Components/Inputs";
import { CustomClasses } from "../../../constants";


type OptionsArray = { label: string, value: string }[];

// TODO: consolidate with InputMultiSelect
const MultiInput = ({ options, setValue, value, ...props }: { options: OptionsArray, setValue: (val: string[]) => void, value: string[] } & Record<string,any> ) => {
	return <InputMultiSelect className={CustomClasses.TEXT_SMALL} options={options} setValue={setValue} value={value} {...props} />;
};

export { MultiInput };