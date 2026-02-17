import { memo } from "react";

import "../styles/homePage.css";

import Disease from "../components/homePage/disease/Disease";
import HeroSection from "../components/homePage/heroSection/HeroSection";
// import Trending from "../components/homePage/trending/Trending";
import DoMore from "../components/homePage/doMore/DoMore";
import Footer from "../components/footer/Footer";

// import { extractEncryptedToken } from "../utils";

// const userLoggedIn = localStorage?.getItem("JWT_token");
// const userType = extractEncryptedToken(userLoggedIn)?.type;

function HomePage() {
	return (
		<div id="homePage">
			<HeroSection />
			<Disease />
			{/* <Trending /> */}
			<DoMore />
			<Footer />
		</div>
	);
}

export default memo(HomePage);
