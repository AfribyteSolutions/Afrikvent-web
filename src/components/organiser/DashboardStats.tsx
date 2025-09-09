// src/components/organiser/DashboardStats.tsx
import React from 'react';

interface OrganiserData {
  name: string;
  email: string;
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
}

interface DashboardStatsProps {
  organiser: OrganiserData;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ organiser }) => {
  const stats = [
    {
      name: 'Total Events',
      value: organiser.totalEvents,
      icon: '🎪',
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Active Events',
      value: organiser.activeEvents,
      icon: '🟢',
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Total Revenue',
      value: `₵${organiser.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: 'bg-yellow-500',
      change: '+23%',
      changeType: 'positive'
    },
    {
      name: 'Tickets Sold',
      value: organiser.totalTicketsSold.toLocaleString(),
      icon: '🎫',
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
              {stat.icon}
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${
              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {stat.change}
            </span>
            <span className="text-sm text-gray-500 ml-2">from last month</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;