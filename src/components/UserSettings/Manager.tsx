import { createContext, FC, ReactChildren, useCallback, useContext, useMemo, useState } from "react";
import { InitSettings } from "Types/extension";


type Setter<K extends keyof InitSettings> = (fn: (prev: InitSettings[K]) => InitSettings[K]) => void;

type Args<K extends keyof InitSettings> = {
	children: ReactChildren,
	init: InitSettings[K],
	updater: (prevState: InitSettings[K]) => void
};

type ContextValue<K extends keyof InitSettings> = (readonly [InitSettings[K], Setter<K>]) | null;
type ContextType<K extends keyof InitSettings> = ReturnType<typeof createContext<ContextValue<K> | null>>;

type UpdateHooks<K extends keyof InitSettings> = {
	[j in "beforeUpdate" | "afterUpdate"]: ((prevState: InitSettings[K], update: InitSettings[K]) => void) | null
}

export class SettingsManager<K extends keyof InitSettings> {
	context: ContextType<K>;
	hooks: Partial<UpdateHooks<K>>;

	constructor(hooks: Partial<UpdateHooks<K>> = {}) {
		this.context = createContext<ContextValue<K>>(null);
		this.hooks = hooks;
	}

	Provider: FC<Args<K>> = ({ children, init, updater }) => {
		const [settings, _setSettings] = useState<InitSettings[K]>(init);

		const setSettings = useCallback<Setter<K>>((updateFn) => {
			_setSettings((prevState) => {
				const update = updateFn(prevState);
				this.hooks.beforeUpdate?.(prevState, update);
				updater(update);
				this.hooks.afterUpdate?.(prevState, update);
				return update;
			});
		}, [updater]);

		const contextValue = useMemo(() => [settings, setSettings] as const, [settings, setSettings]);

		return (
			<this.context.Provider value={contextValue} >
				{children}
			</this.context.Provider>
		);
	};

	useSettings = () => {
		const context = useContext(this.context);

		if (!context) {
			throw new Error("No context provided");
		}

		return context;
	};

}
