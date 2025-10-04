import React from "react";

// JSDoc Type Definition to prevent TS errors in a .js/.jsx file
/**
 * @typedef {object} Event
 * @property {string | number} id
 * @property {string} title
 * @property {string} location
 * @property {string} date
 * @property {string} price
 * @property {string} [description]
 * @property {string[]} [tags]
 * @property {number} ticketsSold - The number of tickets sold (REQUIRED for progress)
 * @property {number} totalTickets - The total number of tickets available (REQUIRED for progress)
 */

/**
 * @param {{ events: Event[], loading: boolean }} props
 * @returns {JSX.Element}
 */
const EventList = ({ events, loading }) => {
  if (loading) {
    return (
      <div className="events-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="event-card skeleton">
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-subtitle"></div>
              <div className="skeleton-text"></div>
              {/* Added skeleton progress bar placeholder */}
              <div className="skeleton-progress"></div>
            </div>
            <div className="skeleton-price"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="no-events">
        <div className="no-events-icon">
          <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="no-events-title">No events found</h3>
        <p className="no-events-text">Try adjusting your search or filters to find what you are looking for.</p>
      </div>
    );
  }

  return (
    <div className="events-list">
      {events.map((event, index) => {
        // Calculate progress percentage, defaulting to 0% if totalTickets is 0
        const progressPercent = event.totalTickets > 0
          ? (event.ticketsSold / event.totalTickets) * 100
          : 0;

        return (
          <div
            key={event.id}
            className="event-card"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="event-content">
              <div className="event-main">
                {/* Event Title */}
                <h3 className="event-title">{event.title}</h3>

                {/* Location & Date Row */}
                <div className="event-meta">
                  <div className="meta-item">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location}</span>
                  </div>

                  <div className="meta-item">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Event Description */}
                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}

                {/* Tags */}
                {event.tags && (
                  <div className="event-tags">
                    {event.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag">
                        {tag}
                      </span>
                    ))}
                    {event.tags.length > 3 && (
                      <span className="tag extra">
                        +{event.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                {/* ------------------------------------------- */}
                {/* NEW: Progress Bar (Ticket Sales) */}
                {/* ------------------------------------------- */}
                {event.totalTickets !== undefined && event.ticketsSold !== undefined && (
                  <div className="event-progress">
                    <div className="progress-text">
                      <span className="sold-count">{event.ticketsSold}</span> / {event.totalTickets} Tickets Sold
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill"
                        style={{
                          width: `${progressPercent}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                {/* ------------------------------------------- */}

              </div>

              {/* Price Badge */}
              <div className="event-price">
                <div className="price-amount">${event.price}</div>
                <div className="price-label">per ticket</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventList;