import { useEffect, useState } from "react";
import Reviewcard from "./Reviewcard";
import "./Search.css";
import { StoreContext } from "../StoreContext";
import { useContext } from "react";
import 'react-toastify/dist/ReactToastify.css';

const Search = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const { apiUrl } = useContext(StoreContext);

    const [currentPage, setCurrentPage] = useState(1);
    const [reviewsPerPage] = useState(12);

    useEffect(() => {
        fetchAllReviews();
    }, []);

    const fetchAllReviews = async () => {
        try {
            setLoading(true);
            setError(null);
            setIsSearching(false);
            setCurrentPage(1);
            const res = await fetch(`${apiUrl}/review`);
            const data = await res.json();
            if (data.success) {
                setReviews(data.data);
            } else {
                setReviews([]);
                setError("Failed to load reviews.");
            }
        } catch (err) {
            setReviews([]);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredReviews = async (query) => {
        if (!query) return;
        try {
            setLoading(true);
            setError(null);
            setIsSearching(true);
            setCurrentPage(1);
            const res = await fetch(`${apiUrl}/review/search?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success) {
                setReviews(data.reviews);
            } else {
                setReviews([]);
                setError("No matching reviews found.");
            }
        } catch (err) {
            setReviews([]);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            fetchFilteredReviews(searchTerm.trim());
        }
    };

    const handleSearchClick = () => fetchFilteredReviews(searchTerm.trim());

    const handleClear = () => {
        setSearchTerm("");
        fetchAllReviews();
    };

    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPageNumbers = () => {
        const pageNumbers = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(
                <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
                    <button onClick={() => paginate(i)} className="page-link">{i}</button>
                </li>
            );
        }
        return pageNumbers;
    };

    return (
        <div className="search-wrapper">

            {/* Floating atmospheric orbs */}
            <div className="bg-orbs">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
                <div className="orb orb-4"></div>
            </div>

            {/* Starfield */}
            <div className="stars-layer">
                {/* Shooting stars */}
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>

                {/* Small white stars — scattered */}
                {[
                  [8,12,'t1',1],[15,45,'t2',1.5],[22,78,'t3',0.8],[31,23,'t1',1],[38,67,'t2',1.2],
                  [44,9,'t3',1],[52,55,'t1',0.9],[59,88,'t2',1.1],[67,34,'t3',1],[73,71,'t1',0.8],
                  [81,17,'t2',1.2],[88,62,'t3',1],[94,41,'t1',0.9],[6,83,'t2',1],[19,36,'t3',1.1],
                  [27,59,'t1',0.8],[35,14,'t2',1],[48,92,'t3',1.2],[56,27,'t1',1],[63,74,'t2',0.9],
                  [71,48,'t3',1],[79,6,'t1',0.8],[86,85,'t2',1.1],[3,51,'t3',1],[42,38,'t1',0.9],
                  [12,95,'t2',1],[25,2,'t3',1.2],[53,18,'t1',1],[76,90,'t2',0.8],[91,29,'t3',1],
                ].map(([top, left, cls, size], i) => (
                  <div key={i} className={`star-dot ${cls}`} style={{
                    top: `${top}%`, left: `${left}%`,
                    width: `${size}px`, height: `${size}px`,
                    animationDelay: `${(i * 0.37) % 4}s`
                  }} />
                ))}

                {/* Gold sparkle stars */}
                {[[10,30],[45,65],[70,15],[85,50],[20,80]].map(([top,left], i) => (
                  <div key={i} className="star-sparkle" style={{
                    top:`${top}%`, left:`${left}%`,
                    animationDelay:`${i * 0.8}s`
                  }} />
                ))}
            </div>

            {/* Hero section */}
            <div className="hero-section">
                <span className="hero-eyebrow">Trusted PG &amp; Hostel Reviews</span>
                <h1 className="hero-title">
                    Find the Perfect Stay<br />
                    <span className="highlight">for Yourself</span>
                </h1>
                <p className="hero-subtitle">
                    Discover and share stories of PGs, hostels, and flats from anywhere across the country
                </p>

                {/* Stats */}
                <div className="hero-stats">
                    <div className="hero-stat">
                        <div className="hero-stat-num">{reviews.length || "—"}</div>
                        <div className="hero-stat-label">Reviews</div>
                    </div>
                    <div className="hero-stat-divider"></div>
                    <div className="hero-stat">
                        <div className="hero-stat-num">100%</div>
                        <div className="hero-stat-label">Real Stories</div>
                    </div>
                    <div className="hero-stat-divider"></div>
                    <div className="hero-stat">
                        <div className="hero-stat-num">Free</div>
                        <div className="hero-stat-label">Always</div>
                    </div>
                </div>
            </div>

            {/* Search bar */}
            <div className="search-container">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        placeholder="Search by Name or Location"
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {searchTerm && (
                        <span className="clear-icon" onClick={handleClear}>×</span>
                    )}
                    <button
                        className="search-button"
                        onClick={handleSearchClick}
                        disabled={loading}
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Section label */}
            {!isSearching && !loading && reviews.length > 0 && (
                <p className="section-label">Latest Reviews</p>
            )}
            {isSearching && !loading && (
                <p className="section-label">Search Results · {reviews.length} found</p>
            )}

            {/* States */}
            {loading && (
                <div className="search-loading">
                    <div className="search-spinner"></div>
                    Loading reviews...
                </div>
            )}

            {error && !loading && (
                <p className="error-message">{error}</p>
            )}

            {!loading && reviews.length === 0 && !error && (
                <p className="no-results-message">No reviews to show yet.</p>
            )}

            {/* Cards */}
            <div className="review-cards-wrapper">
                {currentReviews.map((review) => (
                    <Reviewcard
                        key={review._id}
                        id={review._id}
                        placeName={review.name}
                        reviewerName={review.user?.name}
                        reviewerId={review.user?._id}
                        location={review.location}
                        reviewText={review.reviewText}
                        rating={review.rating}
                        images={Array.isArray(review.images) ? review.images : []}
                        facilities={review.facilities}
                        likes={review.likes}
                    />
                ))}
            </div>

            {/* Pagination */}
            {reviews.length > reviewsPerPage && (
                <nav className="pagination-container">
                    <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button onClick={() => paginate(currentPage - 1)} className="page-link" disabled={currentPage === 1}>
                                ← Prev
                            </button>
                        </li>
                        {renderPageNumbers()}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button onClick={() => paginate(currentPage + 1)} className="page-link" disabled={currentPage === totalPages}>
                                Next →
                            </button>
                        </li>
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default Search;