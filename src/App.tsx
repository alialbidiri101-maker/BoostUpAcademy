import React, { useState, useEffect } from "react";
import { 
  GraduationCap, Globe, LogIn, LogOut, LayoutDashboard, Search, KeyRound, 
  Award, Trophy, HelpCircle, Phone, Send, Instagram, Facebook, Linkedin, 
  MessageCircle, ShieldCheck, FileText, ChevronRight, BookOpen, AlertCircle, X,
  ArrowLeft, Lock, Printer, Users, Calendar, Star, Clock, Brain, Info, User as UserIcon
} from "lucide-react";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

import { User, Course, Trainer, Article, FAQ, Settings, Event } from "./types";
import { arTranslations, enTranslations, TranslationKeys } from "./translations";
import Navbar from "./components/Navbar";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import CourseLessons from "./components/CourseLessons";
import { BoostUpLogo } from "./components/BoostUpLogo";

export default function App() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t: TranslationKeys = lang === "ar" ? arTranslations : enTranslations;

  // Active view router
  const [activeView, setActiveView] = useState<string>("home");
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);

  useEffect(() => {
    // Whenever view changes, trigger a beautiful animated screen preloader
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 650); // Elegant fade out after 650ms
    return () => clearTimeout(timer);
  }, [activeView]);

  const [user, setUser] = useState<User | null>(null);

  const handleSetUser = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("boostup_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("boostup_user");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("boostup_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        if (parsed.role === "admin") {
          setActiveView("admin_panel");
        } else {
          setActiveView("student_panel");
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Core platform loaded data
  const [settings, setSettings] = useState<Settings>({
    site_name: "BoostUp Academy",
    phone: "07722665576",
    telegram: "@BoostUp3",
    instagram: "https://www.instagram.com/boostup.eng",
    linkedin: "http://www.linkedin.com/in/alboostup-academy2024",
    facebook: "https://www.facebook.com/profile.php?id=61565657222438&mibextid=ZbWKwL",
    about_text: "BoostUp Academy منصة تعليمية توفر محتوى تدريبي عالي الجودة بإشراف مدربين متخصصين لمساعدتك على تطوير مهاراتك في مختلف المجالات."
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Selected details for single page views
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // Authentication Forms State
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotResetLink, setForgotResetLink] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Certificate Verification Form State
  const [verificationCode, setVerificationCode] = useState("");
  const [verifiedCertResult, setVerifiedCertResult] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState("");

  // Auth Email Verification State
  const [showAuthVerificationModal, setShowAuthVerificationModal] = useState(false);
  const [authVerificationEmail, setAuthVerificationEmail] = useState("");
  const [authVerificationCode, setAuthVerificationCode] = useState("");
  const [authSandboxCode, setAuthSandboxCode] = useState("");

  // Alert/Message Banner State
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showMessage = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Fetch initial system configurations & records
  const loadPlatformSettings = async () => {
    try {
      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      if (settingsRes.ok) setSettings(settingsData);

      const coursesRes = await fetch("/api/courses");
      const coursesData = await coursesRes.json();
      setCourses(coursesData);

      const trainersRes = await fetch("/api/trainers");
      const trainersData = await trainersRes.json();
      setTrainers(trainersData);

      const articlesRes = await fetch("/api/articles");
      const articlesData = await articlesRes.json();
      setArticles(articlesData);

      const faqsRes = await fetch("/api/faqs");
      const faqsData = await faqsRes.json();
      setFaqs(faqsData);

      const eventsRes = await fetch("/api/events");
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }
    } catch (e) {
      console.error("Error loading platform assets:", e);
    }
  };

  useEffect(() => {
    loadPlatformSettings();
  }, []);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) return;

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginForm.email)) {
      showMessage(lang === "ar" ? "البريد الإلكتروني المكتوب غير صالح، يرجى كتابة بريد إلكتروني حقيقي" : "Invalid email address", "error");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handleSetUser(data.user);
        showMessage(lang === "ar" ? "تم تسجيل الدخول بنجاح" : "Logged in successfully", "success");
        setLoginForm({ email: "", password: "" });
        
        // Redirect accordingly
        if (data.user.role === "admin") {
          setActiveView("admin_panel");
        } else {
          setActiveView("student_panel");
        }
      } else {
        showMessage(data.error || "البريد أو كلمة المرور غير صحيحة", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال بالخادم", "error");
    }
  };

  // Handle Google Sign-In helper
  const handleGoogleSignIn = async (email: string, name: string) => {
    try {
      const res = await fetch("/api/auth/google-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handleSetUser(data.user);
        showMessage(lang === "ar" ? `تم تسجيل الدخول بجوجل بنجاح: ${data.user.full_name}` : `Signed in with Google: ${data.user.full_name}`, "success");
        if (data.user.role === "admin") {
          setActiveView("admin_panel");
        } else {
          setActiveView("student_panel");
        }
      } else {
        showMessage(data.error || "خطأ أثناء تسجيل الدخول بجوجل", "error");
      }
    } catch (e) {
      showMessage("فشل الاتصال بالخادم", "error");
    }
  };

  // Trigger Real Firebase Google Sign-In popup
  const triggerRealGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      if (firebaseUser && firebaseUser.email) {
        await handleGoogleSignIn(
          firebaseUser.email,
          firebaseUser.displayName || firebaseUser.email.split("@")[0]
        );
      }
    } catch (error: any) {
      console.error("Firebase Auth Google Error:", error);
      if (error.code === "auth/popup-blocked") {
        showMessage(
          lang === "ar"
            ? "تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة لهذا الموقع للمتابعة."
            : "Popup was blocked by your browser. Please allow popups for this site.",
          "error"
        );
      } else if (error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-closed-by-user") {
        // User closed the popup, do nothing or show gentle message
      } else {
        showMessage(
          lang === "ar"
            ? `فشل تسجيل الدخول بواسطة Google: ${error.message}`
            : `Google Sign-in failed: ${error.message}`,
          "error"
        );
      }
    }
  };

  // Handle Register submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { full_name, email, password } = registerForm;
    if (!full_name || !email || !password) return;

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage(lang === "ar" ? "البريد الإلكتروني المكتوب غير صالح، يرجى كتابة بريد إلكتروني حقيقي" : "Invalid email address", "error");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        handleSetUser(data.user);
        showMessage(lang === "ar" ? "تم تسجيل حسابك بنجاح!" : "Account created and activated successfully!", "success");
        setRegisterForm({ full_name: "", email: "", phone: "", password: "" });
        setActiveView("student_panel");
      } else {
        showMessage(data.error || "خطأ أثناء تسجيل الحساب", "error");
      }
    } catch (err) {
      showMessage("فشل تسجيل الحساب", "error");
    }
  };

  // Handle Code Verification Submission
  const handleAuthVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authVerificationCode) {
      showMessage(lang === "ar" ? "يرجى إدخال كود التحقق" : "Please enter the verification code", "error");
      return;
    }

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authVerificationEmail, code: authVerificationCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMessage(data.message || "تم تفعيل الحساب بنجاح!", "success");
        setShowAuthVerificationModal(false);
        setAuthVerificationCode("");
        setAuthSandboxCode("");
        setActiveView("login");
      } else {
        showMessage(data.error || "كود التحقق غير صحيح", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال بالخادم لتفعيل الحساب", "error");
    }
  };

  // Handle Resending Code
  const handleResendAuthCode = async () => {
    if (!authVerificationEmail) return;
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authVerificationEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMessage(data.message || "تم إعادة إرسال كود التحقق بنجاح!", "success");
        if (data.verification_code) {
          setAuthSandboxCode(data.verification_code);
        }
      } else {
        showMessage(data.error || "فشل إعادة إرسال كود التحقق", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال بالخادم لإرسال الكود", "error");
    }
  };

  // Handle Forgot Password Form Submission
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMessage(t.send_reset_link, "success");
        // Simulated link returned from Express mock server
        setForgotResetLink(data.resetLink);
      } else {
        showMessage(data.error || "فشل إرسال الرابط", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال بالخادم", "error");
    }
  };

  // Handle Reset Password (from simulated URL)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMessage(lang === "ar" ? "تم تحديث كلمة المرور بنجاح!" : "Password updated successfully!", "success");
        setResetToken("");
        setNewPassword("");
        setForgotResetLink("");
        setForgotEmail("");
        setActiveView("login");
      } else {
        showMessage(data.error || "رمز غير صالح", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال", "error");
    }
  };

  // Verify Certificate Search
  const handleVerifyCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setVerifiedCertResult(null);
    setVerificationError("");

    try {
      const res = await fetch(`/api/certificates/verify/${verificationCode.trim()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifiedCertResult(data);
        showMessage(t.verified_cert, "success");
      } else {
        setVerificationError(data.error || t.not_found_cert);
        showMessage(t.not_found_cert, "error");
      }
    } catch (err) {
      setVerificationError(lang === "ar" ? "فشل الاتصال بمنظومة التحقق" : "Verification query failed");
    }
  };

  // Logout
  const handleLogout = () => {
    handleSetUser(null);
    setActiveView("home");
    showMessage(lang === "ar" ? "تم تسجيل الخروج بنجاح" : "Logged out successfully", "success");
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-950 antialiased font-sans transition-all duration-300">
      
      {/* Alert Top Banner */}
      {alert && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 p-4 rounded-xl shadow-xl border flex items-center justify-between gap-4 max-w-md animate-bounce ${
          alert.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-bold">{alert.message}</p>
          </div>
          <button onClick={() => setAlert(null)} className="p-1 hover:bg-slate-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page transition preloader overlay */}
      {isPageLoading && (
        <div className="fixed inset-0 z-[99999] bg-[#002025]/98 backdrop-blur-lg flex flex-col items-center justify-center transition-all duration-300">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="transform scale-150 transition duration-500 animate-pulse">
              <BoostUpLogo variant="light" showText={true} />
            </div>
            <div className="w-48 h-1 bg-teal-950 rounded-full overflow-hidden mt-8 relative">
              <div className="absolute inset-y-0 w-24 bg-[#0ca5b0] rounded-full animate-loading-bar" />
            </div>
          </div>
        </div>
      )}

      {/* Header Navbar */}
      <Navbar 
        user={user}
        t={t}
        lang={lang}
        setLang={setLang}
        onNavigate={setActiveView}
        activeView={activeView}
        onLogout={handleLogout}
        settingsName={settings.site_name}
      />

      <main className="flex-grow">
        
        {/* --- 1. HOME LANDING PAGE --- */}
        {activeView === "home" && (
          <div className="space-y-24 pb-20 bg-[#fbfdfd]" dir="rtl">
            
            {/* 1. HERO SECTION (Screenshot 8) */}
            <section className="relative overflow-hidden pt-20 pb-24 bg-gradient-to-b from-[#e8f6f8]/70 via-[#f5fafb]/50 to-white text-right">
              <div className="absolute inset-0 bg-[radial-gradient(#0ca5b0_0.8px,transparent_0.8px)] [background-size:16px_16px] opacity-15" />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 text-center">
                
                <div className="space-y-4 max-w-4xl mx-auto">
                  <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 leading-[1.15]">
                    <span className="block text-slate-900">طوّر مهاراتك</span>
                    <span className="block text-[#0ca5b0] mt-2 bg-clip-text">وابدأ مسيرتك المهنية</span>
                  </h1>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#086c7c] tracking-wide mt-3">
                    دورات تدريبية واحترافية متكاملة
                  </h2>
                </div>

                {/* 3 Statistic Pill Badges below Hero Title */}
                <div className="flex flex-wrap justify-center items-center gap-3 max-w-xl mx-auto pt-4">
                  <div className="px-6 py-2.5 bg-white border border-[#0ca5b0]/20 shadow-md shadow-[#0ca5b0]/5 text-slate-800 text-sm font-black rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0ca5b0]" />
                    <span>101+ متدرب</span>
                  </div>
                  <div className="px-6 py-2.5 bg-white border border-[#0ca5b0]/20 shadow-md shadow-[#0ca5b0]/5 text-slate-800 text-sm font-black rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#eab308]" />
                    <span>15+ مدرب</span>
                  </div>
                  <div className="px-6 py-2.5 bg-white border border-[#0ca5b0]/20 shadow-md shadow-[#0ca5b0]/5 text-slate-800 text-sm font-black rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#086c7c]" />
                    <span>68+ شهادة</span>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 max-w-md mx-auto">
                  <button
                    onClick={() => setActiveView("courses")}
                    className="flex-1 px-8 py-3.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-sm rounded-full transition shadow-lg shadow-[#0ca5b0]/25 flex items-center justify-center gap-2"
                  >
                    <span>{t.explore_courses}</span>
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    onClick={() => setActiveView("verify_certificate")}
                    className="flex-1 px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-sm rounded-full transition shadow-xs"
                  >
                    {t.verify_certificate}
                  </button>
                </div>
              </div>
            </section>

            {/* 2. MOST POPULAR COURSES SECTION (Screenshot 8) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-[#0ca5b0] rounded-full" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#002025] tracking-tight">أشهر الكورسات</h2>
                </div>
                <button 
                  onClick={() => setActiveView("courses")} 
                  className="px-4 py-2 text-[#0ca5b0] hover:text-[#0a8396] font-extrabold text-xs flex items-center gap-1.5 border border-[#0ca5b0]/20 rounded-full bg-white hover:bg-[#0ca5b0]/5 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>عرض الكل</span>
                </button>
              </div>

              {/* Course items rendering. Uses high quality oil & gas items if DB courses is empty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {courses.length === 0 ? (
                <div className="w-full bg-white border border-slate-100 p-12 rounded-[2rem] text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 bg-[#0ca5b0]/10 text-[#0ca5b0] rounded-full flex items-center justify-center mx-auto text-2xl">
                    📚
                  </div>
                  <h3 className="font-black text-[#002025] text-lg">بانتظار إضافة الكورسات الأولى 🌟</h3>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                    لا توجد كورسات متاحة حالياً على المنصة. تفضل بتسجيل الدخول كمدير وإضافة أول كورس من لوحة التحكم لتظهر هنا فوراً للزوار والطلاب.
                  </p>
                  {user && user.role === "admin" ? (
                    <button onClick={() => setActiveView("admin_panel")} className="px-6 py-2.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-xs rounded-full transition shadow-md shadow-[#0ca5b0]/15">
                      انتقل إلى لوحة الإدارة لإضافة كورس
                    </button>
                  ) : (
                    <button onClick={() => setActiveView("login")} className="px-6 py-2.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-xs rounded-full transition shadow-md shadow-[#0ca5b0]/15">
                      تسجيل دخول كمسؤول
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                  {courses.slice(0, 3).map((c, idx) => {
                    const course = {
                      ...c,
                      trainer: c.trainer_name || "مدرب معتمد",
                      rating: 5,
                      reviews: 45 + idx * 23,
                      badge: "إلكتروني",
                      image: c.image || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"
                    };
                    return (
                      <div key={course.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                        <div className="relative">
                          {/* Badge in corner */}
                          <span className="absolute top-4 right-4 z-10 bg-[#0ca5b0] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md">
                            {course.badge}
                          </span>
                          <img 
                            src={course.image} 
                            alt={course.title} 
                            className="w-full h-52 object-cover border-b border-slate-50"
                            referrerPolicy="no-referrer"
                          />
                          
                          <div className="p-6 space-y-3.5 text-right">
                            <h3 className="font-black text-slate-900 text-lg leading-snug line-clamp-2 hover:text-[#0ca5b0] transition cursor-pointer" onClick={() => { setActiveCourseId(course.id); setActiveView(user ? "student_panel" : "login"); }}>
                              {course.title}
                            </h3>
                            
                            {/* Instructor info with UserIcon */}
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold justify-start">
                              <UserIcon className="h-4 w-4 text-[#0ca5b0]" />
                              <span>{course.trainer}</span>
                            </div>

                            {/* Stars Rating block */}
                            <div className="flex items-center gap-1.5 justify-start">
                              <div className="flex gap-0.5 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="h-4.5 w-4.5 fill-current" />
                                ))}
                              </div>
                              <span className="text-slate-400 text-xs font-bold">({course.reviews})</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 pt-0 mt-2 flex items-center justify-between border-t border-slate-50 bg-slate-50/30">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-extrabold block uppercase">سعر الاشتراك</span>
                            <span className="text-[#0ca5b0] font-black text-lg">
                              {Number(course.price).toLocaleString()} د.ع
                            </span>
                          </div>
                          
                          {/* Left indicator: Duration with Clock Icon */}
                          <div className="flex items-center gap-1 text-slate-500 text-xs font-black">
                            <Clock className="h-4 w-4 text-[#0ca5b0]" />
                            <span>{course.duration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </section>

            {/* 3. ABOUT UPTAINERS SECTION (Screenshot 5) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Right block: 2x2 statistics grid boxes */}
                <div className="grid grid-cols-2 gap-4 order-2 lg:order-1">
                  <div className="bg-gradient-to-br from-[#c5a059] to-[#af873e] text-white p-8 rounded-3xl shadow-lg flex flex-col justify-center items-center text-center space-y-2">
                    <span className="text-3xl sm:text-4xl font-black">+5000</span>
                    <span className="text-xs sm:text-sm font-black text-amber-100">متدرب</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#0ca5b0] to-[#0a8396] text-white p-8 rounded-3xl shadow-lg flex flex-col justify-center items-center text-center space-y-2">
                    <span className="text-3xl sm:text-4xl font-black">2023</span>
                    <span className="text-xs sm:text-sm font-black text-teal-100">عام التأسيس</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#e67e22] to-[#d35400] text-white p-8 rounded-3xl shadow-lg flex flex-col justify-center items-center text-center space-y-2">
                    <span className="text-3xl sm:text-4xl font-black">+11</span>
                    <span className="text-xs sm:text-sm font-black text-orange-100">عام خبرة</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#003c43] to-[#002428] text-white p-8 rounded-3xl shadow-lg flex flex-col justify-center items-center text-center space-y-2">
                    <span className="text-3xl sm:text-4xl font-black">+100</span>
                    <span className="text-xs sm:text-sm font-black text-slate-300">دورة</span>
                  </div>
                </div>

                {/* Left block: Description with Accent Line and Read More button */}
                <div className="space-y-6 text-right order-1 lg:order-2">
                  <div className="flex items-center gap-3 justify-start">
                    <div className="w-1.5 h-8 bg-[#0ca5b0] rounded-full" />
                    <h2 className="text-2xl sm:text-3xl font-black text-[#002025]">عن الأكاديمية</h2>
                  </div>
                  <div className="w-20 h-1 bg-amber-500 rounded" />
                  
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-bold">
                    أكاديمية BoostUp منصة تدريبية متكاملة لتقديم البرامج والمناهج التعليمية والمهنية المعتمدة لمساعدتك على تطوير قدراتك وتنمية مهاراتك الفنية والعملية لمواكبة سوق العمل.
                  </p>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-semibold">
                    نهدف لتقديم تجربة تدريبية استثنائية تسد الفجوة بين الجوانب النظرية والتطبيقات المهنية الواقعية، بمشاركة خبراء متميزين في شتى التخصصات والعلوم المعاصرة.
                  </p>

                  <button 
                    onClick={() => setActiveView("about")}
                    className="px-6 py-2.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-xs rounded-full shadow-md shadow-[#0ca5b0]/25 transition flex items-center gap-2 justify-center"
                  >
                    <Info className="h-4.5 w-4.5" />
                    <span>اقرأ المزيد</span>
                  </button>
                </div>

              </div>
            </section>

            {/* 4. STATISTICS CARDS SECTION (Screenshot 3) */}
            <section className="bg-[#001c20] py-20 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[#0ca5b0]/5 mix-blend-color-dodge pointer-events-none" />
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
                
                {/* Grid of four dark teal cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  <div className="bg-[#00252a] border border-[#003c43] p-8 rounded-3xl text-center space-y-4 shadow-xl shadow-[#001417]/30 hover:border-[#0ca5b0]/50 transition-all duration-300">
                    <div className="mx-auto p-4 bg-[#001c20] text-[#0ca5b0] rounded-2xl w-fit">
                      <Users className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-4xl font-black text-white">+50</span>
                      <span className="block text-xs font-black text-[#0ca5b0] uppercase tracking-wider">مدرب</span>
                    </div>
                  </div>

                  <div className="bg-[#00252a] border border-[#003c43] p-8 rounded-3xl text-center space-y-4 shadow-xl shadow-[#001417]/30 hover:border-[#0ca5b0]/50 transition-all duration-300">
                    <div className="mx-auto p-4 bg-[#001c20] text-[#0ca5b0] rounded-2xl w-fit">
                      <GraduationCap className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-4xl font-black text-white">+101</span>
                      <span className="block text-xs font-black text-[#0ca5b0] uppercase tracking-wider">طالب</span>
                    </div>
                  </div>

                  <div className="bg-[#00252a] border border-[#003c43] p-8 rounded-3xl text-center space-y-4 shadow-xl shadow-[#001417]/30 hover:border-[#0ca5b0]/50 transition-all duration-300">
                    <div className="mx-auto p-4 bg-[#001c20] text-[#0ca5b0] rounded-2xl w-fit">
                      <Globe className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-4xl font-black text-white">+20</span>
                      <span className="block text-xs font-black text-[#0ca5b0] uppercase tracking-wider">دولة</span>
                    </div>
                  </div>

                  <div className="bg-[#00252a] border border-[#003c43] p-8 rounded-3xl text-center space-y-4 shadow-xl shadow-[#001417]/30 hover:border-[#0ca5b0]/50 transition-all duration-300">
                    <div className="mx-auto p-4 bg-[#001c20] text-[#0ca5b0] rounded-2xl w-fit">
                      <Award className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-4xl font-black text-white">+68</span>
                      <span className="block text-xs font-black text-[#0ca5b0] uppercase tracking-wider">شهادة</span>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* 5. UPCOMING EVENTS SECTION (Screenshot 4) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-[#0ca5b0] rounded-full" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#002025]">الفعاليات القادمة</h2>
                </div>
                <button 
                  onClick={() => setActiveView("events")}
                  className="px-4 py-2 text-[#0ca5b0] hover:text-[#0a8396] font-extrabold text-xs flex items-center gap-1.5 border border-[#0ca5b0]/20 rounded-full bg-white hover:bg-[#0ca5b0]/5 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>عرض الكل</span>
                </button>
              </div>

              {/* Event card of the fire safety workshop */}
              <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative h-64 md:h-auto">
                    <img 
                      src="https://images.unsplash.com/photo-1599740831464-5cbe1a14f09c?auto=format&fit=crop&q=80&w=800" 
                      alt="ورشة سلامة الحرائق" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#002025]/50 via-transparent to-transparent" />
                  </div>

                  <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6 text-right">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-start">
                        <span className="px-3.5 py-1 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black rounded-full shadow-3xs animate-pulse">
                          ورشة مجانية
                        </span>
                        <span className="px-3.5 py-1 bg-[#0ca5b0]/5 border border-[#0ca5b0]/10 text-[#0ca5b0] text-[11px] font-black rounded-full">
                          سلامة الحرائق والأمان
                        </span>
                      </div>
                      
                      <h3 className="text-xl sm:text-2xl font-black text-[#002025] leading-snug">
                        ورشة توعوية مجانية (سلامة الحرائق والأمان) - 2025
                      </h3>
                      
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-semibold">
                        نظراً للأحداث الأخيرة المؤلمة في مدينة الكوت الحبيبة، والواقعة التي هزت المجتمع، تعلن أكاديمية BoostUp بالتعاون مع شركة MedWorx عن تنظيم محاضرة توعوية مجانية حول سلامة الحرائق، الأمان، والأماكن المغلقة، سعياً لنشر الوعي وتقليص الفجوة بين الواقع والمأمول.
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-black bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                        <Calendar className="h-4.5 w-4.5 text-[#0ca5b0]" />
                        <span>2026-04-05</span>
                      </div>
                      
                      <button 
                        onClick={() => setActiveView("events")}
                        className="px-5 py-2.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-xs rounded-full transition shadow-md shadow-[#0ca5b0]/15"
                      >
                        تفاصيل الورشة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. FAQS ACCORDION SECTION */}
            <section className="max-w-3xl mx-auto px-4 sm:px-6">
              <div className="text-center space-y-4 mb-12">
                <div className="flex items-center gap-3 justify-center">
                  <div className="w-1.5 h-8 bg-[#0ca5b0] rounded-full" />
                  <h2 className="text-2xl sm:text-3xl font-black text-[#002025] tracking-tight">{t.faq}</h2>
                </div>
                <div className="w-12 h-0.5 bg-slate-200 mx-auto rounded" />
              </div>

              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs text-right">
                    <h3 className="font-extrabold text-[#002025] text-base mb-2.5 flex items-start gap-2 justify-start">
                      <HelpCircle className="h-5 w-5 text-[#0ca5b0] flex-shrink-0 mt-0.5" />
                      <span>{faq.question}</span>
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed pr-7 pl-7 font-semibold">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --- 2. COURSES PAGE --- */}
        {activeView === "courses" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 text-right" dir="rtl">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-1.5 h-8 bg-[#0ca5b0] rounded-full" />
                <h2 className="text-3xl sm:text-4xl font-black text-[#002025] tracking-tight">كورسات الأكاديمية التدريبية 🎓</h2>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed max-w-xl mx-auto">
                استكشف برامجنا الأكاديمية والمناهج المكثفة المصممة خصيصاً لتلبية احتياجات سوق العمل وتطوير مهاراتك الفنية والمهنية بالتعاون مع كبار الخبراء والمدربين.
              </p>
            </div>

            {courses.length === 0 ? (
              <div className="w-full bg-white border border-slate-100 p-16 rounded-[2rem] text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-[#0ca5b0]/10 text-[#0ca5b0] rounded-full flex items-center justify-center mx-auto text-2xl">
                  📚
                </div>
                <h3 className="font-black text-[#002025] text-lg">بانتظار إضافة الكورسات الأولى 🌟</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                  لا توجد كورسات متاحة حالياً على المنصة. تفضل بتسجيل الدخول كمدير وإضافة أول كورس من لوحة التحكم لتظهر هنا فوراً للزوار والطلاب.
                </p>
                {user && user.role === "admin" ? (
                  <button onClick={() => setActiveView("admin_panel")} className="px-6 py-2.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-xs rounded-full transition shadow-md shadow-[#0ca5b0]/15">
                    انتقل إلى لوحة الإدارة لإضافة كورس
                  </button>
                ) : (
                  <button onClick={() => setActiveView("login")} className="px-6 py-2.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-xs rounded-full transition shadow-md shadow-[#0ca5b0]/15">
                    تسجيل دخول كمسؤول
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {courses.map((c, idx) => {
                  const course = {
                    ...c,
                    trainer: c.trainer_name || "مدرب معتمد",
                    rating: 5,
                    reviews: 50 + idx * 17,
                    badge: "إلكتروني",
                    image: c.image || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"
                  };
                  return (
                <div key={course.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                  <div className="relative">
                    {/* Badge */}
                    <span className="absolute top-4 right-4 z-10 bg-[#0ca5b0] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md">
                      {course.badge}
                    </span>
                    <img 
                      src={course.image} 
                      alt={course.title} 
                      className="w-full h-52 object-cover border-b border-slate-50"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="p-6 space-y-3.5 text-right">
                      <h3 className="font-black text-slate-900 text-lg leading-snug line-clamp-2 hover:text-[#0ca5b0] transition cursor-pointer" onClick={() => { setActiveCourseId(course.id); setActiveView(user ? "student_panel" : "login"); }}>
                        {course.title}
                      </h3>
                      
                      {/* Instructor */}
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold justify-start">
                        <UserIcon className="h-4 w-4 text-[#0ca5b0]" />
                        <span>{course.trainer}</span>
                      </div>

                      {/* Stars Rating */}
                      <div className="flex items-center gap-1.5 justify-start">
                        <div className="flex gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4.5 w-4.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-slate-400 text-xs font-bold">({course.reviews})</span>
                      </div>

                      <p className="text-slate-500 text-xs leading-relaxed font-semibold line-clamp-2 mt-1">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 mt-4 flex items-center justify-between border-t border-slate-50 bg-slate-50/30">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-extrabold block uppercase">سعر الاشتراك</span>
                      <span className="text-[#0ca5b0] font-black text-lg">
                        {Number(course.price).toLocaleString()} د.ع
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setActiveCourseId(course.id);
                        if (user) {
                          setActiveView("student_panel");
                        } else {
                          setActiveView("login");
                        }
                      }}
                      className="px-5 py-2.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-xs rounded-full transition shadow-md shadow-[#0ca5b0]/15"
                    >
                      اشترك وتصفح الدورة
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

        {/* --- 3. ARTICLES PAGE --- */}
        {activeView === "articles" && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">المدونة والمقالات التعليمية 📚</h2>
              <p className="text-slate-500 text-xs font-semibold">إرشادات، نصائح وشروحات كتابية متميزة لتعزيز معارفك بشكل مستمر.</p>
            </div>

            {activeArticle ? (
              <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                <button onClick={() => setActiveArticle(null)} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-bold text-xs">
                  <ArrowLeft className="h-4 w-4" />
                  <span>العودة لجميع المقالات</span>
                </button>
                <h3 className="text-2xl font-black text-slate-950 mt-4">{activeArticle.title}</h3>
                <span className="text-xs text-slate-400 font-semibold block">{new Date(activeArticle.created_at).toLocaleDateString()}</span>
                <div className="w-full h-0.5 bg-slate-100" />
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-semibold">{activeArticle.content}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {articles.map((article) => (
                  <div key={article.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row justify-between gap-6">
                    <div className="space-y-3 flex-grow">
                      <span className="text-[10px] text-slate-400 font-bold block">{new Date(article.created_at).toLocaleDateString()}</span>
                      <h3 className="text-lg font-black text-slate-950 hover:text-indigo-600 transition cursor-pointer" onClick={() => setActiveArticle(article)}>
                        {article.title}
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{article.content}</p>
                    </div>
                    <button
                      onClick={() => setActiveArticle(article)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl self-end sm:self-center transition"
                    >
                      قراءة المزيد
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 4. ABOUT PAGE --- */}
        {activeView === "about" && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">{t.about_title}</h2>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-xl mx-auto">{t.about_sub}</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs leading-relaxed space-y-6 text-sm font-semibold text-slate-700">
              <p>{settings.about_text}</p>
              <p>تم تزويد المنصة بنظم تتبع تضمن لكل مشترك تتبع مسيرته الأكاديمية خطوة بخطوة، والتحقق الفوري من مصداقية ما يناله من شهادات تكريم في تخصصه الفني أو التسويقي.</p>
            </div>
          </div>
        )}

        {/* --- 5. VERIFY CERTIFICATE PAGE --- */}
        {activeView === "verify_certificate" && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-12 text-right" dir="rtl">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-1.5 h-8 bg-[#0ca5b0] rounded-full" />
                <h2 className="text-3xl sm:text-4xl font-black text-[#002025] tracking-tight">التحقق من الشهادات 🛡</h2>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
                أدخل الكود التعريفي الفريد الموثق على شهادتك للتأكد الفوري من مصداقيتها وصلاحيتها وصحة صدورها من الأكاديمية.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
              <form onSubmit={handleVerifyCertificate} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder={t.check_cert_placeholder}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="flex-grow px-5 py-3.5 border border-slate-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#0ca5b0] text-center font-mono font-bold text-base bg-slate-50 uppercase tracking-widest"
                />
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-sm rounded-full transition shadow-md shadow-[#0ca5b0]/15 flex items-center justify-center gap-2"
                >
                  <Search className="h-4.5 w-4.5" />
                  <span>{t.verify_btn}</span>
                </button>
              </form>

              {/* Verified Result display */}
              {verifiedCertResult && (
                <div className="space-y-6">
                  <div className="p-6 bg-emerald-50/50 border border-emerald-100 text-emerald-900 rounded-2xl space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2.5 text-emerald-700 font-extrabold text-sm justify-start">
                      <ShieldCheck className="h-5.5 w-5.5" />
                      <span>{t.verified_cert}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-emerald-100 text-xs font-bold text-emerald-800">
                      <div>
                        <p className="text-emerald-900/60 uppercase">اسم الطالب</p>
                        <p className="text-sm font-black mt-1">{verifiedCertResult.full_name}</p>
                      </div>
                      <div>
                        <p className="text-emerald-900/60 uppercase">الدورة التدريبية</p>
                        <p className="text-sm font-black mt-1">{verifiedCertResult.course_title}</p>
                      </div>
                      <div>
                        <p className="text-emerald-900/60 uppercase">تاريخ التوثيق</p>
                        <p className="text-sm font-black mt-1">{verifiedCertResult.issue_date}</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0ca5b0] hover:bg-[#0a8396] text-white rounded-full text-xs font-bold transition shadow-xs"
                      >
                        <Printer className="h-4 w-4" />
                        <span>طباعة / تحميل</span>
                      </button>
                      <h4 className="text-xs sm:text-sm font-black text-slate-800">🖼️ نسخة معاينة الشهادة الرقمية الموثقة</h4>
                    </div>

                    <div className="p-2 bg-slate-200/50 flex justify-center overflow-x-auto rounded-xl">
                      {verifiedCertResult.course_cert_template ? (
                        /* Custom template uploaded by Admin */
                        <div 
                          id="certificate-print-area"
                          className="relative w-full aspect-[1.414/1] min-w-[600px] max-w-3xl bg-white shadow-lg overflow-hidden rounded-xl border border-slate-200 select-none flex flex-col justify-between p-8 sm:p-12 text-center"
                          style={{
                            backgroundImage: `url(${verifiedCertResult.course_cert_template})`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          {/* Overlay information on top of template */}
                          <div className="absolute inset-0 flex flex-col justify-center items-center p-6 space-y-[4%] sm:space-y-[5%]">
                            {/* Top spacing simulation */}
                            <div className="h-[15%]" />
                            
                            {/* Awarded to */}
                            <p className="text-slate-700/90 italic text-[11px] sm:text-xs md:text-sm font-bold bg-white/80 px-4 py-1 rounded-full backdrop-blur-xs shadow-xs">
                              {t.cert_award_text || "This official certificate is proudly awarded to"}
                            </p>

                            {/* Student Name */}
                            <h3 className="text-xl sm:text-2xl md:text-3.5xl font-black text-indigo-950 bg-white/90 px-6 py-2 rounded-2xl backdrop-blur-xs border border-slate-100 shadow-sm tracking-wide">
                              {verifiedCertResult.full_name}
                            </h3>

                            {/* Course completion text */}
                            <div className="space-y-1 bg-white/80 px-5 py-2 rounded-xl backdrop-blur-xs border border-slate-100 max-w-lg shadow-3xs">
                              <p className="text-slate-600 text-[10px] sm:text-xs font-semibold leading-relaxed">
                                لاجتيازه بنجاح وتفوق الدورة التدريبية المعتمدة:
                              </p>
                              <h4 className="text-xs sm:text-base md:text-lg font-extrabold text-blue-900 leading-snug">
                                « {verifiedCertResult.course_title} »
                              </h4>
                            </div>

                            {/* Footer stats: Code and Date */}
                            <div className="w-full flex justify-between items-end px-[5%] mt-auto pt-4 pb-2">
                              {/* Date */}
                              <div className="text-right bg-white/95 p-2 rounded-xl backdrop-blur-xs border border-slate-150 shadow-3xs min-w-[120px]">
                                <p className="text-[9px] text-slate-400 font-bold">تاريخ الإصدار</p>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">{verifiedCertResult.issue_date}</p>
                              </div>

                              {/* Seal / Emblem */}
                              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-amber-600/30 flex items-center justify-center text-amber-800 text-[8px] sm:text-[10px] font-black rotate-12 bg-white/90 shadow-xs">
                                APPROVED
                              </div>

                              {/* Certificate Code */}
                              <div className="text-left bg-white/95 p-2 rounded-xl backdrop-blur-xs border border-slate-150 shadow-3xs min-w-[140px]">
                                <p className="text-[9px] text-slate-400 font-bold">كود التحقق والتوثيق</p>
                                <p className="text-xs font-mono font-black text-slate-800 mt-0.5">{verifiedCertResult.certificate_id}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Default Luxury Template */
                        <div 
                          id="certificate-print-area"
                          className="w-full min-w-[600px] max-w-3xl p-8 sm:p-12 text-center bg-[#faf8f5] relative border-8 border-double border-amber-800/10 rounded-xl m-2"
                        >
                          {/* Luxury Frame Accents */}
                          <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-800/40" />
                          <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-800/40" />
                          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-800/40" />
                          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-800/40" />

                          <div className="space-y-6">
                            <div className="flex justify-center">
                              <div className="p-4 bg-amber-500/10 text-amber-800 rounded-full">
                                <Trophy className="h-10 w-10" />
                              </div>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black text-amber-850 tracking-wide uppercase">
                              Certificate of Completion
                            </h2>
                            <p className="text-xs text-amber-800/60 uppercase tracking-widest font-bold">
                              BoostUp Academy Educational Network
                            </p>

                            <div className="w-40 h-0.5 bg-amber-800/20 mx-auto" />

                            <p className="text-slate-600 italic text-sm mt-4 font-medium">
                              {t.cert_award_text}
                            </p>
                            <h3 className="text-3xl font-black text-slate-900 border-b border-amber-800/20 pb-2 w-fit mx-auto px-6 tracking-wide">
                              {verifiedCertResult.full_name}
                            </h3>

                            <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed mt-4 font-medium">
                              {t.cert_title_text}
                            </p>
                            <h4 className="text-xl sm:text-2xl font-extrabold text-indigo-900 px-4">
                              « {verifiedCertResult.course_title} »
                            </h4>

                            <div className="pt-8 grid grid-cols-2 gap-4 max-w-md mx-auto text-xs text-slate-600 font-bold border-t border-amber-800/10 mt-6">
                              <div>
                                <p className="text-amber-850">{t.cert_id_text}</p>
                                <p className="font-mono text-slate-900 text-[13px] mt-1 bg-white px-2 py-1 rounded border border-amber-800/10 w-fit mx-auto">
                                  {verifiedCertResult.certificate_id}
                                </p>
                              </div>
                              <div>
                                <p className="text-amber-850">{t.cert_date_text}</p>
                                <p className="text-slate-900 mt-1 bg-white px-3 py-1 rounded border border-amber-800/10 w-fit mx-auto">
                                  {verifiedCertResult.issue_date}
                                </p>
                              </div>
                            </div>

                            {/* Simulated signature stamp */}
                            <div className="mt-10 flex justify-center items-center gap-10">
                              <div className="text-center text-[11px] text-slate-400">
                                <div className="w-24 h-0.5 bg-slate-200 mx-auto mb-1" />
                                <span>Dean Signature</span>
                              </div>
                              <div className="w-16 h-16 rounded-full border-4 border-amber-600/30 flex items-center justify-center text-amber-800 text-[10px] font-black rotate-12 bg-amber-50">
                                APPROVED
                              </div>
                              <div className="text-center text-[11px] text-slate-400">
                                <div className="w-24 h-0.5 bg-slate-200 mx-auto mb-1" />
                                <span>Registrar Seal</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {verificationError && (
                <div className="p-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- EXTRA. TRAINERS VIEW PAGE --- */}
        {activeView === "trainers" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 text-right" dir="rtl">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-1.5 h-8 bg-[#0ca5b0] rounded-full" />
                <h2 className="text-3xl sm:text-4xl font-black text-[#002025] tracking-tight">المدربون والخبراء 👨‍🏫</h2>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
                نخبة من كبار المهندسين والمستشارين المعتمدين دولياً لقيادتكم في رحلة التدريب الاحترافي.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  id: 1,
                  full_name: "Yasser Salah",
                  job_title: "Senior QA/QC Instructor & Consultant",
                  bio: "خبرة أكثر من 11 سنة في مجالات الفحص الهندسي، رقابة الجودة (QA/QC)، وإدارة المشاريع مع كبريات الشركات والمؤسسات العالمية."
                },
                {
                  id: 2,
                  full_name: "Raed Al-Obaidi",
                  job_title: "Senior Software Architect & Instructor",
                  bio: "خبير ومتخصص في هندسة البرمجيات وتطوير الحلول السحابية وتصميم المناهج الأكاديمية لتدريب الكوادر التقنية من الصفر."
                },
                {
                  id: 3,
                  full_name: "المهندس نشأت جمعة",
                  job_title: "Data Science & AI Expert",
                  bio: "متخصص في علوم البيانات وتطبيقات الذكاء الاصطناعي ولغات البرمجة الحديثة وتدريب فرق العمل على تقنيات التعلم الآلي المعاصرة."
                }
              ].map((trainer) => (
                <div key={trainer.id} className="bg-white border border-slate-100 p-8 rounded-[2rem] flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-20 h-20 rounded-full bg-[#0ca5b0]/10 text-[#0ca5b0] font-black flex items-center justify-center text-2xl uppercase mb-4 border-2 border-[#0ca5b0]/30 shadow-inner">
                    {trainer.full_name[0]}
                  </div>
                  <h3 className="font-black text-[#002025] text-lg">{trainer.full_name}</h3>
                  <span className="text-[#0ca5b0] text-xs font-black mt-1.5 px-3 py-1 bg-[#0ca5b0]/5 rounded-full border border-[#0ca5b0]/10 block w-fit">
                    {trainer.job_title}
                  </span>
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mt-5 font-semibold">
                    {trainer.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- EXTRA. EVENTS VIEW PAGE --- */}
        {activeView === "events" && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12 text-right" dir="rtl">
            <div className="text-center space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-1.5 h-8 bg-[#0ca5b0] rounded-full" />
                <h2 className="text-3xl sm:text-4xl font-black text-[#002025] tracking-tight">الفعاليات وورش العمل 📅</h2>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-xl mx-auto">
                منصتنا ملتزمة بخدمة المجتمع ونشر الوعي الثقافي والفني من خلال ندوات دورية ومحاضرات مجانية متاحة للجميع.
              </p>
            </div>

            {events.length === 0 ? (
              <div className="w-full bg-white border border-slate-100 p-12 rounded-[2rem] text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-[#0ca5b0]/10 text-[#0ca5b0] rounded-full flex items-center justify-center mx-auto text-2xl">
                  📅
                </div>
                <h3 className="font-black text-[#002025] text-lg">لا توجد فعاليات قادمة حالياً 🌟</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                  تفضل بزيارة صفحتنا لاحقاً لمتابعة أحدث ورش العمل والفعاليات المجانية التي نقدمها لخدمة المجتمع.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {events.map((event) => (
                  <div key={event.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-md space-y-8 p-6 sm:p-10">
                    <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden">
                      <img 
                        src={event.image || "https://images.unsplash.com/photo-1599740831464-5cbe1a14f09c?auto=format&fit=crop&q=80&w=1200"} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#002025]/60 to-transparent" />
                      <span className="absolute bottom-6 right-6 bg-[#0ca5b0] text-white text-xs font-black px-4 py-2 rounded-full shadow-md">
                        {event.is_free ? "ورشة مجانية" : "فعالية"}
                      </span>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center gap-2 justify-start">
                        <span className="px-3.5 py-1 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black rounded-full">
                          {event.is_free ? "مجانية بالكامل" : "مدفوعة"}
                        </span>
                        <span className="px-3.5 py-1 bg-[#0ca5b0]/5 border border-[#0ca5b0]/10 text-[#0ca5b0] text-xs font-black rounded-full">
                          {event.category}
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-black text-[#002025] leading-snug">
                        {event.title}
                      </h3>

                      <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-semibold whitespace-pre-line">
                        {event.description}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm font-black bg-slate-50 px-5 py-3 rounded-full border border-slate-100">
                          <Calendar className="h-5 w-5 text-[#0ca5b0]" />
                          <span>{event.date} ({event.time})</span>
                        </div>

                        <a 
                          href={event.registration_link || `https://t.me/${settings.telegram.replace("@", "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto px-8 py-3.5 bg-[#0ca5b0] hover:bg-[#0a8396] text-white font-black text-center text-sm rounded-full transition shadow-lg shadow-[#0ca5b0]/15 flex items-center justify-center gap-2"
                        >
                          <Send className="h-4.5 w-4.5" />
                          <span>سجل الآن</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 6. AUTHENTICATION SCREENS --- */}
        {activeView === "login" && (
          <div className="max-w-md mx-auto px-4 py-16">
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-950">{t.login}</h2>
                <p className="text-xs text-slate-500 font-semibold">مرحباً بك مجدداً في بوابة BoostUp التعليمية</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.email_placeholder}</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">{t.password_placeholder}</label>
                    <button
                      type="button"
                      onClick={() => setActiveView("forgot_password")}
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      {t.forgot_password}
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition shadow-xs"
                >
                  {t.login}
                </button>
              </form>

              <div className="relative flex py-2 items-center text-xs text-slate-400 font-bold">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4">أو المتابعة باستخدام</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button
                type="button"
                onClick={triggerRealGoogleSignIn}
                className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition flex items-center justify-center gap-2.5 text-xs font-bold shadow-xs cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>الدخول بواسطة Google</span>
              </button>

              <div className="text-center text-xs font-bold text-slate-500 pt-1">
                <span>ليس لديك حساب؟ </span>
                <button onClick={() => setActiveView("register")} className="text-indigo-600 hover:underline">
                  سجل الآن مجاناً
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === "register" && (
          <div className="max-w-md mx-auto px-4 py-16">
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-950">{t.register}</h2>
                <p className="text-xs text-slate-500 font-semibold">ابدأ رحلتك التعليمية الآن واكتشف دوراتنا</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.name_placeholder}</label>
                  <input
                    type="text"
                    required
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.email_placeholder}</label>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.password_placeholder}</label>
                  <input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition shadow-xs"
                >
                  {t.register}
                </button>
              </form>

              <div className="relative flex py-2 items-center text-xs text-slate-400 font-bold">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4">أو المتابعة باستخدام</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button
                type="button"
                onClick={triggerRealGoogleSignIn}
                className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition flex items-center justify-center gap-2.5 text-xs font-bold shadow-xs cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>التسجيل بواسطة Google</span>
              </button>

              <div className="text-center text-xs font-bold text-slate-500 pt-1">
                <span>لديك حساب بالفعل؟ </span>
                <button onClick={() => setActiveView("login")} className="text-indigo-600 hover:underline">
                  تسجيل الدخول
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORGOT & RESET PASSWORD DYNAMIC VISUAL FLOW */}
        {activeView === "forgot_password" && (
          <div className="max-w-md mx-auto px-4 py-16">
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-950">{t.reset_password}</h2>
                <p className="text-xs text-slate-500 font-semibold">استرجع حسابك التعليمي عبر البريد الموثق</p>
              </div>

              {!forgotResetLink ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.email_placeholder}</label>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition shadow-xs"
                  >
                    أرسل رابط إعادة التعيين
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold leading-relaxed space-y-2">
                    <p className="font-black text-emerald-900">✅ تم توليد رابط إعادة التعيين بنجاح:</p>
                    <p className="font-mono bg-white p-2.5 rounded border border-emerald-200/50 break-all select-all">{forgotResetLink}</p>
                    <button
                      onClick={() => {
                        const urlParams = new URLSearchParams(new URL(forgotResetLink).search);
                        const token = urlParams.get("token") || "";
                        setResetToken(token);
                      }}
                      className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-center block font-extrabold"
                    >
                      متابعة تعيين كلمة المرور الجديدة
                    </button>
                  </div>

                  {resetToken && (
                    <form onSubmit={handleResetPassword} className="space-y-4 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.new_password_placeholder}</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition"
                      >
                        حفظ كلمة المرور الجديدة
                      </button>
                    </form>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setForgotResetLink("");
                  setActiveView("login");
                }}
                className="w-full text-xs text-slate-500 hover:underline font-bold flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>العودة لتسجيل الدخول</span>
              </button>
            </div>
          </div>
        )}

        {/* --- 7. STUDENT PANEL --- */}
        {activeView === "student_panel" && user && (
          <StudentDashboard 
            user={user}
            t={t}
            lang={lang}
            onSelectCourse={(courseId) => {
              setActiveCourseId(courseId);
              setActiveView("classroom");
            }}
            showMessage={showMessage}
          />
        )}

        {/* --- 8. ADMIN PANEL --- */}
        {activeView === "admin_panel" && user && user.role === "admin" && (
          <AdminDashboard 
            user={user}
            t={t}
            lang={lang}
            showMessage={showMessage}
            onRefreshSettings={loadPlatformSettings}
          />
        )}

        {/* --- 9. CLASSROOM / COURSE LESSON PLAYER --- */}
        {activeView === "classroom" && user && activeCourseId !== null && (
          <CourseLessons 
            user={user}
            courseId={activeCourseId}
            t={t}
            lang={lang}
            onBackToDashboard={() => setActiveView("student_panel")}
            showMessage={showMessage}
          />
        )}

      </main>

      {/* Floating Contact Us Widget */}
      <div className="fixed bottom-20 lg:bottom-6 left-6 z-50 flex flex-col items-start gap-2.5">
        {/* Contact Menu Popover */}
        {isContactMenuOpen && (
          <div className="bg-[#002025] text-white rounded-2xl shadow-2xl p-4 w-56 border border-[#003c43] flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <p className="text-xs text-slate-300 font-bold text-center border-b border-[#003c43] pb-2">
              تواصل معنا مباشرة عبر:
            </p>
            
            {/* WhatsApp Option */}
            <a 
              href={`https://wa.me/964${settings.phone.slice(1)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl font-bold text-xs transition-all duration-200 group justify-start"
              onClick={() => setIsContactMenuOpen(false)}
            >
              <span className="p-1.5 bg-[#25D366] text-white rounded-lg group-hover:scale-110 transition-transform">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.953 11.91 1.953c-5.44 0-9.866 4.372-9.87 9.802 0 1.972.522 3.896 1.513 5.61l-.99 3.613 3.732-.969zm13.367-7.981c-.301-.15-1.78-.878-2.056-.978-.275-.1-.475-.15-.675.15-.2.3-.775.978-.95 1.178-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.794-1.49-1.775-1.665-2.075-.175-.3-.018-.463.13-.612.134-.133.301-.35.451-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.493-.51-.675-.52-.172-.007-.368-.007-.567-.007-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.112 4.521.714.309 1.272.494 1.707.633.717.228 1.368.196 1.884.119.575-.085 1.78-.728 2.03-1.43.25-.702.25-1.3.175-1.43-.075-.125-.275-.2-.575-.35z" />
                </svg>
              </span>
              <span>واتساب (WhatsApp)</span>
            </a>

            {/* Telegram Option */}
            <a 
              href="https://t.me/BoostUp3" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] rounded-xl font-bold text-xs transition-all duration-200 group justify-start"
              onClick={() => setIsContactMenuOpen(false)}
            >
              <span className="p-1.5 bg-[#0088cc] text-white rounded-lg group-hover:scale-110 transition-transform">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.02-.27 0-.12.02-1.95 1.23-5.51 3.63-.52.36-.97.53-1.33.52-.4-.01-1.18-.23-1.75-.41-.7-.23-1.26-.35-1.21-.74.03-.2.3-.41.82-.62 3.2-1.39 5.34-2.31 6.42-2.76 3.05-1.27 3.68-1.49 4.1-.15z" />
                </svg>
              </span>
              <span>تليجرام (Telegram)</span>
            </a>
          </div>
        )}

        {/* Clear, descriptive, gorgeous Floating Button */}
        <button
          onClick={() => setIsContactMenuOpen(!isContactMenuOpen)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 text-white font-extrabold text-sm select-none border border-[#0ca5b0]/30 ${
            isContactMenuOpen 
              ? "bg-[#002025] hover:bg-[#003c43] shadow-inner" 
              : "bg-[#0ca5b0] hover:bg-[#0a8b94] hover:shadow-[#0ca5b0]/30"
          }`}
          style={{ direction: "rtl" }}
        >
          {isContactMenuOpen ? (
            <>
              <X className="h-4.5 w-4.5" />
              <span>إغلاق</span>
            </>
          ) : (
            <>
              <MessageCircle className="h-4.5 w-4.5 fill-current animate-pulse" />
              <span>تواصل معنا</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile Floating Bottom Navigation Bar (Screenshot 2 & 3) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#002025] text-slate-400 border-t border-[#003c43] flex justify-around py-2.5 px-1 shadow-2xl" dir="rtl">
        {[
          { view: "home", label: "الرئيسية", icon: GraduationCap },
          { view: "courses", label: "الكورسات", icon: BookOpen },
          { view: "verify_certificate", label: "التحقق", icon: ShieldCheck },
          { view: "trainers", label: "المدربون", icon: Users },
          { view: "articles", label: "دروس", icon: FileText },
          { view: "events", label: "الفعاليات", icon: Calendar }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${
                isActive ? "text-[#0ca5b0] font-black scale-105" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-5.5 w-5.5 ${isActive ? "stroke-2" : "stroke-1.5"}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer (Screenshot 2) */}
      <footer className="bg-[#002025] text-slate-300 pt-16 pb-28 lg:pb-16 border-t border-[#003c43] text-right text-xs" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            
            {/* Column 1: Brand details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-start">
                <div className="p-2 bg-gradient-to-br from-[#0ca5b0] to-[#086c7c] text-white rounded-xl shadow-md">
                  <Brain className="h-5.5 w-5.5" />
                </div>
                <span className="text-lg font-black text-white tracking-tight">{settings.site_name || "BoostUp"}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                أكاديمية BoostUp منصة تدريبية رائدة متخصصة في تقديم البرامج التدريبية الاحترافية وتطوير المهارات القيادية والفنية بإشراف كبار الخبراء والمدربين المعتمدين.
              </p>
              <div className="flex items-center gap-2.5 pt-2">
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#001c20] hover:bg-[#0ca5b0] hover:text-white rounded-xl text-slate-400 transition">
                  <Instagram className="h-4.5 w-4.5" />
                </a>
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#001c20] hover:bg-[#0ca5b0] hover:text-white rounded-xl text-slate-400 transition">
                  <Facebook className="h-4.5 w-4.5" />
                </a>
                <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#001c20] hover:bg-[#0ca5b0] hover:text-white rounded-xl text-slate-400 transition">
                  <Linkedin className="h-4.5 w-4.5" />
                </a>
              </div>
            </div>

            {/* Column 2: Popular courses links */}
            <div className="space-y-4">
              <h4 className="text-white font-black text-sm border-r-2 border-[#0ca5b0] pr-2 leading-none">أقسام التدريب</h4>
              <ul className="space-y-2.5 text-slate-400 font-bold">
                <li><button onClick={() => setActiveView("courses")} className="hover:text-white transition">البرمجة والتقنية الحديثة</button></li>
                <li><button onClick={() => setActiveView("courses")} className="hover:text-white transition">التسويق وإدارة الأعمال</button></li>
                <li><button onClick={() => setActiveView("courses")} className="hover:text-white transition">اللغات والترجمة المعتمدة</button></li>
                <li><button onClick={() => setActiveView("courses")} className="hover:text-white transition">التطوير والتميز المهني</button></li>
              </ul>
            </div>

            {/* Column 3: Support resources */}
            <div className="space-y-4">
              <h4 className="text-white font-black text-sm border-r-2 border-[#0ca5b0] pr-2 leading-none">الدعم والمساعدة</h4>
              <ul className="space-y-2.5 text-slate-400 font-bold">
                <li><button onClick={() => setActiveView("home")} className="hover:text-white transition">الأسئلة الشائعة</button></li>
                <li><button onClick={() => setActiveView("about")} className="hover:text-white transition">عن الأكاديمية</button></li>
                <li><button onClick={() => setActiveView("verify_certificate")} className="hover:text-white transition">التحقق من الشهادات</button></li>
                <li><button onClick={() => setActiveView("articles")} className="hover:text-white transition">دروس تقوية ومقالات</button></li>
              </ul>
            </div>

            {/* Column 4: Contact details */}
            <div className="space-y-4">
              <h4 className="text-white font-black text-sm border-r-2 border-[#0ca5b0] pr-2 leading-none">اتصل بنا</h4>
              <ul className="space-y-4 text-slate-400 font-bold">
                <li>
                  <a href={`tel:${settings.phone}`} className="hover:text-white transition flex items-center gap-3 justify-start group">
                    <span className="p-2 bg-[#001c20] group-hover:bg-[#0ca5b0] text-slate-400 group-hover:text-white rounded-xl transition-all duration-300">
                      <Phone className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500 font-bold leading-none mb-1">الهاتف</span>
                      <span className="text-xs tracking-wider text-slate-300 group-hover:text-white transition">{settings.phone}</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/9647722665576" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-3 justify-start group">
                    <span className="p-2 bg-[#001c20] group-hover:bg-[#25D366] text-slate-400 group-hover:text-white rounded-xl transition-all duration-300">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.953 11.91 1.953c-5.44 0-9.866 4.372-9.87 9.802 0 1.972.522 3.896 1.513 5.61l-.99 3.613 3.732-.969zm13.367-7.981c-.301-.15-1.78-.878-2.056-.978-.275-.1-.475-.15-.675.15-.2.3-.775.978-.95 1.178-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.794-1.49-1.775-1.665-2.075-.175-.3-.018-.463.13-.612.134-.133.301-.35.451-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.493-.51-.675-.52-.172-.007-.368-.007-.567-.007-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.112 4.521.714.309 1.272.494 1.707.633.717.228 1.368.196 1.884.119.575-.085 1.78-.728 2.03-1.43.25-.702.25-1.3.175-1.43-.075-.125-.275-.2-.575-.35z" />
                      </svg>
                    </span>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500 font-bold leading-none mb-1">الواتساب</span>
                      <span className="text-xs text-slate-300 group-hover:text-white transition">راسلنا مباشرة</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href="https://t.me/BoostUp3" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-3 justify-start group">
                    <span className="p-2 bg-[#001c20] group-hover:bg-[#0088cc] text-slate-400 group-hover:text-white rounded-xl transition-all duration-300">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.02-.27 0-.12.02-1.95 1.23-5.51 3.63-.52.36-.97.53-1.33.52-.4-.01-1.18-.23-1.75-.41-.7-.23-1.26-.35-1.21-.74.03-.2.3-.41.82-.62 3.2-1.39 5.34-2.31 6.42-2.76 3.05-1.27 3.68-1.49 4.1-.15z" />
                      </svg>
                    </span>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500 font-bold leading-none mb-1">التلكرام</span>
                      <span className="text-xs text-slate-300 group-hover:text-white transition">@BoostUp3</span>
                    </div>
                  </a>
                </li>
                <li>
                  <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-3 justify-start group">
                    <span className="p-2 bg-[#001c20] group-hover:bg-[#E1306C] text-slate-400 group-hover:text-white rounded-xl transition-all duration-300">
                      <Instagram className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-500 font-bold leading-none mb-1">إنستغرام</span>
                      <span className="text-xs text-slate-300 group-hover:text-white transition">boostup.eng</span>
                    </div>
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-[#003c43]/60 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 font-bold text-[11px]">
            <p>© {new Date().getFullYear()} {settings.site_name || "BoostUp"} Academy. جميع الحقوق محفوظة.</p>
            <p>منصة تدريبية متميزة ومعتمدة</p>
          </div>
        </div>
      </footer>

      {/* --- EMAIL AUTH VERIFICATION MODAL --- */}
      {showAuthVerificationModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-8 border border-slate-100 space-y-6 relative overflow-hidden">
            <button
              onClick={() => {
                setShowAuthVerificationModal(false);
                setAuthVerificationCode("");
                setAuthSandboxCode("");
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-full">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">تفعيل حسابك عبر البريد</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                أدخل كود التحقق المكون من 6 أرقام لتفعيل حسابك على المنصة والتمكن من تسجيل الدخول والمتابعة.
              </p>
              <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-600">
                البريد: <span className="text-indigo-600 font-extrabold">{authVerificationEmail}</span>
              </div>
            </div>

            <form onSubmit={handleAuthVerify} className="space-y-4">
              <div>
                <label className="block text-center text-xs font-bold text-slate-500 mb-2">كود التحقق المستلم (6 أرقام):</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="------"
                  value={authVerificationCode}
                  onChange={(e) => setAuthVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-center font-mono font-black text-xl bg-slate-50 tracking-[0.5em] placeholder-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
              >
                تأكيد وتفعيل الحساب
              </button>
            </form>

            <div className="flex flex-col items-center justify-center space-y-1 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-bold">لم تصلك الرسالة؟</span>
              <button
                onClick={handleResendAuthCode}
                className="text-xs text-indigo-600 hover:underline font-extrabold"
              >
                إعادة إرسال كود التحقق
              </button>
            </div>

            {/* Sandbox Evaluation Assistance */}
            {authSandboxCode && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-1.5 shadow-xs">
                <p className="text-[10px] text-emerald-800 font-black flex items-center justify-center gap-1">
                  🛡️ نظام التحقق التلقائي الآمن:
                </p>
                <p className="text-xs text-emerald-950 font-extrabold">
                  رمز التحقق السريع:{" "}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(authSandboxCode);
                      showMessage("تم نسخ كود التحقق بنجاح!", "success");
                    }}
                    className="bg-white px-3 py-1 rounded-lg border border-emerald-200 font-mono tracking-widest text-sm font-black text-emerald-700 hover:bg-emerald-50 transition active:scale-95 cursor-pointer"
                    title="اضغط لنسخ الكود"
                  >
                    {authSandboxCode}
                  </button>
                </p>
                <p className="text-[9px] text-emerald-500 font-semibold leading-relaxed">
                  (لأمان حسابك، تم توليد الكود تلقائياً. اضغط على الرقم لنسخه وإدخاله مباشرة)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
