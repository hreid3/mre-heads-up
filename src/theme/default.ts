import * as MRE from "@microsoft/mixed-reality-extension-sdk";

const theme = {
	color: {
		font: {
			header: MRE.Color3.White(),
			paragraph: MRE.Color3.White(),
		},
		background: MRE.Color3.Blue(),
		button: {
			default: {
				text: MRE.Color3.White(),
				background: MRE.Color3.Red(),
			},
			disable: {
				text: MRE.Color3.DarkGray(),
				background: MRE.Color3.White(),
			},
			hover: {
				text: MRE.Color3.Blue(),
				background: MRE.Color3.LightGray(),
			}
		}
	}
}
export default theme;
