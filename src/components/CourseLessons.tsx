import React, { useState, useEffect } from "react";
import { BookOpen, ArrowRight, PlayCircle, CheckCircle2, Award, ChevronLeft, Tv, Trophy } from "lucide-react";
import { User, Lesson, Course } from "../types";
import { TranslationKeys } from "../translations";

interface CourseLessonsProps {
  user: User;
  courseId: number;
  t: TranslationKeys;
  lang: "ar" | "en";
  onBackToDashboard: () => void;
  showMessage: (msg: string, type: "success" | "error") => void;
}

export default function CourseLessons({
  user,
  courseId,
  t,
  lang,
  onBackToDashboard,
  showMessage
}: CourseLessonsProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [celebrateCert, setCelebrateCert] = useState<{ active: boolean; code: string } | null>(null);

  const loadCourseLessons = async () => {
    try {
      // Fetch specific course details
      const coursesRes = await fetch("/api/courses");
      const coursesData: Course[] = await coursesRes.json();
      const specificCourse = coursesData.find(c => c.id === courseId);
      if (specificCourse) setCourse(specificCourse);

      // Fetch lessons
      const lessonsRes = await fetch("/api/lessons");
      const lessonsData: Lesson[] = await lessonsRes.json();
      const courseLessons = lessonsData.filter(l => l.course_id === courseId);
      setLessons(courseLessons);

      // Fetch completed lessons & calculate progress
      const progressRes = await fetch(`/api/student/courses/${user.id}`);
      const progressData = await progressRes.json();
      const currentCourseProgress = progressData.find((p: any) => p.id === courseId);
      
      if (currentCourseProgress) {
        setProgressPercent(currentCourseProgress.progress_percent);
      }

      // Load specific student completed lessons record from the real database endpoint
      const completedRes = await fetch(`/api/student/completed-lessons/${user.id}/${courseId}`);
      if (completedRes.ok) {
        const completedIds = await completedRes.json();
        setCompletedLessonIds(completedIds);
      }
    } catch (err) {
      console.error("Error loading classroom details:", err);
    }
  };

  useEffect(() => {
    loadCourseLessons();
  }, [courseId, user.id]);

  // Handle setting active lesson & marking it locally as completed if needed
  useEffect(() => {
    if (lessons.length > 0 && !activeLesson) {
      setActiveLesson(lessons[0]);
    }
  }, [lessons, activeLesson]);

  // Submit complete lesson
  const handleCompleteLesson = async () => {
    if (!activeLesson) return;

    try {
      const res = await fetch("/api/student/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, lesson_id: activeLesson.id })
      });

      const data = await res.json();
      if (res.ok) {
        showMessage(
          lang === "ar" ? "تم تسجيل إنجاز الدرس بنجاح!" : "Lesson completed successfully!",
          "success"
        );
        
        // Add to local completed state
        if (!completedLessonIds.includes(activeLesson.id)) {
          setCompletedLessonIds([...completedLessonIds, activeLesson.id]);
        }

        // Set progress
        setProgressPercent(data.percentage);

        // Check for certificate earned celebration
        if (data.certificateGenerated) {
          setCelebrateCert({ active: true, code: data.certificate_id });
        }

        // Auto transition to next lesson if available
        const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex < lessons.length - 1) {
          setActiveLesson(lessons[currentIndex + 1]);
        }
      }
    } catch (err) {
      showMessage("عذراً، فشل تحديث تقدّمك بالدرس", "error");
    }
  };

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        جاري تحميل قاعة الدرس التدريبية...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Classroom Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToDashboard}
            className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition shadow-xs flex items-center justify-center gap-2 font-bold text-xs"
          >
            <ArrowRight className="h-4.5 w-4.5 rtl:rotate-0 rotate-180" />
            <span>العودة للوحة التحكم</span>
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {course.title}
            </h2>
            <span className="text-xs text-slate-500 font-semibold mt-1 block">
              منهج دراسي متاح مدى الحياة
            </span>
          </div>
        </div>

        {/* Course Progress Header widget */}
        <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 w-fit">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 block">إنجازك العام بالدورة</span>
            <span className="text-base font-black text-indigo-600 mt-0.5 block">{progressPercent}%</span>
          </div>
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Video Player & completion controls */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <div className="space-y-6">
              {/* Responsive Video frame wrapper */}
              <div className="aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-lg border border-slate-900 flex items-center justify-center relative">
                {activeLesson.video_type === "youtube" ? (
                  <iframe
                    title={activeLesson.title}
                    src={activeLesson.video_url}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video 
                    src={activeLesson.video_url} 
                    controls 
                    className="w-full h-full" 
                  />
                )}
              </div>

              {/* Lesson details & completion */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                      المحاضرة رقم {activeLesson.lesson_order}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-950 mt-3 leading-tight">
                      {activeLesson.title}
                    </h3>
                  </div>

                  <button
                    onClick={handleCompleteLesson}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition shadow-md shadow-indigo-500/10 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>{t.complete_lesson}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-400">
              يرجى اختيار درس لبدء المشاهدة ومتابعة التعليم.
            </div>
          )}
        </div>

        {/* Right: Interactive Lesson list */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-4">
          <h4 className="text-sm font-black text-slate-950 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Tv className="h-4.5 w-4.5 text-indigo-600" />
            <span>{t.lessons_title}</span>
          </h4>

          {lessons.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-6">قريباً سيتم إضافة دروس هذه الدورة.</p>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {lessons.map((lesson, idx) => {
                const isActive = activeLesson?.id === lesson.id;
                const isCompleted = completedLessonIds.includes(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl text-right font-bold text-xs transition-all duration-150 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                        : "text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-1.5 rounded-lg flex items-center justify-center ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>
                        <PlayCircle className="h-3.5 w-3.5" />
                      </span>
                      <span className="line-clamp-1">{lesson.title}</span>
                    </div>

                    {isCompleted ? (
                      <CheckCircle2 className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? "text-white" : "text-emerald-500"}`} />
                    ) : (
                      <ChevronLeft className={`h-4 w-4 opacity-40 rtl:rotate-0 rotate-180`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* --- EXCITING CERTIFICATE EARNED CELEBRATION MODAL --- */}
      {celebrateCert?.active && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-2xl p-8 text-center border-4 border-amber-500 shadow-2xl relative overflow-hidden">
            {/* Confetti effect background shape */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-500/15 rounded-full blur-xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-indigo-500/15 rounded-full blur-xl" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex p-4 bg-amber-100 text-amber-700 rounded-full animate-bounce">
                <Trophy className="h-12 w-12" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                تهانينا الحارة! 🎉🏆
              </h2>
              <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                لقد تمكنت من إنجاز جميع المحاضرات بنجاح وإتمام متطلبات الدورة بنسبة <span className="text-indigo-600 font-extrabold">100%</span>. تم توليد شهادتك المعتمدة وحفظها في ملفك الشخصي بالمنصة.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-bold text-amber-900 max-w-sm mx-auto">
                <p className="uppercase tracking-wider">رقم كود الشهادة الموثقة</p>
                <p className="font-mono text-lg mt-1 tracking-widest text-amber-950 select-all">{celebrateCert.code}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <button
                  onClick={() => {
                    setCelebrateCert(null);
                    onBackToDashboard();
                  }}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Award className="h-4.5 w-4.5" />
                  <span>الذهاب لتحميل شهاداتي</span>
                </button>
                <button
                  onClick={() => setCelebrateCert(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  متابعة المشاهدة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
