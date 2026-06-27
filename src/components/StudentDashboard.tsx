import React, { useState, useEffect } from "react";
import { BookOpen, Award, KeyRound, ArrowLeft, CheckCircle2, Trophy, Clock, Search, Printer, X, Globe } from "lucide-react";
import { User } from "../types";
import { TranslationKeys } from "../translations";

interface StudentDashboardProps {
  user: User;
  t: TranslationKeys;
  lang: "ar" | "en";
  onSelectCourse: (courseId: number) => void;
  showMessage: (msg: string, type: "success" | "error") => void;
}

interface EnrolledCourse {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: string;
  language: string;
  image?: string;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
}

interface StudentCertificate {
  id: number;
  certificate_id: string;
  issue_date: string;
  course_title: string;
}

export default function StudentDashboard({
  user,
  t,
  lang,
  onSelectCourse,
  showMessage
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"courses" | "available_courses" | "certificates" | "redeem">("courses");
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [activationCode, setActivationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState<StudentCertificate | null>(null);

  // States for available courses interaction
  const [inlineCodes, setInlineCodes] = useState<Record<number, string>>({});
  const [activatingCourseId, setActivatingCourseId] = useState<number | null>(null);

  // Load student data
  const loadStudentData = async () => {
    try {
      const coursesRes = await fetch(`/api/student/courses/${user.id}`);
      const coursesData = await coursesRes.json();
      setEnrolledCourses(coursesData);

      const allRes = await fetch("/api/courses");
      const allData = await allRes.json();
      setAllCourses(allData);

      const certsRes = await fetch(`/api/student/certificates/${user.id}`);
      const certsData = await certsRes.json();
      setCertificates(certsData);
    } catch (err) {
      console.error("Error loading student data:", err);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [user.id]);

  // Handle Redeem Code
  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/student/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, code: activationCode.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        showMessage(
          lang === "ar" 
            ? `تم تفعيل الدورة بنجاح: ${data.course_title}` 
            : `Course activated successfully: ${data.course_title}`,
          "success"
        );
        setActivationCode("");
        loadStudentData();
        setActiveTab("courses");
      } else {
        showMessage(data.error || "كود التفعيل غير صالح", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال بالخادم", "error");
    } finally {
      setLoading(false);
    }
  };

  // Quick Direct Subscription from Dashboard (Free/Instant unlock)
  const handleQuickEnroll = async (courseId: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/quick-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, course_id: courseId })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(
          lang === "ar" ? `تم الاشتراك بالدورة بنجاح: ${data.course_title}` : `Enrolled in course successfully: ${data.course_title}`,
          "success"
        );
        loadStudentData();
        setActiveTab("courses");
      } else {
        showMessage(data.error || "عذراً، فشل الاشتراك بالدورة", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال بالخادم", "error");
    } finally {
      setLoading(false);
    }
  };

  // Inline Activation with Code directly on the course card
  const handleInlineRedeem = async (courseId: number) => {
    const code = inlineCodes[courseId]?.trim();
    if (!code) {
      showMessage("يرجى إدخال رمز تفعيل الدورة أولاً", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/student/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, code })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(
          lang === "ar" ? `تم تفعيل الدورة بنجاح: ${data.course_title}` : `Course activated successfully: ${data.course_title}`,
          "success"
        );
        // Reset states
        setInlineCodes(prev => ({ ...prev, [courseId]: "" }));
        setActivatingCourseId(null);
        loadStudentData();
        setActiveTab("courses");
      } else {
        showMessage(data.error || "رمز التفعيل غير صالح أو تم استخدامه مسبقاً", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال بالخادم", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 mb-10 relative overflow-hidden shadow-xl shadow-slate-900/10">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="relative z-10">
          <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold tracking-wider uppercase">
            {t.student_panel}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-4 tracking-tight">
            {t.welcome}، <span className="text-indigo-400">{user.full_name}</span> ✨
          </h2>
          <p className="text-slate-300 mt-2 text-base max-w-2xl font-medium">
            مرحباً بك مجدداً في رحلتك التعليمية. تابع دروسك اليوم، طور مهاراتك الفنية والتسويقية واحصل على شهاداتك الموثقة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-2">
          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "courses"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>{t.my_courses}</span>
          </button>

          <button
            onClick={() => setActiveTab("available_courses")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "available_courses"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <Globe className="h-5 w-5" />
            <span>الدورات المتاحة</span>
          </button>

          <button
            onClick={() => setActiveTab("certificates")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "certificates"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <Award className="h-5 w-5" />
            <span>{t.my_certificates}</span>
          </button>

          <button
            onClick={() => setActiveTab("redeem")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "redeem"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <KeyRound className="h-5 w-5" />
            <span>{t.activate_course}</span>
          </button>
        </div>

        {/* Dynamic Content Panel */}
        <div className="lg:col-span-3">
          
          {/* 1. COURSES TAB */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
                <BookOpen className="h-5.5 w-5.5 text-indigo-600" />
                <span>{t.my_courses}</span>
              </h3>

              {enrolledCourses.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center shadow-xs">
                  <div className="inline-flex p-4 bg-amber-50 text-amber-600 rounded-2xl mb-4">
                    <KeyRound className="h-8 w-8" />
                  </div>
                  <p className="text-slate-600 font-bold mb-4">{t.no_courses}</p>
                  <button
                    onClick={() => setActiveTab("redeem")}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-xs"
                  >
                    {t.activate_course}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enrolledCourses.map((course) => (
                    <div 
                      key={course.id}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {course.image ? (
                          <img 
                            src={course.image} 
                            alt={course.title} 
                            className="w-full h-40 object-cover border-b border-slate-100" 
                          />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold">
                            BoostUp
                          </div>
                        )}
                        <div className="p-6">
                          <span className="text-[11px] font-black tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                            {course.duration}
                          </span>
                          <h4 className="font-extrabold text-slate-950 text-lg mt-3 line-clamp-1 leading-tight">
                            {course.title}
                          </h4>
                          <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>

                          {/* Progress Meter */}
                          <div className="mt-5">
                            <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5 font-bold">
                              <span>إجمالي الدروس: {course.total_lessons} / المكتملة: {course.completed_lessons}</span>
                              <span className="text-indigo-600">{course.progress_percent}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 transition-all duration-500" 
                                style={{ width: `${course.progress_percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 pt-0 border-t border-slate-100/50 mt-4 flex items-center justify-between">
                        <button
                          onClick={() => onSelectCourse(course.id)}
                          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                          <span>دخول قاعة الدرس</span>
                          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-0 rotate-180" />
                        </button>

                        {course.progress_percent === 100 && (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-black bg-emerald-50 px-2.5 py-1 rounded-md">
                            <CheckCircle2 className="h-4 w-4" />
                            مكتملة
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 1.5. AVAILABLE COURSES TAB */}
          {activeTab === "available_courses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
                  <Globe className="h-5.5 w-5.5 text-indigo-600" />
                  <span>الدورات المتاحة بالأكاديمية</span>
                </h3>
                <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1.5 rounded-full">
                  إجمالي دورات الأكاديمية: {allCourses.length}
                </span>
              </div>

              {allCourses.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center shadow-xs">
                  <div className="inline-flex p-4 bg-slate-50 text-slate-400 rounded-2xl mb-4">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <p className="text-slate-600 font-bold mb-2">لا توجد دورات مضافة حالياً</p>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                    سيقوم المشرف بإضافة المنهج الدراسي للدورات الجديدة قريباً!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allCourses.map((course) => {
                    const isEnrolled = enrolledCourses.some((e) => e.id === course.id);
                    return (
                      <div 
                        key={course.id}
                        className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
                      >
                        <div>
                          {course.image ? (
                            <img 
                              src={course.image} 
                              alt={course.title} 
                              className="w-full h-40 object-cover border-b border-slate-100" 
                            />
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold">
                              {course.title.substring(0, 15)}...
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-[11px] font-black tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                                {course.duration}
                              </span>
                              <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                                {course.price > 0 ? `$${course.price}` : "مجاناً"}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-slate-950 text-lg mt-3 line-clamp-1 leading-tight">
                              {course.title}
                            </h4>
                            <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                              {course.description}
                            </p>
                          </div>
                        </div>

                        <div className="p-6 pt-0">
                          {isEnrolled ? (
                            <div className="pt-3 border-t border-slate-100/50 mt-4 flex items-center justify-between">
                              <span className="flex items-center gap-1 text-emerald-600 text-xs font-black bg-emerald-50 px-2.5 py-1 rounded-md">
                                <CheckCircle2 className="h-4 w-4" />
                                أنت مشترك بالدورة
                              </span>
                              <button
                                onClick={() => onSelectCourse(course.id)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                              >
                                <span>دخول قاعة الدرس</span>
                                <ArrowLeft className="h-3 w-3 rtl:rotate-0 rotate-180" />
                              </button>
                            </div>
                          ) : (
                            <div className="mt-4 pt-3 border-t border-slate-100/50">
                              {activatingCourseId === course.id ? (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                                  <label className="block text-[10px] font-extrabold text-slate-600">أدخل رمز تفعيل الدورة:</label>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="BST-XXXX-XXXX"
                                      value={inlineCodes[course.id] || ""}
                                      onChange={(e) => setInlineCodes({ ...inlineCodes, [course.id]: e.target.value })}
                                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 uppercase"
                                    />
                                    <button
                                      onClick={() => handleInlineRedeem(course.id)}
                                      disabled={loading}
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-lg transition"
                                    >
                                      تفعيل
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => setActivatingCourseId(null)}
                                    className="text-[10px] text-slate-400 hover:underline block font-bold"
                                  >
                                    إلغاء التفعيل
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <button
                                    onClick={() => setActivatingCourseId(course.id)}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition shadow-sm border border-indigo-600 flex items-center justify-center gap-1.5"
                                  >
                                    تفعيل بكود الاشتراك
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. CERTIFICATES TAB */}
          {activeTab === "certificates" && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
                <Award className="h-5.5 w-5.5 text-indigo-600" />
                <span>{t.my_certificates}</span>
              </h3>

              {certificates.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center shadow-xs">
                  <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <p className="text-slate-600 font-bold mb-2">لا توجد شهادات صادرة بعد</p>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                    أكمل جميع محاضرات ودروس أي دورة تدريبية بنسبة إنجاز 100% لتوليد وتحميل شهادتك المعتمدة فوراً.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.map((cert) => (
                    <div 
                      key={cert.id}
                      className="bg-white rounded-2xl border-2 border-slate-100 p-6 shadow-xs relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-16 h-16 bg-amber-500/10 rounded-full" />
                      <div>
                        <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-wider bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
                          <Trophy className="h-4 w-4" />
                          <span>شهادة تفوق معتمدة</span>
                        </div>
                        <h4 className="font-extrabold text-slate-950 text-base mt-4 leading-snug">
                          {cert.course_title}
                        </h4>
                        <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-semibold">
                          <p className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>تاريخ الإصدار: {cert.issue_date}</span>
                          </p>
                          <p className="font-mono text-[11px] bg-slate-50 px-2 py-1 rounded w-fit text-slate-500">
                            ID: {cert.certificate_id}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Search className="h-3.5 w-3.5" />
                          <span>عرض الشهادة الرقمية</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. REDEEM CODE TAB */}
          {activeTab === "redeem" && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
                <KeyRound className="h-5.5 w-5.5 text-indigo-600" />
                <span>{t.activate_course}</span>
              </h3>

              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs max-w-xl">
                <form onSubmit={handleRedeem} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {t.enter_code}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="BST-XXXXX-XXXX"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-center font-mono font-bold tracking-widest text-lg bg-slate-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? "تجري المعالجة..." : t.activate_btn}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-slate-700">📌 كيف يعمل كود التفعيل؟</p>
                  <p>1. قم بشراء أو الحصول على كود تفعيل خاص بالدورة التدريبية من إدارة الأكاديمية.</p>
                  <p>2. أدخل الكود المكون من حروف وأرقام في المربع أعلاه بدقة.</p>
                  <p>3. اضغط على "تفعيل" لتفتح الدورة في حسابك وتتمكن من متابعة الدروس مباشرة ومدى الحياة.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* --- PRESTIGE CERTIFICATE POPUP MODAL --- */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl relative border-4 border-amber-600/20">
            
            {/* Close */}
            <button 
              onClick={() => setSelectedCert(null)}
              className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition text-slate-600 z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Digital Certificate Sheet */}
            <div className="p-2 sm:p-4 bg-slate-100 flex justify-center">
              {selectedCert.course_cert_template ? (
                /* Custom template uploaded by Admin */
                <div 
                  id="certificate-print-area"
                  className="relative w-full aspect-[1.414/1] max-w-3xl bg-white shadow-lg overflow-hidden rounded-xl border border-slate-200 select-none flex flex-col justify-between p-8 sm:p-12 text-center"
                  style={{
                    backgroundImage: `url(${selectedCert.course_cert_template})`,
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
                      {user.full_name}
                    </h3>

                    {/* Course completion text */}
                    <div className="space-y-1 bg-white/80 px-5 py-2 rounded-xl backdrop-blur-xs border border-slate-100 max-w-lg shadow-3xs">
                      <p className="text-slate-600 text-[10px] sm:text-xs font-semibold leading-relaxed">
                        لاجتيازه بنجاح وتفوق الدورة التدريبية المعتمدة:
                      </p>
                      <h4 className="text-xs sm:text-base md:text-lg font-extrabold text-blue-900 leading-snug">
                        « {selectedCert.course_title} »
                      </h4>
                    </div>

                    {/* Footer stats: Code and Date */}
                    <div className="w-full flex justify-between items-end px-[5%] mt-auto pt-4 pb-2">
                      {/* Date */}
                      <div className="text-right bg-white/95 p-2 rounded-xl backdrop-blur-xs border border-slate-150 shadow-3xs min-w-[120px]">
                        <p className="text-[9px] text-slate-400 font-bold">تاريخ الإصدار</p>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedCert.issue_date}</p>
                      </div>

                      {/* Seal / Emblem */}
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-4 border-amber-600/30 flex items-center justify-center text-amber-800 text-[8px] sm:text-[10px] font-black rotate-12 bg-white/90 shadow-xs">
                        APPROVED
                      </div>

                      {/* Certificate Code */}
                      <div className="text-left bg-white/95 p-2 rounded-xl backdrop-blur-xs border border-slate-150 shadow-3xs min-w-[140px]">
                        <p className="text-[9px] text-slate-400 font-bold">كود التحقق والتوثيق</p>
                        <p className="text-xs font-mono font-black text-slate-800 mt-0.5">{selectedCert.certificate_id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Default Luxury Template */
                <div 
                  id="certificate-print-area"
                  className="w-full p-8 sm:p-12 text-center bg-[#faf8f5] relative border-8 border-double border-amber-800/10 rounded-xl m-2"
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
                      {user.full_name}
                    </h3>

                    <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed mt-4 font-medium">
                      {t.cert_title_text}
                    </p>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-indigo-900 px-4">
                      « {selectedCert.course_title} »
                    </h4>

                    <div className="pt-8 grid grid-cols-2 gap-4 max-w-md mx-auto text-xs text-slate-600 font-bold border-t border-amber-800/10 mt-6">
                      <div>
                        <p className="text-amber-850">{t.cert_id_text}</p>
                        <p className="font-mono text-slate-900 text-[13px] mt-1 bg-white px-2 py-1 rounded border border-amber-800/10 w-fit mx-auto">
                          {selectedCert.certificate_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-amber-850">{t.cert_date_text}</p>
                        <p className="text-slate-900 mt-1 bg-white px-3 py-1 rounded border border-amber-800/10 w-fit mx-auto">
                          {selectedCert.issue_date}
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

            {/* Print action footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة الشهادة الرسمية</span>
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
