import { Link } from 'react-router-dom';
import './Reservation.css';

export function Reservation() {
  return (
    <div className="reservation-page">
      <div className="container">
        <div className="reservation-header">
          <Link to="/" className="back-link">← Back to Home</Link>
          <h1>Reserve Your Table</h1>
          <p>Complete your reservation details below</p>
        </div>
        
        <div className="reservation-form-container">
          <form className="reservation-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" required />
              </div>
              <div className="form-group">
                <label>Time</label>
                <select required>
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
                <label>Guests</label>
                <select required>
                  <option value="">Number of guests</option>
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
              <label>Special Requests</label>
              <textarea placeholder="Dietary restrictions, special occasions, etc."></textarea>
            </div>
            
            <button type="submit" className="submit-btn">Complete Reservation</button>
          </form>
        </div>
      </div>
    </div>
  );
}
