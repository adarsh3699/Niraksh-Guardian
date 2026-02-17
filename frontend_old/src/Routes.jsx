import { memo, Suspense, lazy, useEffect } from "react";
import { DNA } from "react-loader-spinner";
import { Navigate, useLocation, Routes as Switch, Route } from "react-router-dom";

import NavBar from "./components/navBar/NavBar";
import AuthGuard from "./components/authGuard/AuthGuard";

//lazy loading split the main bundle into many chunks
const HomePage = lazy(() => import("./pages/HomePage"));
const PrescriptionExplainer = lazy(() => import("./pages/PrescriptionExplainer"));
const MedicineSearch = lazy(() => import("./pages/MedicineSearch"));
const Assistance = lazy(() => import("./pages/Assistance"));
const DrugDrugInteraction = lazy(() => import("./pages/DrugDrugInteraction"));
const UserLogin = lazy(() => import("./pages/UserLogin"));
const UserSignup = lazy(() => import("./pages/UserSignup"));
const UserForgetPass = lazy(() => import("./pages/UserForgetPass"));
const DoctorSuggest = lazy(() => import("./pages/DoctorSuggest"));
const AboutUs = lazy(() => import("./pages/AboutUs"));

function Routes() {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);

	return (
		<Suspense
			fallback={
				<div id="loadingScreen">
					<div>Loading...</div>
					<DNA
						visible={true}
						height="180"
						width="180"
						ariaLabel="dna-loading"
						wrapperStyle={{}}
						wrapperClass="dna-wrapper"
					/>
				</div>
			}
		>
			<Switch>
				<Route
					exact
					path="/"
					element={
						<>
							<NavBar />
							<HomePage />
						</>
					}
				/>
				<Route exact path="/home" element={<Navigate to="/" />} />

				<Route
					exact
					path="/prescription_explainer"
					element={
						<>
							<NavBar />
							<AuthGuard>
								<PrescriptionExplainer />
							</AuthGuard>
						</>
					}
				/>

				<Route
					exact
					path="/medicine_search"
					element={
						<>
							<NavBar />
							<AuthGuard>
								<MedicineSearch />
							</AuthGuard>
						</>
					}
				/>

				<Route
					exact
					path="/drug-drug-interaction"
					element={
						<>
							<NavBar />
							<AuthGuard>
								<DrugDrugInteraction />
							</AuthGuard>
						</>
					}
				/>

				<Route
					exact
					path="/assistance"
					element={
						<>
							<NavBar />
							<AuthGuard>
								<Assistance />
							</AuthGuard>
						</>
					}
				/>

				<Route
					exact
					path="/doctor_suggest"
					element={
						<>
							<NavBar />
							<AuthGuard>
								<DoctorSuggest />
							</AuthGuard>
						</>
					}
				/>

				<Route
					exact
					path="/login"
					element={
						<>
							<NavBar />
							<UserLogin />
						</>
					}
				/>
				<Route
					exact
					path="/register"
					element={
						<>
							<NavBar />
							<UserSignup />
						</>
					}
				/>
				<Route
					exact
					path="/forgot-password"
					element={
						<>
							<NavBar />
							<UserForgetPass />
						</>
					}
				/>

				<Route
					exact
					path="/about"
					element={
						<>
							<NavBar />
							<AboutUs />
						</>
					}
				/>

				<Route
					path="*"
					element={
						<center id="pageNotFound">
							<h1>Sorry, this page isn&apos;t available.</h1>
							<h2>Error: 404</h2>
							<a href="/login"> Go to Login Page</a>
						</center>
					}
				/>
			</Switch>
		</Suspense>
	);
}

export default memo(Routes);
