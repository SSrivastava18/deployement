import { useEffect, useState, useContext, useCallback } from "react";
import Reviewcard from "./Reviewcard";
import "./Search.css";
import { StoreContext } from "../StoreContext";
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

    // ✅ FIX: wrapped in useCallback
    const fetchAllReviews = useCallback(async () => {
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
    }, [apiUrl]);

    // ✅ FIX: dependency added
    useEffect(() => {
        fetchAllReviews();
    }, [fetchAllReviews]);

    const fetchFilteredReviews = useCallback(async (query) => {
        if (!query.trim()) {
            fetchAllReviews();
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setIsSearching(true);
            setCurrentPage(1);

            const res = await fetch(
                `${apiUrl}/review/search?query=${encodeURIComponent(query)}`
            );
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
    }, [apiUrl, fetchAllReviews]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            fetchFilteredReviews(searchTerm);
        }
    };

    const handleSearchClick = () => {
        fetchFilteredReviews(searchTerm);
    };

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
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const renderPageNumbers = () => {
        const pageNumbers = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(
                <li key={i} className={`page-item ${currentPage === i ? "active" : ""}`}>
                    <button onClick={() => paginate(i)} className="page-link">
                        {i}
                    </button>
                </li>
            );
        }
        return pageNumbers;
    };

    return (
        <div className="search-wrapper">

            {/* Background effects */}
            <div className="bg-orbs">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
                <div className="orb orb-4"></div>
            </div>

            <div className="stars-layer">
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
                <div className="shooting-star"></div>
            </div>

            {/* Hero */}
            <div className="hero-section">
                <span className="hero-eyebrow">Trusted PG & Hostel Reviews</span>
                <h1 className="hero-title">
                    Find the Perfect Stay<br />
                    <span className="highlight">for Yourself</span>
                </h1>
                <p className="hero-subtitle">
                    Discover and share stories of PGs, hostels, and flats
                </p>
            </div>

            {/* Search */}
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

            {/* States */}
            {loading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && reviews.length === 0 && !error && (
                <p>No reviews found.</p>
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
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                className="page-link"
                                disabled={currentPage === 1}
                            >
                                ← Prev
                            </button>
                        </li>

                        {renderPageNumbers()}

                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                className="page-link"
                                disabled={currentPage === totalPages}
                            >
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
