"use client";

import { useState, useEffect } from "react";
import { 
  BookPlus, 
  BookX, 
  BookUp, 
  BookCheck,
  ChevronDown,
  Library
} from "lucide-react";
import dayjs from "dayjs";

export default function LibraryDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifTab, setNotifTab] = useState("Todays");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/library/stats");
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate percentages for doughnut chart
  const report = stats?.reportStats || { total: 0, new: 0, issued: 0, lost: 0, available: 0 };
  const totalReport = report.new + report.issued + report.lost + (report.available || 1); // fallback to 1 to avoid NaN
  
  const pNew = totalReport ? Math.round((report.new / totalReport) * 100) : 0;
  const pIssued = totalReport ? Math.round((report.issued / totalReport) * 100) : 0;
  const pLost = totalReport ? Math.round((report.lost / totalReport) * 100) : 0;
  const pReturned = totalReport ? Math.round((report.available / totalReport) * 100) : 0; // Using available as 'returned/available'

  // CSS for doughnut chart
  const conicStyle = {
    background: `conic-gradient(
      #34d399 0% ${pNew}%, 
      #ef4444 ${pNew}% ${pNew + pLost}%, 
      #3b82f6 ${pNew + pLost}% ${pNew + pLost + pIssued}%, 
      #fcd34d ${pNew + pLost + pIssued}% 100%
    )`
  };

  // No mocked orders needed anymore

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans text-slate-800">
      
      {/* Topbar */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 mb-1">Dashboard</h1>
          <p className="text-xs text-slate-400 font-medium">Home / <span className="text-slate-500">Overview</span></p>
        </div>
        <button className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
          Today <ChevronDown size={16} className="text-slate-400" />
        </button>
      </div>

      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
        <KPICard 
          title="Total Books" 
          value={stats?.totalStock || 0} 
          icon={Library} 
          iconColor="text-violet-500" 
        />
        <KPICard 
          title="New Books Added" 
          value={stats?.newBooksCount || 0} 
          icon={BookPlus} 
          iconColor="text-indigo-400" 
        />
        <KPICard 
          title="Lost Books" 
          value={stats?.lostBooksCount || 0} 
          icon={BookX} 
          iconColor="text-rose-400" 
        />
        <KPICard 
          title="Borrowed Books" 
          value={stats?.borrowedBooksCount || 0} 
          icon={BookUp} 
          iconColor="text-blue-400" 
        />
        <KPICard 
          title="Available Books" 
          value={stats?.availableBooksCount || 0} 
          icon={BookCheck} 
          iconColor="text-indigo-500" 
        />
      </div>

      {/* 2. Middle Row: Notifications & Total Books Report */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 mb-6">
        
        {/* Notifications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-slate-800 mb-4">Notifications</h2>
          <div className="flex gap-6 border-b border-slate-100 mb-6">
            {['Todays', 'One Week', 'One Month'].map(tab => (
              <button 
                key={tab}
                onClick={() => setNotifTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  notifTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-6">
            {stats?.notifications?.length > 0 ? (
              stats.notifications.map((notif: any, i: number) => (
                <div key={i} className="flex justify-between items-start border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm text-slate-700 font-medium pr-4">{notif.text}</p>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{notif.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">No new notifications</div>
            )}
          </div>
        </div>

        {/* Total Books Report */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-slate-800">Total Books Report</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600">
              Weekly <ChevronDown size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center mb-8">
            <div>
              <p className="text-lg font-semibold text-slate-800">{pNew}%</p>
              <p className="text-[11px] text-slate-500 font-medium">New</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{pIssued}%</p>
              <p className="text-[11px] text-slate-500 font-medium">Issued</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{pLost}%</p>
              <p className="text-[11px] text-slate-500 font-medium">Lost</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{pReturned}%</p>
              <p className="text-[11px] text-slate-500 font-medium">Returned</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
            {/* Doughnut Chart */}
            <div className="relative w-36 h-36 rounded-full flex items-center justify-center" style={conicStyle}>
              <div className="absolute w-28 h-28 bg-white rounded-full flex items-center justify-center flex-col shadow-inner">
                <span className="text-[10px] text-slate-400 font-medium">Weekly Books</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="text-xs text-slate-500 font-medium">New books</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-xs text-slate-500 font-medium">Lost books</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-xs text-slate-500 font-medium">Issued books</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-300"></div>
                <span className="text-xs text-slate-500 font-medium">Returned books</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Activity & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        
        {/* Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-slate-800 mb-6">Activity</h2>
          <div className="space-y-6">
            {stats?.activityFeed?.length > 0 ? (
              stats.activityFeed.map((activity: any, i: number) => (
                <div key={activity._id} className="relative flex items-start justify-between">
                  <div className="flex gap-4 w-full">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 z-10 border-4 border-white shadow-sm">
                      {activity.student?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 pt-1 pb-4 border-b border-slate-50">
                      <p className="text-sm text-slate-600 font-medium mb-1">
                        {activity.student?.firstName} {activity.student?.lastName} borrowed '{activity.book?.title}'.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">✓ Read</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-400 text-sm z-10 relative bg-white w-fit mx-auto px-4">No recent activity</div>
            )}
          </div>
        </div>

        {/* Recent Books */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-slate-800 mb-6">Recently Added Books</h2>
          <div className="space-y-6">
            {stats?.recentBooks?.length > 0 ? (
              stats.recentBooks.map((book: any, i: number) => {
                const colors = ["bg-emerald-400", "bg-rose-500", "bg-indigo-500", "bg-amber-400"];
                const color = colors[i % colors.length];
                return (
                  <div key={book._id} className="flex gap-4">
                    <div className={`w-1 rounded-full ${color} shrink-0`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-indigo-500">{book.isbn || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400">{dayjs(book.createdAt).format('DD MMM')}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        Added new book <strong>'{book.title}'</strong> in {book.category}.
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-slate-400 text-sm">No recent books</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function KPICard({ title, value, icon: Icon, iconColor }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between group hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
        <p className="text-2xl font-bold text-indigo-600">
          {value}
        </p>
      </div>
      <div className={`p-2 rounded-lg border border-slate-100 shadow-sm ${iconColor}`}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
    </div>
  );
}
