import React, { useState, useEffect } from "react";
import { 
  Users, BookOpen, UserCheck, FileText, KeyRound, Settings as SettingsIcon,
  PlusCircle, Database, HelpCircle, CheckCircle, Clock, Trash2, ShieldAlert, Edit, X
} from "lucide-react";
import { User, Trainer, Course, Settings, EnrollmentCode, Event } from "../types";
import { TranslationKeys } from "../translations";

interface AdminDashboardProps {
  user: User;
  t: TranslationKeys;
  lang: "ar" | "en";
  showMessage: (msg: string, type: "success" | "error") => void;
  onRefreshSettings: () => void;
}

interface Stats {
  studentsCount: number;
  coursesCount: number;
  trainersCount: number;
  articlesCount: number;
  codesCount: number;
  eventsCount?: number;
}

export default function AdminDashboard({
  user,
  t,
  lang,
  showMessage,
  onRefreshSettings
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "courses" | "lessons" | "trainers" | "articles" | "events" | "codes" | "settings">("stats");
  const [stats, setStats] = useState<Stats>({ studentsCount: 0, coursesCount: 0, trainersCount: 0, articlesCount: 0, codesCount: 0, eventsCount: 0 });
  
  // Data lists
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<Settings>({
    site_name: "", phone: "", telegram: "", instagram: "", linkedin: "", facebook: "", about_text: ""
  });

  // Course Form State
  const [courseForm, setCourseForm] = useState({ title: "", description: "", price: "", duration: "", language: "العربية", trainer_id: "", image: "", cert_template_image: "" });
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  // Event Form State
  const [eventForm, setEventForm] = useState({ title: "", description: "", image: "", is_free: true, category: "", date: "", time: "", registration_link: "" });
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  // Lesson Form State
  const [lessonForm, setLessonForm] = useState({ course_id: "", title: "", video_type: "youtube" as "youtube" | "upload", video_url: "", lesson_order: "1" });
  // Trainer Form State
  const [trainerForm, setTrainerForm] = useState({ full_name: "", job_title: "", bio: "", photo: "" });
  // Article Form State
  const [articleForm, setArticleForm] = useState({ title: "", content: "", image: "" });
  // Code Generator Form State
  const [codeForm, setCodeForm] = useState({ course_id: "", quantity: "5" });

  const [videoUploading, setVideoUploading] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            fileData: fileData
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setLessonForm(prev => ({
            ...prev,
            video_url: data.url
          }));
          showMessage(lang === "ar" ? "تم رفع ملف الفيديو بنجاح وتعبئة الرابط تلقائياً!" : "Video file uploaded successfully and URL auto-filled!", "success");
        } else {
          showMessage(data.error || "عذراً، فشل رفع الفيديو", "error");
        }
        setVideoUploading(false);
      };
      reader.onerror = () => {
        showMessage("خطأ أثناء قراءة ملف الفيديو من الجهاز", "error");
        setVideoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      showMessage("فشل الاتصال بالخادم لرفع الفيديو", "error");
      setVideoUploading(false);
    }
  };

  const [certUploading, setCertUploading] = useState(false);

  const handleCertTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCertUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            fileData: fileData
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (target === 'new') {
            setCourseForm(prev => ({
              ...prev,
              cert_template_image: data.url
            }));
          } else {
            setEditingCourse((prev: any) => ({
              ...prev,
              cert_template_image: data.url
            }));
          }
          showMessage(lang === "ar" ? "تم رفع قالب الشهادة بنجاح!" : "Certificate template uploaded successfully!", "success");
        } else {
          showMessage(data.error || "عذراً، فشل رفع القالب", "error");
        }
        setCertUploading(false);
      };
      reader.onerror = () => {
        showMessage("خطأ أثناء قراءة ملف القالب", "error");
        setCertUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      showMessage("فشل الاتصال بالخادم لرفع القالب", "error");
      setCertUploading(false);
    }
  };

  const loadData = async () => {
    try {
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      const coursesRes = await fetch("/api/courses");
      const coursesData = await coursesRes.json();
      setCourses(coursesData);

      const trainersRes = await fetch("/api/trainers");
      const trainersData = await trainersRes.json();
      setTrainers(trainersData);

      const studentsRes = await fetch("/api/admin/students");
      const studentsData = await studentsRes.json();
      setStudents(studentsData);

      const codesRes = await fetch("/api/enrollment-codes");
      const codesData = await codesRes.json();
      setCodes(codesData);

      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      setSettings(settingsRes.ok ? settingsData : settings);

      const eventsRes = await fetch("/api/events");
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }
    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit Add Course
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.description) return;

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseForm)
      });
      if (res.ok) {
        showMessage("تم إضافة الدورة التدريبية بنجاح", "success");
        setCourseForm({ title: "", description: "", price: "", duration: "", language: "العربية", trainer_id: "", image: "", cert_template_image: "" });
        loadData();
      } else {
        const d = await res.json();
        showMessage(d.error || "خطأ في الإضافة", "error");
      }
    } catch (err) {
      showMessage("فشل الإرسال", "error");
    }
  };

  // Delete Course Handler
  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذه الدورة وكل الدروس والأكواد التابعة لها نهائياً؟")) return;

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMessage(data.message || "تم حذف الدورة بنجاح", "success");
        loadData();
      } else {
        showMessage(data.error || "عذراً، فشل حذف الدورة", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال بالخادم لحذف الدورة", "error");
    }
  };

  // Submit Edit Course
  const handleEditCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editingCourse.title || !editingCourse.description) return;

    try {
      const res = await fetch(`/api/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCourse)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMessage("تم تحديث معلومات الدورة التدريبية بنجاح", "success");
        setEditingCourse(null);
        loadData();
      } else {
        showMessage(data.error || "خطأ في التحديث", "error");
      }
    } catch (err) {
      showMessage("فشل تحديث الدورة التدريبية", "error");
    }
  };

  // Submit Add Lesson
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.course_id || !lessonForm.title || !lessonForm.video_url) return;

    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessonForm)
      });
      if (res.ok) {
        showMessage("تم إضافة المحاضرة/الدرس بنجاح", "success");
        setLessonForm({ course_id: "", title: "", video_type: "youtube", video_url: "", lesson_order: "1" });
        loadData();
      } else {
        const d = await res.json();
        showMessage(d.error || "خطأ في الإضافة", "error");
      }
    } catch (err) {
      showMessage("فشل الإرسال", "error");
    }
  };

  // Submit Add Trainer
  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerForm.full_name) return;

    try {
      const res = await fetch("/api/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trainerForm)
      });
      if (res.ok) {
        showMessage("تم تسجيل المدرب بنجاح بالمنظومة", "success");
        setTrainerForm({ full_name: "", job_title: "", bio: "", photo: "" });
        loadData();
      } else {
        const d = await res.json();
        showMessage(d.error || "خطأ في الإضافة", "error");
      }
    } catch (err) {
      showMessage("فشل الإرسال", "error");
    }
  };

  // Submit Add Article
  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title || !articleForm.content) return;

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleForm)
      });
      if (res.ok) {
        showMessage("تم نشر المقال التعليمي بنجاح", "success");
        setArticleForm({ title: "", content: "", image: "" });
        loadData();
      } else {
        const d = await res.json();
        showMessage(d.error || "خطأ في الإضافة", "error");
      }
    } catch (err) {
      showMessage("فشل الإرسال", "error");
    }
  };

  // Submit Add Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.description) return;

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm)
      });
      if (res.ok) {
        showMessage("تم إضافة الفعالية بنجاح", "success");
        setEventForm({ title: "", description: "", image: "", is_free: true, category: "", date: "", time: "", registration_link: "" });
        loadData();
      } else {
        const d = await res.json();
        showMessage(d.error || "خطأ في الإضافة", "error");
      }
    } catch (err) {
      showMessage("فشل الإرسال", "error");
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذه الفعالية نهائياً؟")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMessage(data.message || "تم حذف الفعالية بنجاح", "success");
        loadData();
      } else {
        showMessage(data.error || "عذراً، فشل حذف الفعالية", "error");
      }
    } catch (err) {
      showMessage("فشل الاتصال بالخادم لحذف الفعالية", "error");
    }
  };

  // Submit Edit Event
  const handleEditEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.title || !editingEvent.description) return;

    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEvent)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMessage("تم تحديث معلومات الفعالية بنجاح", "success");
        setEditingEvent(null);
        loadData();
      } else {
        showMessage(data.error || "خطأ في التحديث", "error");
      }
    } catch (err) {
      showMessage("فشل تحديث الفعالية", "error");
    }
  };

  // Submit Settings Edit
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showMessage("تم تحديث وحفظ إعدادات المنصة وهوية الأكاديمية بنجاح", "success");
        onRefreshSettings();
        loadData();
      }
    } catch (err) {
      showMessage("فشل تحديث الإعدادات", "error");
    }
  };

  // Submit Bulk Activation Code Generator
  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeForm.course_id || !codeForm.quantity) {
      showMessage("يرجى اختيار الدورة وتحديد الكمية", "error");
      return;
    }

    try {
      const res = await fetch("/api/enrollment-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(codeForm)
      });
      if (res.ok) {
        showMessage(`تم تفعيل وتوليد ${codeForm.quantity} أكواد بنجاح ومزاجية عالية!`, "success");
        loadData();
      } else {
        const d = await res.json();
        showMessage(d.error || "فشل التوليد", "error");
      }
    } catch (err) {
      showMessage("فشل التوليد", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome & Admin Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
            {t.admin_panel}
          </span>
          <h2 className="text-2xl font-black text-slate-950 mt-2">
            لوحة الإدارة الشاملة للعمليات 🛠
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            إدارة الدورات والمحاضرات، تسجيل المدربين، توليد أكواد تفعيل وتحديث هوية الأكاديمية بالكامل.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-2">
          <Database className="h-4.5 w-4.5 text-blue-600" />
          <span>قاعدة البيانات: نشطة ومتصلة محلياً</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Admin Navigation Sidebar Tabs */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-2">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "stats" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <Users className="h-5 w-5" />
            <span>نظرة عامة والطلاب</span>
          </button>

          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "courses" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <PlusCircle className="h-5 w-5" />
            <span>{t.add_course_btn}</span>
          </button>

          <button
            onClick={() => setActiveTab("lessons")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "lessons" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>{t.add_lesson_btn}</span>
          </button>

          <button
            onClick={() => setActiveTab("trainers")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "trainers" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <UserCheck className="h-5 w-5" />
            <span>إدارة المدربين</span>
          </button>

          <button
            onClick={() => setActiveTab("articles")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "articles" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>إضافة المقالات</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "events" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <Clock className="h-5 w-5" />
            <span>إدارة الفعاليات وورش العمل</span>
          </button>

          <button
            onClick={() => setActiveTab("codes")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "codes" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <KeyRound className="h-5 w-5" />
            <span>توليد أكواد التفعيل</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
              activeTab === "settings" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15" : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            <span>إعدادات وهوية الأكاديمية</span>
          </button>
        </div>

        {/* Dynamic Admin View */}
        <div className="lg:col-span-3">
          
          {/* A. STATS & STUDENTS LIST */}
          {activeTab === "stats" && (
            <div className="space-y-8">
              {/* Stats Grid Cards */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: t.stats_students, val: stats.studentsCount, icon: Users, color: "text-blue-600 bg-blue-50" },
                  { label: t.stats_courses, val: stats.coursesCount, icon: BookOpen, color: "text-indigo-600 bg-indigo-50" },
                  { label: t.stats_trainers, val: stats.trainersCount, icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
                  { label: t.stats_articles, val: stats.articlesCount, icon: FileText, color: "text-violet-600 bg-violet-50" },
                  { label: "الفعاليات", val: stats.eventsCount || 0, icon: Clock, color: "text-rose-600 bg-rose-50" },
                  { label: t.stats_codes, val: stats.codesCount, icon: KeyRound, color: "text-amber-600 bg-amber-50" }
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center flex flex-col justify-between">
                      <div className={`p-3 rounded-xl mx-auto w-fit ${card.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-500 mt-3">{card.label}</h4>
                      <p className="text-2xl font-black text-slate-950 mt-1">{card.val}</p>
                    </div>
                  );
                })}
              </div>

              {/* Students Directory Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-950 flex items-center gap-2">
                    <Users className="h-5.5 w-5.5 text-blue-600" />
                    <span>{t.student_list}</span>
                  </h3>
                  <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-slate-600">
                    العدد: {students.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-black text-slate-500 uppercase tracking-wider">
                        <th className="p-4">{t.name_placeholder}</th>
                        <th className="p-4">{t.email_placeholder}</th>
                        <th className="p-4">{t.phone_label}</th>
                        <th className="p-4">الدورات المشترك بها</th>
                        <th className="p-4">{t.registered_at}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-extrabold text-slate-950">{student.full_name}</td>
                          <td className="p-4 font-mono text-xs">{student.email}</td>
                          <td className="p-4 font-mono text-xs">{student.phone || "-"}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-md">
                              {student.enrollmentsCount} دورة
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-500">{new Date(student.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* B. ADD COURSE */}
          {activeTab === "courses" && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-lg font-extrabold text-slate-950 mb-6 flex items-center gap-2">
                <PlusCircle className="h-5.5 w-5.5 text-blue-600" />
                <span>إضافة دورة تدريبية جديدة بالكامل</span>
              </h3>

              <form onSubmit={handleAddCourse} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الدورة التدريبية</label>
                    <input
                      type="text"
                      required
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      placeholder="مثال: دورة تطوير المواقع المتكاملة"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.duration_label}</label>
                    <input
                      type="text"
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                      placeholder="مثال: 15 ساعة"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف تفصيلي للدورة ومخرجاتها</label>
                  <textarea
                    required
                    rows={4}
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="محتويات الدورة المنهجية، المهارات التي سيكتسبها المشترك، وغيره..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">السعر بالدولار ($)</label>
                    <input
                      type="number"
                      value={courseForm.price}
                      onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                      placeholder="مثال: 59"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.trainer_label}</label>
                    <select
                      value={courseForm.trainer_id}
                      onChange={(e) => setCourseForm({ ...courseForm, trainer_id: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    >
                      <option value="">اختر المدرب</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>{t.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط صورة الغلاف الفني للدورة (اختياري)</label>
                    <input
                      type="text"
                      value={courseForm.image}
                      onChange={(e) => setCourseForm({ ...courseForm, image: e.target.value })}
                      placeholder="رابط مباشر للصورة"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>
                </div>

                {/* --- Certificate Background Template Section --- */}
                <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
                  <div className="text-right">
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      🖼️ قالب الشهادة المعتمدة للدورة (صورة الخلفية)
                    </label>
                    <p className="text-[10px] text-slate-500 font-semibold mb-3 leading-relaxed">
                      قم برفع قالب الشهادة (كصورة خلفية فارغة ومفتوحة التصميم)، وسيقوم النظام بطباعة وكتابة البيانات فوقها ديناميكياً (اسم الطالب، تاريخ التخرج، رمز الشهادة) لتبدو رسمية تماماً.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          id="cert-template-file-add"
                          onChange={(e) => handleCertTemplateUpload(e, 'new')}
                          className="hidden"
                        />
                        <label
                          htmlFor="cert-template-file-add"
                          className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 hover:border-blue-500 rounded-xl p-5 cursor-pointer hover:bg-slate-50 transition"
                        >
                          <span className="text-xs font-bold text-blue-600">
                            {certUploading ? "جاري رفع الملف..." : "📁 اختر أو اسحب ملف صورة القالب"}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">صيغة PNG أو JPG</span>
                        </label>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="أو ضع رابط صورة القالب هنا مباشرة"
                          value={courseForm.cert_template_image || ""}
                          onChange={(e) => setCourseForm({ ...courseForm, cert_template_image: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
                        />
                        {courseForm.cert_template_image && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-600 font-bold">✓ تم تعيين قالب الشهادة!</span>
                            <button
                              type="button"
                              onClick={() => setCourseForm({ ...courseForm, cert_template_image: "" })}
                              className="text-[10px] text-red-500 hover:underline mr-auto"
                            >
                              إزالة القالب
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-2 text-sm"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>{t.add_course_btn}</span>
                </button>
              </form>

              {/* --- CURRENT COURSES DIRECTORY & MANAGEMENT --- */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900">إدارة الدورات المتاحة حالياً ({courses.length})</h3>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">يمكنك تعديل أو حذف أي دورة، وحذف الدورة يحذف جميع كود تفعيلها والدروس التابعة لها تلقائياً.</p>
                  </div>
                </div>

                {courses.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    لا يوجد دورات مضافة حالياً. استخدم النموذج أعلاه لإضافة دورتك التدريبية الأولى!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course) => {
                      const trainer = trainers.find((tr) => tr.id === course.trainer_id);
                      return (
                        <div key={course.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 hover:border-slate-300 transition flex gap-4">
                          {course.image && (
                            <img
                              src={course.image}
                              alt={course.title}
                              className="w-16 h-16 rounded-xl object-cover bg-slate-200 flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="flex-grow space-y-1.5 min-w-0 text-right">
                            <h4 className="text-sm font-black text-slate-900 truncate" title={course.title}>
                              {course.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {course.description}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold">
                              <span>💰 {course.price} د.ع</span>
                              <span>⏱️ {course.duration}</span>
                              <span>🌐 {course.language}</span>
                              {trainer && <span className="text-blue-600">🧑‍🏫 {trainer.full_name}</span>}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 justify-center flex-shrink-0">
                            <button
                              onClick={() => setEditingCourse({ ...course })}
                              className="p-2 bg-white hover:bg-amber-50 text-amber-600 rounded-xl border border-slate-200 hover:border-amber-200 transition"
                              title="تعديل معلومات الدورة"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-xl border border-slate-200 hover:border-red-200 transition"
                              title="حذف الدورة"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* C. ADD LESSON */}
          {activeTab === "lessons" && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-lg font-extrabold text-slate-950 mb-6 flex items-center gap-2">
                <BookOpen className="h-5.5 w-5.5 text-blue-600" />
                <span>إضافة درس/محاضرة لمنهج دراسي معين</span>
              </h3>

              <form onSubmit={handleAddLesson} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.choose_course}</label>
                    <select
                      required
                      value={lessonForm.course_id}
                      onChange={(e) => setLessonForm({ ...lessonForm, course_id: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    >
                      <option value="">اختر الدورة المحددة</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.lesson_title_label}</label>
                    <input
                      type="text"
                      required
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="مثال: بناء أول صفحة بلغة HTML"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.video_type_label}</label>
                    <select
                      value={lessonForm.video_type}
                      onChange={(e) => setLessonForm({ ...lessonForm, video_type: e.target.value as "youtube" | "upload" })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    >
                      <option value="youtube">يوتيوب (YouTube Embed)</option>
                      <option value="upload">رابط فيديو مباشر (Direct MP4 URL)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.video_url_label}</label>
                    <input
                      type="text"
                      required
                      value={lessonForm.video_url}
                      onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                      placeholder={lessonForm.video_type === "youtube" ? "مثال: https://www.youtube.com/embed/dQw4w9WgXcQ" : "مثال: /uploads/video.mp4 أو رابط فيديو خارجي مباشر"}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 mb-3"
                    />
                    {lessonForm.video_type === "upload" && (
                      <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center">
                        <PlusCircle className="h-6 w-6 text-indigo-600 mb-1" />
                        <span className="text-xs text-slate-600 font-bold mb-2">أو اختر ملف فيديو لرفعه تلقائياً من جهازك:</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          disabled={videoUploading}
                          className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                        {videoUploading && (
                          <div className="mt-2 text-xs text-indigo-600 font-black animate-pulse">
                            جاري رفع ملف الفيديو إلى الخادم... يرجى عدم إغلاق الصفحة
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.lesson_order_label}</label>
                  <input
                    type="number"
                    required
                    value={lessonForm.lesson_order}
                    onChange={(e) => setLessonForm({ ...lessonForm, lesson_order: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-2 text-sm"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>{t.add_lesson_btn}</span>
                </button>
              </form>
            </div>
          )}

          {/* D. TRAINERS */}
          {activeTab === "trainers" && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-lg font-extrabold text-slate-950 mb-6 flex items-center gap-2">
                <UserCheck className="h-5.5 w-5.5 text-blue-600" />
                <span>تسجيل مدرب معتمد بالمنظومة</span>
              </h3>

              <form onSubmit={handleAddTrainer} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الرباعي الكامل للمدرب</label>
                    <input
                      type="text"
                      required
                      value={trainerForm.full_name}
                      onChange={(e) => setTrainerForm({ ...trainerForm, full_name: e.target.value })}
                      placeholder="مثال: أ. سيف الدين علي"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.job_title_label}</label>
                    <input
                      type="text"
                      value={trainerForm.job_title}
                      onChange={(e) => setTrainerForm({ ...trainerForm, job_title: e.target.value })}
                      placeholder="مثال: Senior Business & Marketing Consultant"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.bio_label}</label>
                  <textarea
                    rows={4}
                    value={trainerForm.bio}
                    onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
                    placeholder="موجز الخبرات المهنية والأماكن التي عمل بها والمواد التي يدربها..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-2 text-sm"
                >
                  <UserCheck className="h-5 w-5" />
                  <span>{t.add_trainer_btn}</span>
                </button>
              </form>
            </div>
          )}

          {/* E. ARTICLES */}
          {activeTab === "articles" && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-lg font-extrabold text-slate-950 mb-6 flex items-center gap-2">
                <FileText className="h-5.5 w-5.5 text-blue-600" />
                <span>نشر مقال أو إرشاد تعليمي بالمدونة</span>
              </h3>

              <form onSubmit={handleAddArticle} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان المقال التعليمي</label>
                  <input
                    type="text"
                    required
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    placeholder="مثال: 5 نصائح لاحتراف تسويق المحتوى الإلكتروني"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">محتوى وتفاصيل المقال بالكامل</label>
                  <textarea
                    required
                    rows={8}
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    placeholder="اكتب تفاصيل المقال، الشروحات، الأفكار وفوائده..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-2 text-sm"
                >
                  <FileText className="h-5 w-5" />
                  <span>نشر المقال وتعميمه</span>
                </button>
              </form>
            </div>
          )}

          {/* F2. EVENTS MANAGEMENT */}
          {activeTab === "events" && (
            <div className="space-y-8 text-right" dir="rtl">
              {/* Add New Event Form */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-lg font-extrabold text-slate-950 mb-6 flex items-center gap-2 justify-start">
                  <Clock className="h-5.5 w-5.5 text-blue-600" />
                  <span>إضافة فعاليات أو ورش عمل جديدة</span>
                </h3>

                <form onSubmit={handleAddEvent} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الفعالية</label>
                      <input
                        type="text"
                        required
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        placeholder="مثال: ورشة توعوية مجانية (سلامة الحرائق والأمان)"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">تصنيف الفعالية</label>
                      <input
                        type="text"
                        required
                        value={eventForm.category}
                        onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                        placeholder="مثال: الأمان والسلامة الصناعية"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">تفاصيل ومحاور الفعالية</label>
                    <textarea
                      required
                      rows={4}
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      placeholder="صف بالتفصيل محاور الفعالية، أهدافها، الجهة المنظمة، وغيرها..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الفعالية</label>
                      <input
                        type="date"
                        required
                        value={eventForm.date}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">توقيت الفعالية</label>
                      <input
                        type="text"
                        required
                        value={eventForm.time}
                        onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                        placeholder="مثال: الساعة 5:00 مساءً بتوقيت بغداد"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط صورة الغلاف الفني للفعالية (اختياري)</label>
                      <input
                        type="text"
                        value={eventForm.image}
                        onChange={(e) => setEventForm({ ...eventForm, image: e.target.value })}
                        placeholder="رابط مباشر للصورة أو اتركها فارغة لاستخدام الصورة الافتراضية"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط التسجيل/الحجز (اختياري)</label>
                      <input
                        type="text"
                        value={eventForm.registration_link}
                        onChange={(e) => setEventForm({ ...eventForm, registration_link: e.target.value })}
                        placeholder="مثال: رابط تليجرام أو نموذج قوقل"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-start">
                    <input
                      type="checkbox"
                      id="is_free_new"
                      checked={eventForm.is_free}
                      onChange={(e) => setEventForm({ ...eventForm, is_free: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_free_new" className="text-xs font-bold text-slate-700">ورشة مجانية بالكامل</label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-2 text-sm"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>إضافة ونشر الفعالية</span>
                  </button>
                </form>
              </div>

              {/* Current Events List */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-950 flex items-center gap-2 justify-start">
                    <Clock className="h-5.5 w-5.5 text-blue-600" />
                    <span>الفعاليات المنشورة حالياً</span>
                  </h3>
                  <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-slate-600">
                    الإجمالي: {events.length}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {events.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-bold">لا توجد فعاليات مسجلة في الوقت الحالي.</div>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 justify-start">
                          <img 
                            src={event.image || "https://images.unsplash.com/photo-1599740831464-5cbe1a14f09c?auto=format&fit=crop&q=80&w=1200"} 
                            alt={event.title} 
                            className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {event.category}
                            </span>
                            <h4 className="font-bold text-slate-900 mt-1">{event.title}</h4>
                            <p className="text-slate-500 text-xs mt-1 line-clamp-2 max-w-xl">{event.description}</p>
                            <p className="text-slate-400 text-[11px] mt-1 font-semibold">تاريخ: {event.date} | توقيت: {event.time} {event.is_free && "| مجانية"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            onClick={() => setEditingEvent(event)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="تعديل"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="حذف"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Edit Event Modal */}
              {editingEvent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 text-right" dir="rtl">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <h3 className="text-lg font-black text-slate-950 flex items-center gap-2 justify-start">
                        <Edit className="h-5.5 w-5.5 text-blue-600" />
                        <span>تعديل بيانات الفعالية</span>
                      </h3>
                      <button 
                        onClick={() => setEditingEvent(null)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                      >
                        <X className="h-6 w-6 text-slate-400" />
                      </button>
                    </div>

                    <form onSubmit={handleEditEventSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الفعالية</label>
                          <input
                            type="text"
                            required
                            value={editingEvent.title}
                            onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">تصنيف الفعالية</label>
                          <input
                            type="text"
                            required
                            value={editingEvent.category}
                            onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">تفاصيل ومحاور الفعالية</label>
                        <textarea
                          required
                          rows={4}
                          value={editingEvent.description}
                          onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الفعالية</label>
                          <input
                            type="date"
                            required
                            value={editingEvent.date}
                            onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">توقيت الفعالية</label>
                          <input
                            type="text"
                            required
                            value={editingEvent.time}
                            onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط صورة الغلاف</label>
                          <input
                            type="text"
                            value={editingEvent.image || ""}
                            onChange={(e) => setEditingEvent({ ...editingEvent, image: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط التسجيل/الحجز</label>
                          <input
                            type="text"
                            value={editingEvent.registration_link || ""}
                            onChange={(e) => setEditingEvent({ ...editingEvent, registration_link: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 text-right"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 justify-start">
                        <input
                          type="checkbox"
                          id="is_free_edit"
                          checked={editingEvent.is_free}
                          onChange={(e) => setEditingEvent({ ...editingEvent, is_free: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_free_edit" className="text-xs font-bold text-slate-700">ورشة مجانية بالكامل</label>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingEvent(null)}
                          className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition text-sm"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs text-sm"
                        >
                          حفظ التعديلات
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* F. BULK ACTIVATION CODES GENERATOR */}
          {activeTab === "codes" && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-lg font-extrabold text-slate-950 mb-4 flex items-center gap-2">
                  <KeyRound className="h-5.5 w-5.5 text-blue-600" />
                  <span>{t.bulk_codes}</span>
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  صمم الأكواد لبيان مدى الإقبال ومبيعات الكورسات. بعد إنتاجها، يحق للطلاب وضعها في حساباتهم لفتح الدورة المقابلة تلقائياً.
                </p>

                <form onSubmit={handleGenerateCodes} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.choose_course}</label>
                    <select
                      required
                      value={codeForm.course_id}
                      onChange={(e) => setCodeForm({ ...codeForm, course_id: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    >
                      <option value="">اختر الدورة المحددة</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.quantity}</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={codeForm.quantity}
                      onChange={(e) => setCodeForm({ ...codeForm, quantity: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold transition shadow-xs text-sm"
                  >
                    {t.generate_codes}
                  </button>
                </form>
              </div>

              {/* Codes utilization Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-950 flex items-center gap-2">
                    <KeyRound className="h-5.5 w-5.5 text-blue-600" />
                    <span>سجلات الأكواد المتوفرة والمستخدمة</span>
                  </h3>
                  <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-slate-600">
                    الإجمالي: {codes.length}
                  </span>
                </div>

                <div className="overflow-y-auto max-h-[350px]">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-black text-slate-500 uppercase tracking-wider">
                        <th className="p-4">الدورة المستهدفة</th>
                        <th className="p-4">كود التفعيل الفردي</th>
                        <th className="p-4">تاريخ التوليد</th>
                        <th className="p-4">حالة الاستخدام</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                      {codes.map((code) => (
                        <tr key={code.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-900">{code.course_title}</td>
                          <td className="p-4 font-mono text-xs font-bold text-blue-600 select-all bg-blue-50/20 px-2.5 py-1 rounded w-fit">{code.code}</td>
                          <td className="p-4 text-xs text-slate-500">{new Date(code.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            {code.is_used ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black bg-rose-50 text-rose-700" title={`بواسطة الطالب: ${code.used_by_name}`}>
                                <ShieldAlert className="h-3.5 w-3.5" />
                                <span>مستخدم ({code.used_by_name})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black bg-emerald-50 text-emerald-700">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>صالح ومتاح</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* G. SITE SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-lg font-extrabold text-slate-950 mb-6 flex items-center gap-2">
                <SettingsIcon className="h-5.5 w-5.5 text-blue-600" />
                <span>{t.site_settings}</span>
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.site_name_label}</label>
                    <input
                      type="text"
                      required
                      value={settings.site_name}
                      onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.phone_label}</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.telegram_label}</label>
                    <input
                      type="text"
                      value={settings.telegram}
                      onChange={(e) => setSettings({ ...settings, telegram: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">حساب إنستغرام (Instagram)</label>
                    <input
                      type="text"
                      value={settings.instagram}
                      onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">حساب فيسبوك (Facebook)</label>
                    <input
                      type="text"
                      value={settings.facebook}
                      onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">حساب لينكد إن (LinkedIn)</label>
                    <input
                      type="text"
                      value={settings.linkedin}
                      onChange={(e) => setSettings({ ...settings, linkedin: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.about_us_text_label}</label>
                  <textarea
                    rows={6}
                    value={settings.about_text}
                    onChange={(e) => setSettings({ ...settings, about_text: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-xs"
                >
                  {t.save_changes}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* --- EDIT COURSE MODAL --- */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative border border-slate-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">تعديل معلومات الدورة التدريبية</h3>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditCourseSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الدورة التدريبية</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>

                <div className="text-right">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">السعر بالدينار العراقي (أو 0 للمجانية)</label>
                  <input
                    type="number"
                    value={editingCourse.price}
                    onChange={(e) => setEditingCourse({ ...editingCourse, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>
              </div>

              <div className="text-right">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف تفصيلي عن محتوى الدورة وأهدافها</label>
                <textarea
                  required
                  rows={4}
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-right">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">مدة الدورة (مثال: 12 ساعة)</label>
                  <input
                    type="text"
                    value={editingCourse.duration}
                    onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>

                <div className="text-right">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">لغة الشرح والتقديم بالدورة</label>
                  <input
                    type="text"
                    value={editingCourse.language}
                    onChange={(e) => setEditingCourse({ ...editingCourse, language: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>

                <div className="text-right">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المدرب المسؤول عنها</label>
                  <select
                    value={editingCourse.trainer_id || ""}
                    onChange={(e) => setEditingCourse({ ...editingCourse, trainer_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                  >
                    <option value="">لا يوجد مدرب محدد</option>
                    {trainers.map((tr) => (
                      <option key={tr.id} value={tr.id}>{tr.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-right">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">رابط صورة الغلاف الفني للدورة (اختياري)</label>
                <input
                  type="text"
                  value={editingCourse.image || ""}
                  onChange={(e) => setEditingCourse({ ...editingCourse, image: e.target.value })}
                  placeholder="رابط مباشر للصورة"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50"
                />
              </div>

              {/* --- Certificate Background Template Section in Edit --- */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
                <div className="text-right">
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    🖼️ قالب الشهادة المعتمدة للدورة (صورة الخلفية)
                  </label>
                  <p className="text-[10px] text-slate-500 font-semibold mb-3 leading-relaxed">
                    قم برفع قالب الشهادة (كصورة خلفية فارغة ومفتوحة التصميم)، وسيقوم النظام بطباعة وكتابة البيانات فوقها ديناميكياً (اسم الطالب، تاريخ التخرج، رمز الشهادة) لتبدو رسمية تماماً.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        id="cert-template-file-edit"
                        onChange={(e) => handleCertTemplateUpload(e, 'edit')}
                        className="hidden"
                      />
                      <label
                        htmlFor="cert-template-file-edit"
                        className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 hover:border-blue-500 rounded-xl p-5 cursor-pointer hover:bg-slate-50 transition"
                      >
                        <span className="text-xs font-bold text-blue-600">
                          {certUploading ? "جاري رفع الملف..." : "📁 اختر أو اسحب ملف صورة القالب"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">صيغة PNG أو JPG</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="أو ضع رابط صورة القالب هنا مباشرة"
                        value={editingCourse.cert_template_image || ""}
                        onChange={(e) => setEditingCourse({ ...editingCourse, cert_template_image: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right"
                      />
                      {editingCourse.cert_template_image && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-600 font-bold">✓ تم تعيين قالب الشهادة!</span>
                          <button
                            type="button"
                            onClick={() => setEditingCourse({ ...editingCourse, cert_template_image: "" })}
                            className="text-[10px] text-red-500 hover:underline mr-auto"
                          >
                            إزالة القالب
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  إلغاء الأمر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
