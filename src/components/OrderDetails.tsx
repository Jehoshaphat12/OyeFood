import { useState } from 'react';
import type { Order } from '../types';
import { money, timeAgo } from '../lib/utils';
import { flow, useOrders } from '../hooks/useOrder';

export const Pay = ({ p }: { p: Order['payment'] }) => (
  <span className={`payment-badge ${p === 'MoMo' ? 'paid' : 'cash'}`}>
    {p === 'MoMo' ? '💳 Paid via MoMo' : '💵 Cash on delivery'}
  </span>
);

export default function OrderDetails({ order, onClose }: { order: Order; onClose(): void }) {
  const { advance, reject } = useOrders(); 
  const a = flow[order.status];
  
  // State to track which item is expanded. Only one open at a time.
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'New': return 'status-new';
      case 'Preparing': return 'status-preparing';
      case 'Ready': return 'status-ready';
      case 'Dispatched': return 'status-dispatched';
      case 'Delivered': return 'status-delivered';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="header-info">
            <h2>Order #{order.id.slice(-6).toUpperCase()}</h2>
            <p>{timeAgo(order.createdAt)}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`status-badge ${getStatusClass(order.status)}`}>
              {order.status}
            </span>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body">
          
          {/* Customer Card */}
          <div className="customer-card">
            <div className="avatar">{order.customer.charAt(0).toUpperCase()}</div>
            <div className="customer-info">
              <h4>{order.customer}</h4>
              <p>{order.phone} • {order.address}</p>
            </div>
            {order.phone && (
              <a href={`tel:${order.phone.replace(/\s/g, '')}`} className="call-btn">
                📞 Call
              </a>
            )}
          </div>

          {/* Items List (Accordion) */}
          <div className="section-title">Items to Prepare</div>
          <div className="items-list">
            {order.items.map((item, index) => {
              const isExpanded = expandedItem === index;
              
              // Calculate base total for this item line
              const baseTotal = item.price * item.qty;
              
              return (
                <div 
                  key={index} 
                  className={`item-card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleExpand(index)}
                >
                  <div className="item-summary">
                    {/* Fallback image if none exists in the item data */}
                    <img 
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80" 
                      alt={item.name} 
                      className="item-image" 
                    />
                    <div className="item-content">
                      <div className="item-name">
                        {item.qty}x {item.name}
                        <span className="expand-icon" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.3s' }}>
                          ▼
                        </span>
                      </div>
                      {item.addons && item.addons.length > 0 && (
                        <div className="item-addons-preview">
                          + {item.addons.map(a => a.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="item-price">{money(item.totalPrice)}</div>
                  </div>

                  {/* Expanded Breakdown */}
                  <div className="item-breakdown">
                    <div className="breakdown-divider"></div>
                    
                    <div className="breakdown-row">
                      <span>{item.qty}x Base {item.name}</span>
                      <span>{money(baseTotal)}</span>
                    </div>
                    
                    {item.addons?.map((addon, aIdx) => (
                      <div key={aIdx} className="breakdown-row addon-row">
                        <span>{item.qty}x {addon.name} (Custom)</span>
                        <span>{money(addon.price * item.qty)}</span>
                      </div>
                    ))}

                    <div className="breakdown-row total-row">
                      <span>Item Total</span>
                      <span>{money(item.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Special Instructions */}
          {order.note && (
            <div className="note-box">
              <span>📝</span>
              <p><strong>Special Instructions:</strong> {order.note}</p>
            </div>
          )}

          {/* Totals */}
          <div className="totals-section">
            <div className="total-row">
              <span>Subtotal</span>
              <span>{money(order.items.reduce((sum, item) => sum + item.totalPrice, 0))}</span>
            </div>
            <div className="total-row">
              <span>Delivery Fee</span>
              <span>{money(order.deliveryFee)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
            <div className="payment-method">
              <Pay p={order.payment} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          {a ? (
            <>
              {order.status === 'New' && (
                <button 
                  className="btn btn-ghost btn-danger" 
                  onClick={() => { reject(order); onClose(); }}
                >
                  Reject
                </button>
              )}
              <button 
                className={`btn ${a.next === 'Delivered' ? 'btn-success' : 'btn-primary'}`} 
                style={{ flex: 2 }}
                onClick={() => { advance(order); onClose(); }}
              >
                {a.label}
              </button>
            </>
          ) : (
            <div className="completed-badge">
              {order.status === 'Cancelled' ? '❌ Order Cancelled' : '✓ Delivered Successfully'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}