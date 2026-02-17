import { useState, memo } from "react";
import PropTypes from "prop-types";
import "./NavBar.css";

import { NavLink, useNavigate } from "react-router-dom";
import { userDeviceType } from "../../utils";
import { useAuthContext } from "../../contexts/AuthContext";
import MenuBar from "../menuBar/MenuBar";

import brandLogo from "../../assets/brandLogo.png";
import brandLogo1 from "../../assets/brandLogo1.png";
// import searchIcon from '../../assets/icons/search.svg';
import profileIcon from "../../assets/icons/profile.svg";
import menuIcon from "../../assets/icons/menu.svg";

const menuItems = [
	{
		name: "Home",
		path: "/",
	},
	{
		name: "Medicine",
		path: "/medicine_search",
	},
	{
		name: "Prescription Explainer",
		path: "/prescription_Explainer",
	},
	{
		name: "Drug Drug Interaction",
		path: "/drug-drug-interaction",
	},
	{
		name: "Assistance",
		path: "/assistance",
	},
	{
		name: "Doctor Suggest",
		path: "/doctor_suggest",
	},
];

const NabBar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { isAuthenticated, userProfile, logout } = useAuthContext();

	const menuName = `/${location.pathname?.split("/")[1]}`;
	const navigate = useNavigate();

	const handleSignOut = async () => {
		try {
			await logout();
			navigate("/");
		} catch (error) {
			console.error("Error during logout:", error);
		}
	};

	return (
		<nav>
			{userDeviceType().mobile ? (
				<MobileNavBar
					navigate={navigate}
					menuName={menuName}
					isMenuOpen={isMenuOpen}
					setIsMenuOpen={setIsMenuOpen}
					isAuthenticated={isAuthenticated}
					userProfile={userProfile}
					handleSignOut={handleSignOut}
				/>
			) : (
				<DesktopNavBar
					isAuthenticated={isAuthenticated}
					userProfile={userProfile}
					handleSignOut={handleSignOut}
				/>
			)}
		</nav>
	);
};

function DesktopNavBar({ isAuthenticated, userProfile, handleSignOut }) {
	return (
		<>
			<div className="nav-links">
				<NavLink className="nav-logo" to="/">
					<img src={brandLogo} alt="Logo" />
				</NavLink>

				{menuItems.map(({ name, path }, index) => (
					<NavLink key={index} to={path} className={({ isActive }) => (isActive ? "active" : "")}>
						{name}
					</NavLink>
				))}
			</div>
			<div className="nav-links_2">
				{/* <NavLink className="nav-icon" to="/">
					<img src={searchIcon} alt="sogo" />
				</NavLink> */}
				{isAuthenticated ? (
					<div className="profile-container">
						<span className="user-email">{userProfile?.email || "User"}</span>
						<button className="logout-btn" onClick={handleSignOut}>
							Logout
						</button>
					</div>
				) : (
					<NavLink className="nav-icon" to="/login">
						<img src={profileIcon} alt="Login" />
					</NavLink>
				)}
			</div>
		</>
	);
}

DesktopNavBar.propTypes = {
	isAuthenticated: PropTypes.bool.isRequired,
	userProfile: PropTypes.object,
	handleSignOut: PropTypes.func.isRequired,
};

function MobileNavBar({ navigate, menuName, isMenuOpen, setIsMenuOpen, isAuthenticated, userProfile, handleSignOut }) {
	return (
		<>
			<div className="phone-nav-links">
				<div className="menuIcon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
					<img src={menuIcon} alt="Menu" />
				</div>
				<NavLink className="nav-logo phoneBrandLogo" to="/">
					<img src={brandLogo1} alt="Logo" />
					Niraksh
				</NavLink>

				{isAuthenticated ? (
					<div className="mobile-profile" onClick={handleSignOut}>
						<span className="logout-text" title={userProfile?.email || "User"}>
							Logout
						</span>
					</div>
				) : (
					<NavLink className="nav-icon" to="/login">
						<img src={profileIcon} alt="Login" />
					</NavLink>
				)}
			</div>
			<MenuBar
				menuItems={menuItems}
				navigate={navigate}
				menuName={menuName}
				isMenuOpen={isMenuOpen}
				setIsMenuOpen={setIsMenuOpen}
			/>
		</>
	);
}

MobileNavBar.propTypes = {
	navigate: PropTypes.func.isRequired,
	menuName: PropTypes.string.isRequired,
	isMenuOpen: PropTypes.bool.isRequired,
	setIsMenuOpen: PropTypes.func.isRequired,
	isAuthenticated: PropTypes.bool.isRequired,
	userProfile: PropTypes.object,
	handleSignOut: PropTypes.func.isRequired,
};

export default memo(NabBar);
