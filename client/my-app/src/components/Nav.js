import "./Nav.css";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../StoreContext";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import menu from "../icons/menu.png";
import logo from "../icons/logo.png";
import 'react-toastify/dist/ReactToastify.css';
import '../style.css';

const Nav = ({ setshowLogin }) => {
  const { token, setToken, setUser, user } = useContext(StoreContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const logOut = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser("");
    navigate("/");
    toast.success("Logged out successfully", { autoClose: 1500 });
    setMenuOpen(false);
  };

  const scrollToFooter = () => {
    const footerElement = document.getElementById("footer");
    if (footerElement) {
      footerElement.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <div className="navbox">
      <img
        src={logo}
        alt="logo icon"
        className="logo-icon"
        onClick={() => {
          setMenuOpen(false);
          navigate("/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        style={{ cursor: "pointer" }}
      />

      <div className="centernav">
        <button
          onClick={() => {
            setMenuOpen(false);
            navigate("/");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Home
        </button>
        <button onClick={scrollToFooter}>Contact</button>
        <button
          onClick={() => {
            setMenuOpen(false);
            navigate("/about");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          About Us
        </button>
      </div>

      <div className="reviewloginbox">
        <Link to="/post-review" onClick={() => setMenuOpen(false)}>
          <button>Post Review</button>
        </Link>

        {!token ? (
          <button onClick={() => setshowLogin(true)}>Signup</button>
        ) : (
          <div className="userbox">
            <div className="user-greeting" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
              <span className="arrow">&#9662;</span>
            </div>

            {/* Desktop dropdown: only Logout & My Reviews */}
            <div className={`user-dropdown ${menuOpen ? "open" : ""}`}>
              <Link to="/my-reviews">My Reviews</Link>
              <button id="outbtn" onClick={logOut}>Logout</button>
            </div>
          </div>
        )}
      </div>

      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        <img src={menu} alt="menu icon" className="menu-icon" />
      </div>

      {/* Mobile dropdown: all nav links */}
      {menuOpen && (
        <div className="mobile-menu">
          {token && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px 10px', borderBottom: '1px solid rgba(255, 213, 0, 0.15)', marginBottom: '4px' }}>
              <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
              <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif' }}>{user.name}</span>
            </div>
          )}
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <button onClick={scrollToFooter} style={{textAlign:'left'}}>Contact</button>
          <button
            style={{textAlign:'left'}}
            onClick={() => {
              setMenuOpen(false);
              navigate("/about");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            About Us
          </button>
          <Link to="/post-review" onClick={() => setMenuOpen(false)}>Post Review</Link>

          {token ? (
            <>
              <Link to="/my-reviews" onClick={() => setMenuOpen(false)}>My Reviews</Link>
              <button id="outbtn" onClick={logOut}>Logout</button>
            </>
          ) : (
            <button
              id="signbtn"
              onClick={() => {
                setshowLogin(true);
                setMenuOpen(false);
              }}
            >
              Signup
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Nav;