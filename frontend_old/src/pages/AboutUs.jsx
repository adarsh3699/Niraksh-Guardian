import { useEffect } from "react";
import "../styles/aboutUs.css";
import aboutpic from "../assets/doctor-online-service-platform-healthcare-modern-medicine-treatment-analysis-diagnosis-emergency-call-isolated-vector-illustration_613284-1170-removebg-preview.png";
import Footer from "../components/footer/Footer";

// Team member images - you may need to import actual images
import teamMember1 from "../assets/userLogo.svg";

const AboutUs = () => {
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	return (
		<>
			<div id="aboutUsPage">
				<section className="hero-section">
					<div className="overlay"></div>
					<div className="hero-content">
						<h1>About Niraksh Guardian</h1>
						<p>Reimagining healthcare through AI and innovation</p>
					</div>
				</section>

				<section className="mission-vision-section">
					<div className="container">
						<div className="mission-box">
							<div className="icon-wrapper">
								<svg
									width="40"
									height="40"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
									<polyline points="22 4 12 14.01 9 11.01"></polyline>
								</svg>
							</div>
							<h2>Our Mission</h2>
							<p>
								To make healthcare more accessible by eliminating delays and ensuring timely care for
								every patient through innovative AI-driven solutions.
							</p>
						</div>

						<div className="vision-box">
							<div className="icon-wrapper">
								<svg
									width="40"
									height="40"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<circle cx="12" cy="12" r="10"></circle>
									<path d="M12 8v8m-4-4h8"></path>
								</svg>
							</div>
							<h2>Our Vision</h2>
							<p>
								To create a world where healthcare is efficient, accessible, and personalized,
								leveraging technology to connect patients with the right specialists at the right time.
							</p>
						</div>
					</div>
				</section>

				<section className="about-content-section">
					<div className="container">
						<div className="text-column">
							<h2>Who We Are</h2>
							<p>
								At Niraksh Guardian, we&apos;re dedicated to transforming healthcare through technology.
								Our AI-powered platform helps patients find the right medical specialists based on their
								symptoms, removing the guesswork from healthcare decisions.
							</p>
							<p>
								By utilizing AI-driven models, we predict the most suitable doctor specialties for your
								symptoms, minimizing the time spent searching for care. Our system provides transparent
								reasoning behind each recommendation, helping you make informed healthcare choices.
							</p>
							<p>
								For patients, our platform offers peace of mind and efficiency. For healthcare
								providers, we help optimize patient flow, ensuring people see the right specialists from
								the start.
							</p>

							<div className="stats-container">
								<div className="stat-item">
									<span className="stat-number">500+</span>
									<span className="stat-label">Doctor Specialists</span>
								</div>
								<div className="stat-item">
									<span className="stat-number">1000+</span>
									<span className="stat-label">Symptoms Analyzed</span>
								</div>
								<div className="stat-item">
									<span className="stat-number">24/7</span>
									<span className="stat-label">Support</span>
								</div>
							</div>
						</div>

						<div className="image-column">
							<img src={aboutpic} loading="lazy" alt="Healthcare Illustration" className="about-image" />
						</div>
					</div>
				</section>

				<section className="features-section">
					<div className="container">
						<h2 className="section-title">What Sets Us Apart</h2>

						<div className="features-grid">
							<div className="feature-card">
								<div className="feature-icon">
									<svg
										width="40"
										height="40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
									>
										<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
										<circle cx="12" cy="12" r="3"></circle>
									</svg>
								</div>
								<h3>AI-Powered Analysis</h3>
								<p>
									Our advanced algorithms analyze your symptoms to recommend the most appropriate
									medical specialists.
								</p>
							</div>

							<div className="feature-card">
								<div className="feature-icon">
									<svg
										width="40"
										height="40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
									>
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
										<circle cx="12" cy="12" r="3"></circle>
									</svg>
								</div>
								<h3>Transparent Recommendations</h3>
								<p>
									We provide clear explanations for why specific doctors are recommended for your
									symptoms.
								</p>
							</div>

							<div className="feature-card">
								<div className="feature-icon">
									<svg
										width="40"
										height="40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
									>
										<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
									</svg>
								</div>
								<h3>Patient-Centered Care</h3>
								<p>
									We prioritize your well-being by connecting you with specialists who can best
									address your needs.
								</p>
							</div>

							<div className="feature-card">
								<div className="feature-icon">
									<svg
										width="40"
										height="40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
									>
										<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
									</svg>
								</div>
								<h3>Continuous Learning</h3>
								<p>
									Our system constantly improves through ongoing data analysis and feedback
									incorporation.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section className="team-section">
					<div className="container">
						<h2 className="section-title">Meet Our Team</h2>
						<p className="section-subtitle">
							Passionate professionals dedicated to revolutionizing healthcare
						</p>

						<div className="team-grid">
							<div className="team-member">
								<img src={teamMember1} alt="Adarsh Suman" />
								<h3>Adarsh Suman</h3>
								<p className="role">Founder & CEO</p>
								<p className="bio">
									A visionary technologist with expertise in AI and healthcare solutions.
								</p>
								<div className="social-links">
									<a
										href="https://linkedin.com/in/adarsh3699"
										target="_blank"
										rel="noopener noreferrer"
									>
										<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
											<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
										</svg>
									</a>
									<a href="https://github.com/adarsh3699" target="_blank" rel="noopener noreferrer">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
											<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
										</svg>
									</a>
								</div>
							</div>

							{/* You can add more team members as needed */}
						</div>
					</div>
				</section>

				<section className="cta-section">
					<div className="container">
						<h2>Ready to Find the Right Doctor?</h2>
						<p>Use our AI-powered system to get matched with medical specialists based on your symptoms.</p>
						<a href="/doctor_suggest" className="cta-button">
							Try Symptom Analysis
						</a>
					</div>
				</section>
			</div>
			<Footer />
		</>
	);
};

export default AboutUs;
