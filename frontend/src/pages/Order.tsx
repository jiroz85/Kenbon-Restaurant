import { Link } from 'react-router-dom';
import './Order.css';

export function Order() {
  return (
    <div className="order-page">
      <div className="container">
        <div className="order-header">
          <Link to="/" className="back-link">← Back to Home</Link>
          <h1>Order Online</h1>
          <p>Enjoy Kenbon Restaurant's signature dishes at home</p>
        </div>
        
        <div className="order-content">
          <div className="order-options">
            <div className="option-card">
              <h3>Delivery</h3>
              <p>Get your food delivered to your doorstep</p>
              <ul>
                <li>Free delivery on orders over $50</li>
                <li>30-45 minute delivery time</li>
                <li>Track your order in real-time</li>
              </ul>
              <button className="option-btn">Order Delivery</button>
            </div>
            
            <div className="option-card">
              <h3>Pickup</h3>
              <p>Ready for pickup when you arrive</p>
              <ul>
                <li>15% discount on pickup orders</li>
                <li>Ready in 20-30 minutes</li>
                <li>Curbside pickup available</li>
              </ul>
              <button className="option-btn">Order Pickup</button>
            </div>
          </div>
          
          <div className="menu-preview">
            <h2>Popular Items</h2>
            <div className="menu-items">
              <div className="menu-item">
                <div className="item-info">
                  <h4>Wagyu Beef Tenderloin</h4>
                  <p>28-day aged with truffle mashed potatoes</p>
                </div>
                <div className="item-price">$125</div>
              </div>
              <div className="menu-item">
                <div className="item-info">
                  <h4>Lobster Thermidor</h4>
                  <p>Fresh Maine lobster with cognac cream</p>
                </div>
                <div className="item-price">$68</div>
              </div>
              <div className="menu-item">
                <div className="item-info">
                  <h4>Truffle Risotto</h4>
                  <p>Arborio rice with black truffle</p>
                </div>
                <div className="item-price">$48</div>
              </div>
            </div>
            
            <div className="view-full-menu">
              <Link to="/#menu">View Full Menu</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
