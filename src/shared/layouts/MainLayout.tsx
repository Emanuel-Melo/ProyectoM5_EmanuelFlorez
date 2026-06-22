import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/Header";

interface Props {
	children?: ReactNode;
}

export function MainLayout(_: Props) {
	return (
		<div>
			<Header />
			<main>
				<Outlet />
			</main>
		</div>
	);
}

export default MainLayout;
