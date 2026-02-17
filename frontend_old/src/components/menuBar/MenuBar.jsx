import React, { useCallback, useEffect, memo } from "react";
import PropTypes from "prop-types";
import "./menuBar.css";

import menuIcon from "../../assets/icons/menu.svg";

function MenuBar({ menuItems, navigate, menuName, isMenuOpen, setIsMenuOpen }) {
	const handleMenuChange = useCallback(
		(item) => {
			setIsMenuOpen(false); // Close menu on item click

			if (menuName !== item?.menuName) navigate(item?.menuName);
		},
		[menuName, setIsMenuOpen, navigate]
	);

	const handleCloseMenu = (e) => {
		if (e.target.className.includes("backdrop")) {
			setIsMenuOpen(false);
		}
	};

	useEffect(() => {
		if (isMenuOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}
	}, [isMenuOpen]);

	return (
		<>
			<div className={`backdrop ${isMenuOpen ? "open" : ""}`} onClick={handleCloseMenu}></div>
			<div className={`menuBar ${isMenuOpen ? "open" : ""}`}>
				<div className="menuToggleBar">
					<img src={menuIcon} alt="menu" loading="lazy" onClick={() => setIsMenuOpen(false)} />
					Menu
				</div>

				{menuItems.map(({ name, path }, index) => (
					<div
						key={index}
						className={`menuBtn ${menuName === path ? "activeMenu" : ""}`}
						onClick={() => handleMenuChange({ menuName: path, name })}
					>
						{name}
					</div>
				))}
			</div>
		</>
	);
}

MenuBar.propTypes = {
	menuItems: PropTypes.arrayOf(
		PropTypes.shape({
			path: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
		})
	).isRequired,
	isMenuOpen: PropTypes.bool.isRequired,
	setIsMenuOpen: PropTypes.func.isRequired,
	navigate: PropTypes.func.isRequired,
	menuName: PropTypes.string.isRequired,
};

export default memo(MenuBar);
