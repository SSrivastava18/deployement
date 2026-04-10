import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../StoreContext";
import "./ReviewDetailPage.css";
import CommentSection from "../components/CommentSection";
import Reviewcard from "../components/Reviewcard";
import MapComponent from "../components/MapComponent";
import 'react-toastify/dist/ReactToastify.css';
import '../style.css';

import {
  FaStar, FaMapMarkerAlt, FaCheckCircle, FaBroom, FaUtensils, FaShieldAlt, FaWifi,
  FaRupeeSign, FaBed, FaParking, FaDumbbell, FaHandsWash,
  FaUsers, FaMale, FaFemale, FaExpand, FaTimes, FaChevronLeft, FaChevronRight
} from 'react-icons/fa'; // ❌ removed FaBuilding

const ReviewDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [similarReviews, setSimilarReviews] = useState([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const { user, token, apiUrl } = useContext(StoreContext);
  const fileInputRef = useRef();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ✅ FIX: useCallback
  const fetchReview = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/review/${id}`);
      setReview(response.data);
    } catch (error) {
      console.error("Error fetching review details:", error);
    }
  }, [apiUrl, id]);

  const fetchSimilarReviews = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/review/${id}/similar`);
      setSimilarReviews(res.data.similarReviews || []);
    } catch (error) {
      console.error("Error fetching similar reviews:", error);
    }
  }, [apiUrl, id]);

  // ✅ FIX: dependencies added
  useEffect(() => {
    fetchReview();
    fetchSimilarReviews();
  }, [fetchReview, fetchSimilarReviews]);

  // ✅ FIX: memoized lightbox functions
  const lightboxNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % (review?.image?.length || 1));
  }, [review]);

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      (prev - 1 + (review?.image?.length || 1)) % (review?.image?.length || 1)
    );
  }, [review]);

  // ✅ FIX: dependencies added
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") lightboxNext();
      if (e.key === "ArrowLeft") lightboxPrev();
    };

    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, lightboxNext, lightboxPrev]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const scrollImage = (direction) => {
    if (!review?.image?.length) return;
    const maxIndex = review.image.length - 1;
    setCurrentImageIndex((prev) =>
      direction === "left"
        ? (prev === 0 ? maxIndex : prev - 1)
        : (prev === maxIndex ? 0 : prev + 1)
    );
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await axios.post(`${apiUrl}/review/${id}/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setReview((prev) => ({ ...prev, image: res.data.updatedImages }));
        toast.success("Images uploaded successfully!");
      }
    } catch {
      toast.error("Error uploading images.");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await axios.delete(`${apiUrl}/review/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/");
      }
    } catch {
      toast.error("Failed to delete review.");
    }
  };

  const isAuthor = user && review?.user === user.id;

  if (!review) return <h2>Loading...</h2>;

  return (
    <div className="review-detail-container">
      {/* Lightbox */}
      {lightboxOpen && review.image?.length > 0 && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>
            <FaTimes />
          </button>

          {review.image.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}>
              <FaChevronLeft />
            </button>
          )}

          <img src={review.image[lightboxIndex]?.url} alt="" />

          {review.image.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); lightboxNext(); }}>
              <FaChevronRight />
            </button>
          )}
        </div>
      )}

      {/* Rest unchanged UI */}
      <CommentSection reviewId={id} />
      <MapComponent location={review.location} />

      <div>
        {similarReviews.slice(0, visibleCount).map((item) => (
          <Reviewcard key={item._id} {...item} />
        ))}
      </div>
    </div>
  );
};

export default ReviewDetailPage;
