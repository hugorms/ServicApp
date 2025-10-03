import React from 'react';
import { Home, Search, Calendar, FileText, MessageCircle, User } from 'lucide-react';

const iconMap = {
  Home,
  Search,
  Calendar,
  FileText,
  MessageCircle,
  User
};

const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  
  return (
    <div className="h-full flex items-center px-4 relative">
      {/* Borde superior con curva */}
      <div 
        className="absolute top-0 left-0 right-0 h-0 border-t-2 border-yellow-300 transition-all duration-500"
        style={{
          clipPath: activeIndex !== -1 
            ? `polygon(
                0% 0%, 
                ${(activeIndex / tabs.length) * 100 + (100 / tabs.length / 2) - 15}% 0%, 
                ${(activeIndex / tabs.length) * 100 + (100 / tabs.length / 2) - 12}% 12px, 
                ${(activeIndex / tabs.length) * 100 + (100 / tabs.length / 2) - 8}% 20px, 
                ${(activeIndex / tabs.length) * 100 + (100 / tabs.length / 2) - 4}% 26px, 
                ${(activeIndex / tabs.length) * 100 + (100 / tabs.length / 2)}% 30px, 
                ${(activeIndex / tabs.length) * 100 + (100 / tabs.length / 2) + 4}% 26px, 
                ${(activeIndex / tabs.length) * 100 + (100 / tabs.length / 2) + 8}% 20px, 
                ${(activeIndex / tabs.length) * 100 + (100 / tabs.length / 2) + 12}% 12px, 
                ${(activeIndex / tabs.length) * 100 + (100 / tabs.length / 2) + 15}% 0%, 
                100% 0%
              )`
            : 'polygon(0% 0%, 100% 0%)'
        }}
      />

      <div className="flex justify-around items-center w-full">
        {tabs.map((tab) => {
          const Icon = iconMap[tab.icon];
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg min-w-0 flex-1 transition-all duration-300 ${
                isActive
                  ? 'text-slate-800 transform -translate-y-4'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {/* Icono con elevación cuando está activo */}
              <div className={`p-2 rounded-full transition-all duration-300 mb-1 ${
                isActive 
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-slate-800 scale-110' 
                  : 'bg-transparent'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <span className="text-xs font-medium truncate w-full text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;