import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./LandingPage.css";

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [specialIndex, setSpecialIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("starters");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather] = useState<"sunny" | "rainy" | "cloudy" | "cold">("sunny");
  const [typedText, setTypedText] = useState("");
  const [reservationForm, setReservationForm] = useState({
    date: "",
    time: "",
    guests: "2",
    requests: "",
  });

  // Generate particles once on mount to avoid Math.random in render
  const [particles] = useState(() =>
    [...Array(20)].map(() => ({
      left: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 15 + Math.random() * 10,
    })),
  );

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterToast, setNewsletterToast] = useState<string | null>(null);

  useEffect(() => {
    // Load premium fonts once per app session
    const id = "kenbon-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    // Typewriter effect for "Kenbon Restaurant" - types completely, waits 5 seconds, then restarts
    const fullText = "welcome to Kenbon Restaurant";
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        // Reset and start over after 1 second
        setTimeout(() => {
          currentIndex = 0;
          setTypedText("");
        }, 1000);
      }
    }, 200); // Typing speed

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    // Support hash links like "/#menu" from other pages
    const hash = location.hash?.replace("#", "");
    if (!hash) return;
    const target = document.getElementById(hash);
    if (!target) return;
    // allow layout to paint first
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [location.hash]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpecialIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update time every minute for dynamic content
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timeInterval);
  }, []);

  // Get dynamic recommendation based on time and weather
  const getDynamicRecommendation = () => {
    const hour = currentTime.getHours();
    const weatherRecommendations = {
      sunny:
        weather === "sunny"
          ? "Perfect weather for our outdoor terrace and fresh salads"
          : "",
      rainy:
        weather === "rainy"
          ? "Cozy indoor dining with our hearty comfort dishes"
          : "",
      cloudy:
        weather === "cloudy"
          ? "Ideal for our warming soups and artisanal breads"
          : "",
      cold:
        weather === "cold"
          ? "Warm up with our signature hot dishes and mulled wine"
          : "",
    };

    const timeRecommendations = {
      morning:
        hour < 12
          ? "Start your day with our artisanal breakfast selection"
          : "",
      lunch:
        hour < 15 ? "Perfect time for our lunch specials and light bites" : "",
      afternoon: hour < 18 ? "Pre-dinner cocktails and appetizers await" : "",
      evening:
        hour >= 18
          ? "Evening dining at its finest - reservations recommended"
          : "",
    };

    const weatherRec =
      Object.values(weatherRecommendations).find(Boolean) || "";
    const timeRec = Object.values(timeRecommendations).find(Boolean) || "";

    return weatherRec && timeRec
      ? `${weatherRec}. ${timeRec}`
      : timeRec || weatherRec;
  };

  // Handle reservation form submission
  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to reservation page with pre-filled data
    const qs = new URLSearchParams({
      date: reservationForm.date,
      time: reservationForm.time,
      guests: reservationForm.guests,
      requests: reservationForm.requests,
    });
    navigate(`/reservation?${qs.toString()}`);
  };

  const scrollToId = (targetId: string) => {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSmoothScroll = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    scrollToId(targetId);
  };

  // Handle newsletter signup
  const handleNewsletterSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterToast("Thank you for subscribing to Kenbon Restaurant!");
    setNewsletterEmail("");
  };

  useEffect(() => {
    if (!newsletterToast) return;
    const t = setTimeout(() => setNewsletterToast(null), 3000);
    return () => clearTimeout(t);
  }, [newsletterToast]);

  // Scroll-triggered animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 },
    );

    // Observe all sections
    const sections = document.querySelectorAll("section");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Add countdown timer logic
  const [timeRemaining, setTimeRemaining] = useState({ hours: 2, minutes: 34 });

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        const totalMinutes = prev.hours * 60 + prev.minutes - 1;
        if (totalMinutes <= 0) return { hours: 0, minutes: 0 };
        return {
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60,
        };
      });
    }, 60000); // Update every minute

    return () => clearInterval(countdownInterval);
  }, []);

  const signatureDishes = [
    {
      name: "Seared Scallops",
      description: "Pan-seared with cauliflower purée and crispy pancetta",
      price: "$42",
      badge: "Chef's Special",
      chefNotes: "Sourced from sustainable Atlantic fisheries",
      pairing: "Champagne or dry white wine",
    },
    {
      name: "Wagyu Beef Tenderloin",
      description:
        "28-day aged with truffle mashed potatoes and red wine reduction",
      price: "$125",
      badge: "Guest Favorite",
      chefNotes: "Premium A5 grade Japanese Wagyu",
      pairing: "Full-bodied red Bordeaux",
    },
    {
      name: "Lobster Thermidor",
      description: "Fresh Maine lobster with cognac cream and gruyère",
      price: "$68",
      badge: "Seasonal Selection",
      chefNotes: "Live lobsters prepared daily",
      pairing: "Chardonnay or Champagne",
    },
    {
      name: "Duck Confit",
      description: "Traditional French preparation with cherry gastrique",
      price: "$54",
      badge: "Classic",
      chefNotes: "48-hour preparation process",
      pairing: "Pinot Noir",
    },
    {
      name: "Truffle Risotto",
      description: "Arborio rice with black truffle and aged parmesan",
      price: "$48",
      badge: "Vegetarian",
      chefNotes: "Fresh truffles flown in weekly",
      pairing: "White Burgundy",
    },
    {
      name: "Chocolate Soufflé",
      description: "Dark chocolate with vanilla bean ice cream",
      price: "$28",
      badge: "Must Try",
      chefNotes: "Prepared to order, 20 min wait",
      pairing: "Port wine or espresso",
    },
  ];

  const dailySpecials = [
    {
      name: "Chef's Tasting Menu",
      description: "7-course journey through seasonal ingredients",
      price: "$185",
      story: "Inspired by today's morning market visit",
      availability: "Only 8 servings left",
    },
    {
      name: "Seafood Tower",
      description: "Oysters, shrimp, crab, lobster with champagne mignonette",
      price: "$125",
      story: "Fresh catch from our local fisherman",
      availability: "Available today only",
    },
    {
      name: "Wine Pairing Dinner",
      description: "5 courses with sommelier-selected wines",
      price: "$225",
      story: "Featured vintner: Château Margaux 2018",
      availability: "6 seats remaining",
    },
  ];

  const menuCategories = {
    starters: [
      {
        name: "Oysters Rockefeller",
        price: "$24",
        description: "Six fresh oysters with spinach and hollandaise",
        spiceLevel: "mild",
        prepTime: "15 min",
      },
      {
        name: "Foie Gras Torchon",
        price: "$38",
        description: "With brioche and fig compote",
        spiceLevel: "mild",
        prepTime: "20 min",
      },
      {
        name: "Burrata Caprese",
        price: "$22",
        description: "Heirloom tomatoes and basil oil",
        spiceLevel: "mild",
        prepTime: "10 min",
      },
    ],
    mains: [
      {
        name: "Grilled Salmon",
        price: "$46",
        description: "With lemon butter sauce and asparagus",
        spiceLevel: "mild",
        prepTime: "25 min",
      },
      {
        name: "Ribeye Steak",
        price: "$89",
        description: "With bone marrow butter and fries",
        spiceLevel: "medium",
        prepTime: "30 min",
      },
      {
        name: "Vegetarian Wellington",
        price: "$42",
        description: "Mushrooms and spinach in puff pastry",
        spiceLevel: "mild",
        prepTime: "35 min",
      },
    ],
    desserts: [
      {
        name: "Crème Brûlée",
        price: "$18",
        description: "Classic vanilla with caramelized sugar",
        spiceLevel: "mild",
        prepTime: "5 min",
      },
      {
        name: "Tiramisu",
        price: "$20",
        description: "Espresso-soaked ladyfingers and mascarpone",
        spiceLevel: "mild",
        prepTime: "5 min",
      },
      {
        name: "Fruit Tart",
        price: "$16",
        description: "Seasonal fruits with pastry cream",
        spiceLevel: "mild",
        prepTime: "5 min",
      },
    ],
    beverages: [
      {
        name: "House Wine",
        price: "$12/glass",
        description: "Red or white selection",
        spiceLevel: "mild",
        prepTime: "2 min",
      },
      {
        name: "Craft Cocktails",
        price: "$18",
        description: "Mixologist's special creations",
        spiceLevel: "mild",
        prepTime: "8 min",
      },
      {
        name: "Artisan Coffee",
        price: "$8",
        description: "Single-origin espresso drinks",
        spiceLevel: "mild",
        prepTime: "5 min",
      },
    ],
  };

  const testimonials = [
    {
      text: "One of the most memorable dining experiences I've had.",
      rating: 5,
      author: "Sarah Mitchell",
      date: "Visited this week",
    },
    {
      text: "Exceptional cuisine and impeccable service.",
      rating: 5,
      author: "James Chen",
      date: "Visited last week",
    },
    {
      text: "Every dish tells a story. Absolutely extraordinary.",
      rating: 5,
      author: "Maria Rodriguez",
      date: "Visited this month",
    },
  ];

  const pressMentions = [
    {
      publication: "Michelin Guide",
      award: "Recommended Restaurant 2024",
      year: "2024",
    },
    {
      publication: "Wine Spectator",
      award: "Award of Excellence",
      year: "2023",
    },
    {
      publication: "Fine Dining Magazine",
      award: "Top 50 Restaurants",
      year: "2024",
    },
  ];

  const socialIndicators = useMemo(() => {
    const baseReserved = 24;
    const baseOrders = 18;
    const minutes = currentTime.getMinutes();
    const reserved = baseReserved + (minutes % 5);
    const orders = baseOrders + (minutes % 4);
    return { reserved, orders };
  }, [currentTime]);

  return (
    <div className="landing-page">
      {newsletterToast ? (
        <div className="newsletter-toast" role="status" aria-live="polite">
          {newsletterToast}
        </div>
      ) : null}

      {/* SECTION 1 - IMMERSIVE CINEMATIC HERO */}
      <section id="top" className="hero-section">
        <header className="hero-nav">
          <button
            type="button"
            className="hero-logo"
            onClick={() => scrollToId("top")}
          >
            Kenbon
          </button>
          <nav className="hero-nav-links" aria-label="Primary">
            <button
              type="button"
              className="hero-nav-link"
              onClick={(e) => handleSmoothScroll(e, "signature")}
            >
              Signature
            </button>
            <button
              type="button"
              className="hero-nav-link"
              onClick={(e) => handleSmoothScroll(e, "specials")}
            >
              Specials
            </button>
            <button
              type="button"
              className="hero-nav-link"
              onClick={(e) => handleSmoothScroll(e, "journey")}
            >
              Story
            </button>
            <button
              type="button"
              className="hero-nav-link"
              onClick={(e) => handleSmoothScroll(e, "menu")}
            >
              Menu
            </button>
            <button
              type="button"
              className="hero-nav-link"
              onClick={(e) => handleSmoothScroll(e, "contact")}
            >
              Visit Us
            </button>
          </nav>
          <div className="hero-nav-ctas">
            <Link
              to="/reservation"
              className="hero-nav-cta hero-nav-cta-primary"
            >
              Reserve
            </Link>
            <Link to="/login" className="hero-nav-cta hero-nav-cta-secondary">
              Order
            </Link>
          </div>
        </header>
        <div className="video-background">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            poster="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop&auto=format"
          >
            <source
              src="https://www.w3schools.com/html/mov_bbb.mp4"
              type="video/mp4"
            />
          </video>
          <div className="video-overlay" />
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">{typedText}</h1>
            <p className="hero-subtitle">
              Where culinary artistry meets unforgettable dining experiences
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/reservation" className="cta-primary">
              Reserve Your Table
            </Link>
            <Link to="/login" className="cta-secondary">
              Order Online
            </Link>
            <button className="cta-tertiary" onClick={() => scrollToId("menu")}>
              Discover Our Menu
            </button>
          </div>
          <div className="live-indicators">
            <div className="indicator">
              <span className="indicator-number">
                {socialIndicators.reserved}
              </span>
              <span className="indicator-text">tables reserved tonight</span>
            </div>
            <div className="indicator">
              <span className="indicator-number">
                {socialIndicators.orders}
              </span>
              <span className="indicator-text">orders in progress</span>
            </div>
          </div>
        </div>
        <div className="floating-particles">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${particle.left}%`,
                animationDelay: `${particle.animationDelay}s`,
                animationDuration: `${particle.animationDuration}s`,
              }}
            ></div>
          ))}
        </div>
      </section>

      {/* SECTION 2 - SIGNATURE COLLECTION */}
      <section id="signature" className="signature-section">
        <div className="container">
          <h2 className="section-title">Signature Collection</h2>
          <div className="signature-grid">
            {signatureDishes.map((dish, index) => (
              <div key={index} className="signature-card">
                <div className="dish-image">
                  <div
                    className={`image-placeholder signature-image-${index}`}
                  ></div>
                  {dish.badge && (
                    <span className="dish-badge">{dish.badge}</span>
                  )}
                </div>
                <div className="dish-info">
                  <h3 className="dish-name">{dish.name}</h3>
                  <p className="dish-description">{dish.description}</p>
                  <p className="dish-price">{dish.price}</p>
                  <div className="dish-details">
                    <p className="chef-notes">{dish.chefNotes}</p>
                    <p className="pairing">Pairing: {dish.pairing}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 - DYNAMIC SPECIALS THEATER */}
      <section id="specials" className="specials-section">
        <div className="container">
          <h2 className="section-title">Today's Specials</h2>
          <p className="dynamic-recommendation">{getDynamicRecommendation()}</p>
          <div className="specials-carousel">
            {dailySpecials.map((special, index) => (
              <div
                key={index}
                className={`special-slide ${index === specialIndex ? "active" : ""}`}
                style={{
                  transform: `translateX(${(index - specialIndex) * 100}%)`,
                }}
              >
                <div className="special-content">
                  <div className="special-image">
                    <div
                      className={`image-placeholder special-image-${index}`}
                    ></div>
                  </div>
                  <div className="special-info">
                    <span className="availability-badge">
                      {special.availability}
                    </span>
                    <div className="countdown-timer">
                      <span className="timer-label">Available for:</span>
                      <span className="timer-value">
                        {timeRemaining.hours}h {timeRemaining.minutes}m
                      </span>
                    </div>
                    <h3 className="special-name">{special.name}</h3>
                    <p className="special-description">{special.description}</p>
                    <p className="special-story">"{special.story}"</p>
                    <p className="special-price">{special.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="carousel-dots">
            {dailySpecials.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === specialIndex ? "active" : ""}`}
                onClick={() => setSpecialIndex(index)}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 - CULINARY JOURNEY */}
      <section id="journey" className="journey-section">
        <div className="container">
          <div className="journey-content">
            <div className="journey-text">
              <h2 className="section-title">Our Culinary Journey</h2>
              <p className="journey-description">
                At Kenbon Restaurant, we believe that exceptional dining is an
                art form. Our chef brings decades of international experience to
                create dishes that tell stories of tradition, innovation, and
                passion.
              </p>
              <p className="journey-description">
                We source the finest ingredients from local farms and
                sustainable fisheries, ensuring every plate reflects our
                commitment to quality and environmental stewardship.
              </p>
              <blockquote className="chef-quote">
                "Cooking is not just about ingredients, recipes, and cooking.
                It's about the memories we create and the moments we share
                around the table."
              </blockquote>
            </div>
            <div className="journey-visuals">
              <div className="visual-grid">
                <div className="visual-item">
                  <div className="image-placeholder kitchen"></div>
                </div>
                <div className="visual-item">
                  <div className="image-placeholder chef"></div>
                </div>
                <div className="visual-item">
                  <div className="image-placeholder dining"></div>
                </div>
                <div className="visual-item">
                  <div className="image-placeholder ingredients"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 - INTERACTIVE MENU EXPERIENCE */}
      <section id="menu" className="menu-section">
        <div className="container">
          <h2 className="section-title">Menu Preview</h2>
          <div className="menu-categories">
            {Object.keys(menuCategories).map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          <div className="menu-items">
            {menuCategories[
              selectedCategory as keyof typeof menuCategories
            ].map((item, index) => (
              <div key={index} className="menu-item">
                <div className="menu-item-image">
                  <div
                    className={`image-placeholder menu-image-${index}`}
                  ></div>
                </div>
                <div className="menu-item-info">
                  <h4 className="menu-item-name">{item.name}</h4>
                  {item.description && (
                    <p className="menu-item-description">{item.description}</p>
                  )}
                  <div className="menu-item-meta">
                    <span className={`spice-level spice-${item.spiceLevel}`}>
                      {item.spiceLevel === "mild"
                        ? "🌶️"
                        : item.spiceLevel === "medium"
                          ? "🌶️🌶️"
                          : "🌶️🌶️🌶️"}{" "}
                      {item.spiceLevel}
                    </span>
                    <span className="prep-time">⏱️ {item.prepTime}</span>
                  </div>
                  <p className="menu-item-price">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 - SOCIAL EVIDENCE GALLERY */}
      <section id="social" className="social-section">
        <div className="container">
          <h2 className="section-title">Guest Experiences</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">
                      ★
                    </span>
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <div className="avatar-placeholder"></div>
                  </div>
                  <div className="author-info">
                    <p className="author-name">{testimonial.author}</p>
                    <p className="author-date">{testimonial.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="social-photos">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="social-photo">
                <div className={`image-placeholder social-photo-${i}`}></div>
              </div>
            ))}
          </div>
          <div className="press-awards">
            <h3 className="press-title">Recognition & Awards</h3>
            <div className="awards-grid">
              {pressMentions.map((award, index) => (
                <div key={index} className="award-card">
                  <div className="award-logo">
                    <div className="logo-placeholder"></div>
                  </div>
                  <div className="award-info">
                    <h4 className="award-publication">{award.publication}</h4>
                    <p className="award-name">{award.award}</p>
                    <p className="award-year">{award.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 - ELEGANT RESERVATION SUITE */}
      <section id="reservations" className="reservation-section">
        <div className="container">
          <h2 className="section-title">Reserve Your Table</h2>
          <form className="reservation-form" onSubmit={handleReservationSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="res-date">Date</label>
                <input
                  id="res-date"
                  type="date"
                  value={reservationForm.date}
                  onChange={(e) =>
                    setReservationForm({
                      ...reservationForm,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="res-time">Time</label>
                <select
                  id="res-time"
                  value={reservationForm.time}
                  onChange={(e) =>
                    setReservationForm({
                      ...reservationForm,
                      time: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select time</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="18:30">6:30 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="19:30">7:30 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="20:30">8:30 PM</option>
                  <option value="21:00">9:00 PM</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="res-guests">Guests</label>
                <select
                  id="res-guests"
                  value={reservationForm.guests}
                  onChange={(e) =>
                    setReservationForm({
                      ...reservationForm,
                      guests: e.target.value,
                    })
                  }
                  required
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5 Guests</option>
                  <option value="6">6 Guests</option>
                  <option value="7+">7+ Guests</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="res-requests">Special Requests</label>
              <textarea
                id="res-requests"
                value={reservationForm.requests}
                onChange={(e) =>
                  setReservationForm({
                    ...reservationForm,
                    requests: e.target.value,
                  })
                }
                placeholder="Dietary restrictions, special occasions, etc."
              ></textarea>
            </div>
            <div className="premium-options" aria-label="Premium experiences">
              <div className="option-card">
                <h3>Chef's Table</h3>
                <p>
                  Exclusive kitchen-side dining experience with chef interaction
                </p>
                <span className="option-price">+$150</span>
              </div>
              <div className="option-card">
                <h3>Wine Pairing Experience</h3>
                <p>Sommelier-selected wine pairings for each course</p>
                <span className="option-price">+$85</span>
              </div>
            </div>
            <button type="submit" className="cta-primary reservation-cta">
              Complete Reservation
            </button>
            <p className="best-available">Best available tonight: 7:30 PM</p>
          </form>
        </div>
      </section>

      {/* SECTION 9 - LOCATION & CONCIERGE */}
      <section id="contact" className="location-section">
        <div className="container">
          <h2 className="section-title">Visit Us</h2>
          <div className="location-content">
            <div className="location-info">
              <div className="info-block">
                <h3>Address</h3>
                <p>
                  123 Gourmet Avenue
                  <br />
                  Culinary District, CD 12345
                </p>
              </div>
              <div className="info-block">
                <h3>Hours</h3>
                <p>
                  Tuesday - Thursday: 6:00 PM - 10:00 PM
                  <br />
                  Friday - Saturday: 6:00 PM - 11:00 PM
                  <br />
                  Sunday: 5:00 PM - 9:00 PM
                  <br />
                  Monday: Closed
                </p>
              </div>
              <div className="info-block">
                <h3>Contact</h3>
                <p>
                  Phone: (555) 123-4567
                  <br />
                  Email: reservations@kenbon.com
                </p>
              </div>
              <div className="info-block">
                <h3>Transportation & Parking</h3>
                <p>
                  Valet parking available
                  <br />
                  Street parking nearby
                  <br />
                  2 blocks from Central Station
                  <br />
                  Uber/Lyft drop-off zone
                </p>
              </div>
              <div className="quick-actions">
                <a href="tel:5551234567" className="action-btn">
                  Call Now
                </a>
                <a
                  href="https://maps.google.com/?q=123+Gourmet+Avenue+Culinary+District+CD+12345"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-btn"
                >
                  Get Directions
                </a>
                <a href="mailto:reservations@kenbon.com" className="action-btn">
                  Message Us
                </a>
              </div>
            </div>
            <div className="map-container">
              <div className="map-placeholder"></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 - PREMIUM FOOTER */}
      <footer className="premium-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Kenbon Restaurant</h3>
              <p>Crafting unforgettable dining experiences.</p>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Dining</h4>
                <a href="#menu" onClick={(e) => handleSmoothScroll(e, "menu")}>
                  Menu
                </a>
                <a
                  href="#reservations"
                  onClick={(e) => handleSmoothScroll(e, "reservations")}
                >
                  Reservations
                </a>
                <a
                  href="#journey"
                  onClick={(e) => handleSmoothScroll(e, "journey")}
                >
                  Private Dining
                </a>
                <a
                  href="#specials"
                  onClick={(e) => handleSmoothScroll(e, "specials")}
                >
                  Events
                </a>
              </div>
              <div className="link-group">
                <h4>Services</h4>
                <a href="#menu" onClick={(e) => handleSmoothScroll(e, "menu")}>
                  Gift Cards
                </a>
                <a
                  href="#kitchen-theater"
                  onClick={(e) => handleSmoothScroll(e, "kitchen-theater")}
                >
                  Catering
                </a>
                <a
                  href="#social"
                  onClick={(e) => handleSmoothScroll(e, "social")}
                >
                  Wine Club
                </a>
                <a
                  href="#contact"
                  onClick={(e) => handleSmoothScroll(e, "contact")}
                >
                  Contact
                </a>
              </div>
              <div className="link-group">
                <h4>Connect</h4>
                <a
                  href="#social"
                  onClick={(e) => handleSmoothScroll(e, "social")}
                >
                  Instagram
                </a>
                <a
                  href="#social"
                  onClick={(e) => handleSmoothScroll(e, "social")}
                >
                  Facebook
                </a>
                <a
                  href="#footer-newsletter"
                  onClick={(e) => handleSmoothScroll(e, "footer-newsletter")}
                >
                  Newsletter
                </a>
                <a
                  href="#social"
                  onClick={(e) => handleSmoothScroll(e, "social")}
                >
                  Press
                </a>
              </div>
            </div>
            <div className="footer-newsletter" id="footer-newsletter">
              <h4>Stay Updated</h4>
              <p>Receive news about special events and seasonal menus.</p>
              <div className="newsletter-form">
                <form onSubmit={handleNewsletterSignup}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                  />
                  <button type="submit">Subscribe</button>
                </form>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Kenbon Restaurant. All rights reserved.</p>
            <div className="social-icons">
              <a
                href="#social"
                onClick={(e) => handleSmoothScroll(e, "social")}
                className="social-icon"
              >
                IG
              </a>
              <a
                href="#social"
                onClick={(e) => handleSmoothScroll(e, "social")}
                className="social-icon"
              >
                FB
              </a>
              <a
                href="#social"
                onClick={(e) => handleSmoothScroll(e, "social")}
                className="social-icon"
              >
                TW
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
