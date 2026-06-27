import React from "react";
import { 
  GraduationCap, LogIn, LogOut, LayoutDashboard, Globe, Menu, X, 
  BookOpen, FileText, Sparkles, CheckCircle, Brain, Users, Calendar, Info 
} from "lucide-react";
import { User } from "../types";
import { TranslationKeys } from "../translations";
import { BoostUpLogo } from "./BoostUpLogo";

interface NavbarProps {
  user: User | null;
  t: TranslationKeys;
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
  onNavigate: (view: string) => void;
  activeView: string;
  onLogout: () => void;
  settingsName: string;
}

export default function Navbar({
  user,
  t,
  lang,
  setLang,
  onNavigate,
  activeView,
  onLogout,
  settingsName
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLinkClick = (view: string) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const navLinks = [
    { view: "home", label: lang === "ar" ? "الرئيسية" : "Home", icon: GraduationCap },
    { view: "courses", label: lang === "ar" ? "الكورسات" : "Courses", icon: BookOpen },
    { view: "verify_certificate", label: lang === "ar" ? "التحقق" : "Verification", icon: CheckCircle },
    { view: "trainers", label: lang === "ar" ? "المدربون" : "Trainers", icon: Users },
    { view: "articles", label: lang === "ar" ? "دروس تقوية" : "Tuition", icon: FileText },
    { view: "events", label: lang === "ar" ? "الفعاليات" : "Events", icon: Calendar },
    { view: "about", label: lang === "ar" ? "عن الأكاديمية" : "About Us", icon: Info },
  ];

  const logoComponent = (
    <div className="cursor-pointer" onClick={() => handleLinkClick("home")}>
      <BoostUpLogo variant="color" showText={true} />
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Desktop Navigation & Left Actions (using RTL visual order) */}
            {/* Action Buttons & Lang Toggle - Left on Desktop RTL */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Lang Toggle Button */}
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-[#086c7c] hover:bg-slate-50 rounded-full border border-slate-100 transition"
              >
                <Globe className="h-4 w-4" />
                <span>{lang === "ar" ? "English" : "العربية"}</span>
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLinkClick(user.role === "admin" ? "admin_panel" : "student_panel")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#002025] text-white hover:bg-[#003138] font-bold text-xs rounded-full transition shadow-md"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>{user.role === "admin" ? t.admin_panel : t.student_panel}</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-full transition"
                    title={t.logout}
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLinkClick("login")}
                    className="px-5 py-2 text-xs font-extrabold border border-[#0ca5b0] text-[#0ca5b0] hover:bg-[#0ca5b0]/5 rounded-full transition bg-white"
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => handleLinkClick("register")}
                    className="px-5 py-2 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-xs rounded-full transition shadow-md shadow-[#0ca5b0]/15"
                  >
                    {t.register}
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Central Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => {
                const isActive = activeView === link.view;
                return (
                  <button
                    key={link.view}
                    onClick={() => handleLinkClick(link.view)}
                    className={`px-3 py-2 rounded-full text-xs font-black transition-all duration-200 ${
                      isActive 
                        ? "bg-[#0ca5b0]/10 text-[#0ca5b0]" 
                        : "text-slate-600 hover:text-[#0ca5b0] hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Logo on Right for RTL */}
            <div className="flex items-center">
              {logoComponent}
            </div>

            {/* Mobile Menu Button - Left on Mobile (RTL) */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-full border border-slate-100"
                title="Toggle Language"
              >
                <Globe className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 text-[#0ca5b0] hover:bg-slate-50 rounded-full border border-slate-100"
              >
                <Menu className="h-5.5 w-5.5 stroke-2" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Slide-out Sidebar from the Right (as in Screenshot 1) */}
      {mobileOpen && (
        <>
          {/* Back Dim Overlay */}
          <div 
            className="fixed inset-0 z-100 bg-[#002025]/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileOpen(false)}
          />

          {/* Sidebar Drawer on the Right side */}
          <div className="fixed top-0 right-0 h-full w-80 bg-white z-101 shadow-2xl flex flex-col justify-between animate-slide-in-right border-l border-slate-100">
            <div>
              {/* Sidebar Header with Close & Logo */}
              <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-[#0ca5b0] hover:bg-slate-50 rounded-full"
                >
                  <X className="h-5.5 w-5.5" />
                </button>
                
                {logoComponent}
              </div>

              {/* Action Buttons inside Drawer */}
              <div className="p-4 flex items-center gap-2 border-b border-slate-100 bg-slate-50/50">
                {user ? (
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={() => handleLinkClick(user.role === "admin" ? "admin_panel" : "student_panel")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#002025] text-white hover:bg-[#003138] font-bold text-xs rounded-full transition"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>{user.role === "admin" ? t.admin_panel : t.student_panel}</span>
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-full text-xs font-bold"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>خروج</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleLinkClick("login")}
                      className="flex-1 py-2 text-center text-xs font-black border border-[#0ca5b0] text-[#0ca5b0] rounded-full bg-white hover:bg-[#0ca5b0]/5"
                    >
                      دخول
                    </button>
                    <button
                      onClick={() => handleLinkClick("register")}
                      className="flex-1 py-2 text-center text-xs font-black bg-[#0ca5b0] hover:bg-[#0a8396] text-white rounded-full shadow-md shadow-[#0ca5b0]/10"
                    >
                      تسجيل
                    </button>
                  </>
                )}
              </div>

              {/* Navigation Menu Links */}
              <div className="p-4 space-y-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = activeView === link.view;
                  return (
                    <button
                      key={link.view}
                      onClick={() => handleLinkClick(link.view)}
                      className={`flex items-center gap-4.5 w-full px-4.5 py-3.5 rounded-2xl text-[14px] font-black text-right transition-all duration-150 ${
                        isActive 
                          ? "bg-[#0ca5b0]/10 text-[#0ca5b0]" 
                          : "text-slate-700 hover:text-[#0ca5b0] hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-[#0ca5b0]" : "text-slate-400"}`} />
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold bg-slate-50">
              © {new Date().getFullYear()} BoostUp Academy
            </div>
          </div>
        </>
      )}
    </>
  );
}
