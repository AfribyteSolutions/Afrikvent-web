// src/components/organiser/AnalyticsOverview.tsx
import React from 'react';

interface AnalyticsOverviewProps {
  detailed?: boolean;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ detailed = false }) => {
  // Mock analytics data - replace with actual API calls
  const analyticsData = {
    totalRevenue: 45600,
    totalTicketsSold: 1234,
    totalEvents: 12,
    averageTicketPrice: 37,
    conversionRate: 3.2,
    topSellingEvents: [
      { name: 'Music Festival Summer', sales: 800, revenue: 40000 },
      { name: 'Tech Conference 2024', sales: 150, revenue: 15000 },
      { name: 'Business Workshop', sales: 75, revenue: 3750 },
    ],
    salesByMonth: [
      { month: 'Jan', sales: 120, revenue: 6000 },
      { month: 'Feb', sales: 180, revenue: 9000 },
      { month: 'Mar', sales: 250, revenue: 12500 },
      { month: 'Apr', sales: 320, revenue: 16000 },
      { month: 'May', sales: 280, revenue: 14000 },
      { month: 'Jun', sales: 200, revenue: 10000 },
    ],
    eventCategories: [
      { category: 'Music', count: 4, percentage: 33 },
      { category: 'Business', count: 3, percentage: 25 },
      { category: 'Technology', count: 2, percentage: 17 },
      { category: 'Arts', count: 2, percentage: 17 },
      { category: 'Sports', count: 1, percentage: 8 },
    ],
    recentActivity: [
      { type: 'sale', event: 'Tech Conference 2024', amount: 100, time: '2 hours ago' },
      { type: 'sale', event: 'Music Festival Summer', amount: 50, time: '4 hours ago' },
      { type: 'refund', event: 'Business Workshop', amount: -40, time: '1 day ago' },
      { type: 'sale', event: 'Art Exhibition', amount: 25, time: '2 days ago' },
    ]
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'refund':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {detailed && (
        <>
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Over Time</h3>
            <div className="h-64">
              <div className="flex items-end justify-between h-full space-x-2">
                {analyticsData.salesByMonth.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t-sm"
                      style={{ 
                        height: `${(data.revenue / Math.max(...analyticsData.salesByMonth.map(d => d.revenue))) * 100}%`,
                        minHeight: '20px'
                      }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                    <span className="text-xs font-medium text-gray-700">₵{data.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Event Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Categories</h3>
            <div className="space-y-4">
              {analyticsData.eventCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12">{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Top Selling Events */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {detailed ? 'Top Selling Events' : 'Performance Overview'}
        </h3>
        
        {detailed ? (
          <div className="space-y-4">
            {analyticsData.topSellingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{event.name}</h4>
                  <p className="text-sm text-gray-600">{event.sales} tickets sold</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₵{event.revenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">₵{analyticsData.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{analyticsData.totalTicketsSold}</p>
              <p className="text-sm text-gray-600">Tickets Sold</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">₵{analyticsData.averageTicketPrice}</p>
              <p className="text-sm text-gray-600">Avg. Ticket Price</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{analyticsData.conversionRate}%</p>
              <p className="text-sm text-gray-600">Conversion Rate</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {analyticsData.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4">
              {getActivityIcon(activity.type)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.type === 'sale' ? 'New ticket sale' : 'Refund processed'}
                </p>
                <p className="text-sm text-gray-600">{activity.event}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  activity.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {activity.amount > 0 ? '+' : ''}₵{Math.abs(activity.amount)}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {detailed && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Export Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Sales Report
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics Report
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Attendee Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsOverview;