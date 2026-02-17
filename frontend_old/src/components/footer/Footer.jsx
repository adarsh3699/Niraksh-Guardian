import { memo } from "react";
import { NavLink } from "react-router-dom";
import "./footer.css";
import brandLogo from "../../assets/brandLogo1.png";

function Footer() {
	return (
		<footer className="footer">
			<div className="footer-container">
				<div className="footer-main">
					<div className="footer-column footer-brand-column">
						<NavLink to="/" className="brand">
							<img src={brandLogo} alt="Niraksh Guardian Logo" className="brand-logo" />
							<span className="brand-name">Niraksh Guardian</span>
						</NavLink>
						<p className="tagline">
							Connecting patients with the right healthcare specialists using AI-powered symptom analysis
							for more accurate medical guidance.
						</p>
						<div className="social-links">
							<a
								href="https://instagram.com/_adarsh.s"
								className="social-link"
								aria-label="Follow us on Instagram"
								target="_blank"
								rel="noopener noreferrer"
							>
								<svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
								</svg>
							</a>
							<a
								href="https://github.com/adarsh3699"
								className="social-link"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Check out our GitHub"
							>
								<svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
							</a>
							<a
								href="https://linkedin.com/in/adarsh3699"
								className="social-link"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Connect with us on LinkedIn"
							>
								<svg className="social-icon" viewBox="0 0 24 24" fill="currentColor">
									<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
								</svg>
							</a>
						</div>
					</div>

					<div className="footer-column footer-links">
						<h3 className="footer-heading">Quick Links</h3>
						<ul className="footer-nav">
							<li>
								<NavLink to="/">Home</NavLink>
							</li>
							<li>
								<NavLink to="/doctor_suggest">Find Doctor</NavLink>
							</li>
							<li>
								<NavLink to="/services">Services</NavLink>
							</li>
							<li>
								<NavLink to="/about">About Us</NavLink>
							</li>
						</ul>
					</div>

					<div className="footer-column footer-services">
						<h3 className="footer-heading">Our Services</h3>
						<ul className="footer-nav">
							<li>
								<NavLink to="/doctor_suggest">Symptom Analysis</NavLink>
							</li>
							<li>
								<NavLink to="/medicine_search">Medicine Information</NavLink>
							</li>
							<li>
								<NavLink to="/health-assistant">Health Assistant</NavLink>
							</li>
							<li>
								<NavLink to="/prescription">Prescription Analysis</NavLink>
							</li>
						</ul>
					</div>

					<div className="footer-column footer-contact">
						<h3 className="footer-heading">Contact Us</h3>
						<div className="contact-info">
							<a href="tel:+919470756460" className="contact-item phone-link">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
								</svg>
								<span>(+91) 9470 7564 60</span>
							</a>
							<a href="mailto:adarsh3699@gmail.com" className="contact-item email-link">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
									<polyline points="22,6 12,13 2,6" />
								</svg>
								<span>adarsh3699@gmail.com</span>
							</a>
							<div className="contact-item location">
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
								<span>Jalandhar, Punjab, India</span>
							</div>
						</div>
					</div>
				</div>

				<div className="footer-bottom">
					<p className="copyright">© {new Date().getFullYear()} Niraksh Guardian. All rights reserved.</p>
					<div className="footer-bottom-links">
						<NavLink to="/privacy-policy">Privacy Policy</NavLink>
						<NavLink to="/terms">Terms of Service</NavLink>
					</div>
				</div>
			</div>
		</footer>
	);
}

export default memo(Footer);
