import "./Footer.css";
import { FaLinkedin, FaTwitter, FaInstagram } from "react-icons/fa";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../StoreContext";

const Footer = () => {
    const { token } = useContext(StoreContext);
    const navigate = useNavigate();

    const handleFooterContactClick = () => {
        console.log("Contact clicked!");
        // You can open modal or scroll later
    };

    const handlePostReviewClick = () => {
        if (token) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            navigate("/post-review");
        } else {
            alert("Please login first to post a review.");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <footer id="footer" className="footer-container">
            <div className="footer-content">
                <div className="footer-brand">
                    <h1 className="footer-title">StayStory</h1>
                    <p className="footer-description">
                        Real hostel & PG reviews from actual students.
                    </p>

                    <div className="footer-social">
                        <a href="https://www.linkedin.com/in/stay-story-416730370/" target="_blank" rel="noopener noreferrer">
                            <FaLinkedin className="footer-icon" />
                        </a>
                        <a href="https://x.com/staystoryweb" target="_blank" rel="noopener noreferrer">
                            <FaTwitter className="footer-icon" />
                        </a>
                        <a href="https://www.instagram.com/stor_ystay" target="_blank" rel="noopener noreferrer">
                            <FaInstagram className="footer-icon" />
                        </a>
                    </div>
                </div>

                <div className="footer-links">
                    <h2 className="footer-heading">Explore</h2>

                    <a className="footer-link" href="/">Home</a>

                    {/* ✅ FIXED */}
                    <button className="footer-link" onClick={handlePostReviewClick}>
                        Add Review
                    </button>

                    <a className="footer-link" href="/about">About Us</a>

                    {/* ✅ FIXED */}
                    <button className="footer-link" onClick={handleFooterContactClick}>
                        Contact
                    </button>
                </div>

                <div className="footer-contact">
                    <h2 className="footer-heading">Get in Touch</h2>
                    <p className="footer-contact-item">staystoryweb@gmail.com</p>
                </div>
            </div>

            <div className="footer-divider"></div>

            <p className="footer-copyright">
                © {new Date().getFullYear()} StayStory
            </p>
        </footer>
    );
};

export default Footer;
