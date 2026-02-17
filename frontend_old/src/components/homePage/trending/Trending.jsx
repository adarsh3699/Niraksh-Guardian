import React, { useState, memo } from "react";
import "./trending.css";

import medicinesImg from "../../../assets/medicines.jpg";

function TrendingMedicines() {
	const [favorites, setFavorites] = useState(new Set());

	const medicines = [
		{
			id: 1,
			title: "Fast-acting pain relief",
			price: 8.99,
			image: medicinesImg,
			hasAddToCart: true,
		},
		{
			id: 2,
			title: "Heart health supplements",
			price: 8.99,
			image: medicinesImg,
		},
		{
			id: 3,
			title: "Mental health supplements",
			price: 8.99,
			image: medicinesImg,
		},
		{
			id: 4,
			title: "Find detailed info about Startin",
			subtitle: "Startin",
			image: medicinesImg,
		},
		{
			id: 5,
			title: "Find supplements for your Startin",
			subtitle: "Startin",
			image: medicinesImg,
		},
		{
			id: 6,
			title: "Find healthy treats for your Startin",
			subtitle: "Startin",
			image: medicinesImg,
		},
	];

	const toggleFavorite = (id) => {
		setFavorites((prev) => {
			const newFavorites = new Set(prev);
			if (newFavorites.has(id)) {
				newFavorites.delete(id);
			} else {
				newFavorites.add(id);
			}
			return newFavorites;
		});
	};

	return (
		<div className="trending-container">
			<div className="trending-header">
				<div className="trending-title">
					<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
					</svg>
					Trending medicines
				</div>
				<div className="nav-buttons">
					<button className="nav-button" aria-label="Previous">
						&lt;
					</button>
					<button className="nav-button" aria-label="Next">
						&gt;
					</button>
				</div>
			</div>

			<div className="medicines-grid">
				{medicines.map((medicine) => (
					<div key={medicine.id} className="medicine-card">
						<img src={medicine.image} alt={medicine.title} loading="lazy" className="medicine-image" />
						{medicine.hasAddToCart && <button className="add-to-cart">Add to cart</button>}
						<div className="medicine-content">
							<h3 className="medicine-title">{medicine.title}</h3>
							{medicine.price && (
								<div className="medicine-price">
									<span className="price-currency">$</span>
									{medicine.price.toFixed(2)}
								</div>
							)}
							{medicine.subtitle && <div className="medicine-subtitle">{medicine.subtitle}</div>}
						</div>
						<button
							className={`favorite-button ${favorites.has(medicine.id) ? "active" : ""}`}
							onClick={() => toggleFavorite(medicine.id)}
							aria-label={`${favorites.has(medicine.id) ? "Remove from" : "Add to"} favorites`}
						>
							<svg viewBox="0 0 24 24">
								<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
							</svg>
						</button>
					</div>
				))}
			</div>
		</div>
	);
}

export default memo(TrendingMedicines);
