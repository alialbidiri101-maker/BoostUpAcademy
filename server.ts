import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { 
  User, Trainer, Course, Lesson, Enrollment, 
  LessonProgress, Certificate, Article, FAQ, 
  Settings, EnrollmentCode, PasswordReset, Event
} from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Middleware to parse JSON bodies
app.use(express.json({ limit: "50mb" }));

// Type definition for DB
interface DatabaseSchema {
  users: User[];
  trainers: Trainer[];
  courses: Course[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  lesson_progress: LessonProgress[];
  certificates: Certificate[];
  articles: Article[];
  faqs: FAQ[];
  settings: Settings;
  enrollment_codes: EnrollmentCode[];
  password_resets: PasswordReset[];
  passwords: Record<string, string>; // email -> password (simulated for secure lookup)
  events: Event[];
}

// Initialize Firebase Admin with credentials inside the container
let firestore: Firestore | null = null;

try {
  let dbId = "";
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    dbId = config.firestoreDatabaseId || "";
  }
  
  if (getApps().length === 0) {
    initializeApp();
  }
  
  if (dbId) {
    firestore = getFirestore(dbId);
    console.log(`[Firebase] Initialized Firestore with Database ID: ${dbId}`);
  } else {
    firestore = getFirestore();
    console.log("[Firebase] Initialized Firestore with default database ID");
  }
} catch (error) {
  console.error("[Firebase] Failed to initialize Firebase Admin:", error);
}

// Helper to load database with seed data and synchronize from Firestore
async function loadDBFromFirestore(): Promise<DatabaseSchema> {
  const defaultDB: DatabaseSchema = {
    users: [
      { id: 1, full_name: "مدير الأكاديمية", email: "admin@boostup.com", role: "admin", created_at: new Date().toISOString() },
      { id: 2, full_name: "أحمد الطالب", email: "student@boostup.com", role: "student", created_at: new Date().toISOString() }
    ],
    passwords: {
      "admin@boostup.com": "admin123",
      "student@boostup.com": "student123"
    },
    trainers: [],
    courses: [],
    lessons: [],
    enrollments: [],
    lesson_progress: [],
    certificates: [],
    articles: [],
    faqs: [
      { id: 1, question: "كيف أحصل على الشهادة؟", answer: "بمجرد إكمالك لجميع دروس الدورة ومقاطع الفيديو بنجاح بنسبة إنجاز 100%، سيقوم النظام تلقائياً بإنشاء شهادة إتمام خاصة بك وتحميلها في لوحة حسابك." },
      { id: 2, question: "هل تتوفر الدورات مدى الحياة؟", answer: "نعم، بمجرد الاشتراك في الدورة أو تفعيلها باستخدام كود التفعيل، ستحصل على وصول غير محدود للمحتوى مدى الحياة في أي وقت ومن أي مكان." }
    ],
    settings: {
      site_name: "BoostUp Academy",
      phone: "07722665576",
      telegram: "@BoostUp3",
      instagram: "https://www.instagram.com/boostup.eng",
      linkedin: "http://www.linkedin.com/in/alboostup-academy2024",
      facebook: "https://www.facebook.com/profile.php?id=61565657222438&mibextid=ZbWKwL",
      about_text: "BoostUp Academy منصة تعليمية متكاملة توفر محتوى تدريبي احترافي عالي الجودة بإشراف مدربين متخصصين لمساعدتك على تطوير مهاراتك الفنية والتسويقية وتحقيق أهدافك المهنية في سوق العمل الحديث."
    },
    enrollment_codes: [],
    password_resets: [],
    events: [
      {
        id: 1,
        title: "ورشة توعوية مجانية (سلامة الحرائق والأمان)",
        description: "تعلن الأكاديمية بالتعاون مع شركة MedWorx عن تنظيم محاضرة توعوية مجانية حول سلامة الحرائق، الأمان، وإجراءات حماية الأفراد في بيئات العمل والمنازل.",
        image: "https://images.unsplash.com/photo-1599740831464-5cbe1a14f09c?auto=format&fit=crop&q=80&w=1200",
        is_free: true,
        category: "الأمان والسلامة الصناعية",
        date: "2026-04-05",
        time: "الساعة 5:00 مساءً بتوقيت بغداد",
        registration_link: "",
        created_at: new Date().toISOString()
      }
    ]
  };

  // If local db.json exists, we merge it as initial cache backup
  let initialDB = { ...defaultDB };
  if (fs.existsSync(DB_FILE)) {
    try {
      const localData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      initialDB = { ...initialDB, ...localData };
    } catch (e) {
      console.error("[Database] Error reading local db.json, using default seed:", e);
    }
  }

  if (!firestore) {
    console.log("[Firebase] Firestore is offline, using local json cache database.");
    return initialDB;
  }

  try {
    console.log("[Firebase] Fetching collections from Firestore 'academy_collections'...");
    const collRef = firestore.collection("academy_collections");
    const snapshot = await collRef.get();

    if (snapshot.empty) {
      console.log("[Firebase] Firestore database is currently empty. Migrating local seed database to Firestore...");
      const batch = firestore.batch();
      const keys = Object.keys(initialDB) as Array<keyof DatabaseSchema>;
      for (const key of keys) {
        const docRef = collRef.doc(key);
        batch.set(docRef, { data: initialDB[key] });
      }
      await batch.commit();
      console.log("[Firebase] Local seed database successfully migrated and stored in Firestore.");
      return initialDB;
    } else {
      const loadedDB = {} as DatabaseSchema;
      snapshot.forEach(doc => {
        const key = doc.id as keyof DatabaseSchema;
        const val = doc.data();
        if (val && val.data !== undefined) {
          loadedDB[key] = val.data;
        }
      });

      // Merge defaults, loaded data, and return
      const finalDB = { ...defaultDB, ...loadedDB };
      fs.writeFileSync(DB_FILE, JSON.stringify(finalDB, null, 2), "utf-8");
      console.log("[Firebase] Successfully fetched and synchronized database from Firestore!");
      return finalDB;
    }
  } catch (error) {
    console.error("[Firebase] Error fetching from Firestore. Fallback to local db.json:", error);
    return initialDB;
  }
}

// Global mutable db reference
let db: DatabaseSchema = {
  users: [],
  passwords: {},
  trainers: [],
  courses: [],
  lessons: [],
  enrollments: [],
  lesson_progress: [],
  certificates: [],
  articles: [],
  faqs: [],
  settings: {} as any,
  enrollment_codes: [],
  password_resets: [],
  events: []
};

// Ensure uploads folder exists and serve it
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

// Synchronously saves locally, then pushes to Firestore in background without blocking response
async function saveDBToFirestore(keys?: Array<keyof DatabaseSchema>) {
  if (!firestore) return;
  try {
    const collRef = firestore.collection("academy_collections");
    const targetKeys = keys || (Object.keys(db) as Array<keyof DatabaseSchema>);
    const batch = firestore.batch();
    for (const key of targetKeys) {
      const docRef = collRef.doc(key);
      batch.set(docRef, { data: db[key] });
    }
    await batch.commit();
    console.log(`[Firebase] Firestore sync completed successfully for keys: [${targetKeys.join(", ")}]`);
  } catch (err) {
    console.error("[Firebase] Firestore background write failed:", err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[Database] Failed writing to local cache db.json:", err);
  }
  // Safe background Firestore synchronization
  saveDBToFirestore().catch(err => {
    console.error("[Firebase] Background save error:", err);
  });
}

// --- API ENDPOINTS ---

// Settings
app.get("/api/settings", (req, res) => {
  res.json(db.settings);
});

app.post("/api/settings", (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  saveDB();
  res.json({ success: true, settings: db.settings });
});

// Authentication
app.post("/api/auth/register", (req, res) => {
  const { full_name, email, phone, password } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: "يرجى ملء جميع الحقول المطلوبة" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "البريد الإلكتروني المكتوب غير صالح، يرجى كتابة بريد إلكتروني حقيقي مثل name@example.com" });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "البريد الإلكتروني مستخدم مسبقاً" });
  }

  const verification_code = String(Math.floor(100000 + Math.random() * 900000));
  const id = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
  const newUser: User = {
    id,
    full_name,
    email,
    phone,
    role: "student",
    created_at: new Date().toISOString(),
    is_verified: true,
    verification_code
  };

  db.users.push(newUser);
  db.passwords[email.toLowerCase()] = password;
  saveDB();

  console.log(`[BoostUp Verification] Sent code to ${email}: ${verification_code}`);

  res.json({ success: true, user: newUser });
});

app.post("/api/auth/google-signin", (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
  }

  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Register new user automatically
    const id = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    user = {
      id,
      full_name: name || email.split("@")[0],
      email: email.toLowerCase(),
      role: "student",
      created_at: new Date().toISOString(),
      is_verified: true
    };
    db.users.push(user);
    db.passwords[email.toLowerCase()] = "google-authenticated-pass-placeholder";
    saveDB();
  }

  res.json({ success: true, user });
});

app.post("/api/auth/verify", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "البريد الإلكتروني وكود التحقق مطلوبان" });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  if (user.verification_code === code) {
    user.is_verified = true;
    saveDB();
    return res.json({ success: true, message: "تم تفعيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.", user });
  } else {
    return res.status(400).json({ error: "كود التحقق غير صحيح، يرجى المحاولة مرة أخرى" });
  }
});

app.post("/api/auth/resend-code", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  const verification_code = String(Math.floor(100000 + Math.random() * 900000));
  user.verification_code = verification_code;
  saveDB();

  console.log(`[BoostUp Verification] Resent code to ${email}: ${verification_code}`);

  res.json({ success: true, verification_code, message: "تم إعادة إرسال كود التحقق لبريدك الإلكتروني بنجاح!" });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "البريد الإلكتروني المكتوب غير صالح" });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  const pass = db.passwords[email.toLowerCase()];

  if (user && pass === password) {
    res.json({ success: true, user });
  } else {
    res.status(400).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
  }
});

// Password Reset Simulation
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ error: "هذا البريد الإلكتروني غير مسجل لدينا" });
  }

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expires_at = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  db.password_resets.push({
    id: db.password_resets.length + 1,
    email: email.toLowerCase(),
    token,
    expires_at
  });
  saveDB();

  // Simulated Email link returned for testing convenience
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;
  res.json({ success: true, resetLink, message: "تم إرسال رابط إعادة تعيين كلمة المرور بنجاح" });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { token, password } = req.body;
  const record = db.password_resets.find(r => r.token === token && new Date(r.expires_at) > new Date());
  if (!record) {
    return res.status(400).json({ error: "الرمز منتهي الصلاحية أو غير صالح" });
  }

  db.passwords[record.email] = password;
  // Clear that reset token and any other for this email
  db.password_resets = db.password_resets.filter(r => r.email !== record.email);
  saveDB();

  res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
});

// Public Stats for Admin
app.get("/api/admin/stats", (req, res) => {
  res.json({
    studentsCount: db.users.filter(u => u.role === "student").length,
    coursesCount: db.courses.length,
    trainersCount: db.trainers.length,
    articlesCount: db.articles.length,
    codesCount: db.enrollment_codes.length,
    eventsCount: (db.events || []).length
  });
});

// Trainers CRUD
app.get("/api/trainers", (req, res) => {
  res.json(db.trainers);
});

app.post("/api/trainers", (req, res) => {
  const { full_name, job_title, bio, photo } = req.body;
  if (!full_name) {
    return res.status(400).json({ error: "اسم المدرب مطلوب" });
  }

  const id = db.trainers.length > 0 ? Math.max(...db.trainers.map(t => t.id)) + 1 : 1;
  const newTrainer: Trainer = {
    id,
    full_name,
    job_title,
    bio,
    photo,
    created_at: new Date().toISOString()
  };

  db.trainers.push(newTrainer);
  saveDB();
  res.json({ success: true, trainer: newTrainer });
});

// Courses CRUD
app.get("/api/courses", (req, res) => {
  res.json(db.courses);
});

app.post("/api/courses", (req, res) => {
  const { title, description, price, duration, language, trainer_id, image, cert_template_image } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "العنوان والوصف مطلوبان" });
  }

  const id = db.courses.length > 0 ? Math.max(...db.courses.map(c => c.id)) + 1 : 1;
  const newCourse: Course = {
    id,
    trainer_id: trainer_id ? Number(trainer_id) : null,
    title,
    description,
    price: Number(price) || 0,
    duration: duration || "غير محدد",
    language: language || "العربية",
    image,
    cert_template_image: cert_template_image || "",
    created_at: new Date().toISOString()
  };

  db.courses.push(newCourse);
  saveDB();
  res.json({ success: true, course: newCourse });
});

app.delete("/api/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const courseIndex = db.courses.findIndex(c => c.id === id);
  if (courseIndex === -1) {
    return res.status(404).json({ error: "الدورة غير موجودة" });
  }

  // Remove the course
  db.courses.splice(courseIndex, 1);

  // Clean up related data
  db.lessons = db.lessons.filter(l => l.course_id !== id);
  db.enrollments = db.enrollments.filter(e => e.course_id !== id);
  db.enrollment_codes = db.enrollment_codes.filter(c => c.course_id !== id);
  db.certificates = db.certificates.filter(c => c.course_id !== id);

  saveDB();
  res.json({ success: true, message: "تم حذف الدورة وجميع الدروس والأكواد المتعلقة بها بنجاح!" });
});

app.put("/api/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const course = db.courses.find(c => c.id === id);
  if (!course) {
    return res.status(404).json({ error: "الدورة غير موجودة" });
  }

  const { title, description, price, duration, language, trainer_id, image, cert_template_image } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "العنوان والوصف مطلوبان" });
  }

  course.title = title;
  course.description = description;
  course.price = Number(price) || 0;
  course.duration = duration || "غير محدد";
  course.language = language || "العربية";
  course.trainer_id = trainer_id ? Number(trainer_id) : null;
  course.image = image || course.image;
  course.cert_template_image = cert_template_image !== undefined ? cert_template_image : course.cert_template_image;

  saveDB();
  res.json({ success: true, course });
});

app.get("/api/student/completed-lessons/:user_id/:course_id", (req, res) => {
  const userId = Number(req.params.user_id);
  const courseId = Number(req.params.course_id);
  const courseLessons = db.lessons.filter(l => l.course_id === courseId).map(l => l.id);
  
  const completed = db.lesson_progress
    .filter(p => p.user_id === userId && p.completed && courseLessons.includes(p.lesson_id))
    .map(p => p.lesson_id);
  
  res.json(completed);
});

// Lessons CRUD
app.get("/api/lessons", (req, res) => {
  res.json(db.lessons);
});

app.post("/api/lessons", (req, res) => {
  const { course_id, title, video_type, video_url, lesson_order } = req.body;
  if (!course_id || !title || !video_url) {
    return res.status(400).json({ error: "يرجى ملء جميع الحقول المطلوبة للدرس" });
  }

  const id = db.lessons.length > 0 ? Math.max(...db.lessons.map(l => l.id)) + 1 : 1;
  const newLesson: Lesson = {
    id,
    course_id: Number(course_id),
    title,
    video_type: video_type || "youtube",
    video_url,
    lesson_order: Number(lesson_order) || 1,
    created_at: new Date().toISOString()
  };

  db.lessons.push(newLesson);
  // Sort lessons
  db.lessons.sort((a, b) => a.lesson_order - b.lesson_order);
  saveDB();
  res.json({ success: true, lesson: newLesson });
});

// Articles CRUD
app.get("/api/articles", (req, res) => {
  res.json(db.articles);
});

app.post("/api/articles", (req, res) => {
  const { title, content, image } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "العنوان والمحتوى مطلوبان" });
  }

  const id = db.articles.length > 0 ? Math.max(...db.articles.map(a => a.id)) + 1 : 1;
  const newArticle: Article = {
    id,
    title,
    content,
    image,
    created_at: new Date().toISOString()
  };

  db.articles.push(newArticle);
  saveDB();
  res.json({ success: true, article: newArticle });
});

// Events CRUD
app.get("/api/events", (req, res) => {
  res.json(db.events || []);
});

app.post("/api/events", (req, res) => {
  const { title, description, image, is_free, category, date, time, registration_link } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "عنوان الفعالية وتفاصيلها مطلوبة" });
  }

  const id = (db.events && db.events.length > 0) ? Math.max(...db.events.map(e => e.id)) + 1 : 1;
  const newEvent: Event = {
    id,
    title,
    description,
    image: image || "https://images.unsplash.com/photo-1599740831464-5cbe1a14f09c?auto=format&fit=crop&q=80&w=1200",
    is_free: is_free !== undefined ? Boolean(is_free) : true,
    category: category || "عام",
    date: date || new Date().toISOString().split('T')[0],
    time: time || "الساعة 5:00 مساءً",
    registration_link: registration_link || "",
    created_at: new Date().toISOString()
  };

  if (!db.events) db.events = [];
  db.events.push(newEvent);
  saveDB();
  res.json({ success: true, event: newEvent });
});

app.put("/api/events/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, image, is_free, category, date, time, registration_link } = req.body;
  
  if (!db.events) db.events = [];
  const eventIndex = db.events.findIndex(e => e.id === Number(id));
  if (eventIndex === -1) {
    return res.status(404).json({ error: "الفعالية غير موجودة" });
  }

  db.events[eventIndex] = {
    ...db.events[eventIndex],
    title: title || db.events[eventIndex].title,
    description: description || db.events[eventIndex].description,
    image: image !== undefined ? image : db.events[eventIndex].image,
    is_free: is_free !== undefined ? Boolean(is_free) : db.events[eventIndex].is_free,
    category: category || db.events[eventIndex].category,
    date: date || db.events[eventIndex].date,
    time: time || db.events[eventIndex].time,
    registration_link: registration_link !== undefined ? registration_link : db.events[eventIndex].registration_link
  };

  saveDB();
  res.json({ success: true, event: db.events[eventIndex] });
});

app.delete("/api/events/:id", (req, res) => {
  const { id } = req.params;
  if (!db.events) db.events = [];
  const initialLength = db.events.length;
  db.events = db.events.filter(e => e.id !== Number(id));
  
  if (db.events.length === initialLength) {
    return res.status(404).json({ error: "الفعالية غير موجودة" });
  }

  saveDB();
  res.json({ success: true, message: "تم حذف الفعالية بنجاح" });
});

// Enrollment Codes Management
app.get("/api/enrollment-codes", (req, res) => {
  // Join course titles
  const joinedCodes = db.enrollment_codes.map(c => {
    const course = db.courses.find(co => co.id === c.course_id);
    const user = c.used_by ? db.users.find(u => u.id === c.used_by) : null;
    return {
      ...c,
      course_title: course ? course.title : "دورة محذوفة",
      used_by_name: user ? user.full_name : null
    };
  });
  res.json(joinedCodes);
});

app.post("/api/enrollment-codes/generate", (req, res) => {
  const { course_id, quantity } = req.body;
  if (!course_id || !quantity) {
    return res.status(400).json({ error: "يرجى اختيار الدورة وتحديد العدد المطلوب" });
  }

  const createdCodes: EnrollmentCode[] = [];
  const startId = db.enrollment_codes.length > 0 ? Math.max(...db.enrollment_codes.map(c => c.id)) + 1 : 1;

  for (let i = 0; i < Number(quantity); i++) {
    // Generate a secure random activation code like: BST-XXXX-XXXX
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `BST-${randomHex}-${randomNum}`;

    const newCode: EnrollmentCode = {
      id: startId + i,
      course_id: Number(course_id),
      code,
      is_used: false,
      used_by: null,
      created_at: new Date().toISOString()
    };
    db.enrollment_codes.push(newCode);
    createdCodes.push(newCode);
  }

  saveDB();
  res.json({ success: true, codes: createdCodes });
});

// Redeem Activation Code
app.post("/api/student/redeem-code", (req, res) => {
  const { user_id, code } = req.body;
  if (!user_id || !code) {
    return res.status(400).json({ error: "بيانات التحقق غير مكتملة" });
  }

  const foundCode = db.enrollment_codes.find(c => c.code.trim().toUpperCase() === code.trim().toUpperCase());
  if (!foundCode) {
    return res.status(400).json({ error: "كود التفعيل هذا غير صالح أو غير موجود" });
  }

  if (foundCode.is_used) {
    return res.status(400).json({ error: "عذراً، هذا الكود تم استخدامه مسبقاً" });
  }

  // Check if student is already enrolled in this course
  const alreadyEnrolled = db.enrollments.some(e => e.user_id === Number(user_id) && e.course_id === foundCode.course_id);
  if (alreadyEnrolled) {
    return res.status(400).json({ error: "أنت مشترك بالفعل في هذه الدورة!" });
  }

  // Complete redemption
  foundCode.is_used = true;
  foundCode.used_by = Number(user_id);

  // Add enrollment
  const enrollId = db.enrollments.length > 0 ? Math.max(...db.enrollments.map(e => e.id)) + 1 : 1;
  db.enrollments.push({
    id: enrollId,
    user_id: Number(user_id),
    course_id: foundCode.course_id,
    enrolled_at: new Date().toISOString()
  });

  saveDB();

  const course = db.courses.find(c => c.id === foundCode.course_id);
  res.json({ success: true, course_title: course ? course.title : "الدورة المفعّلة" });
});

// Student Enrollment & Progress Fetching
app.get("/api/student/courses/:user_id", (req, res) => {
  const userId = Number(req.params.user_id);
  const studentEnrollments = db.enrollments.filter(e => e.user_id === userId);
  
  const results = studentEnrollments.map(e => {
    const course = db.courses.find(c => c.id === e.course_id);
    if (!course) return null;

    // Calculate progress percentage
    const courseLessons = db.lessons.filter(l => l.course_id === course.id);
    const totalLessons = courseLessons.length;
    let completedLessons = 0;

    if (totalLessons > 0) {
      const completedLessonIds = db.lesson_progress
        .filter(p => p.user_id === userId && p.completed)
        .map(p => p.lesson_id);
      
      completedLessons = courseLessons.filter(l => completedLessonIds.includes(l.id)).length;
    }

    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      ...course,
      progress_percent: percentage,
      completed_lessons: completedLessons,
      total_lessons: totalLessons
    };
  }).filter(Boolean);

  res.json(results);
});

// Verify user enrolled in specific course
app.get("/api/student/verify-enrollment", (req, res) => {
  const user_id = Number(req.query.user_id);
  const course_id = Number(req.query.course_id);
  const isEnrolled = db.enrollments.some(e => e.user_id === user_id && e.course_id === course_id);
  res.json({ enrolled: isEnrolled });
});

// Lesson Completed Status Update & Certificate auto-generator
app.post("/api/student/complete-lesson", (req, res) => {
  const { user_id, lesson_id } = req.body;
  if (!user_id || !lesson_id) {
    return res.status(400).json({ error: "البيانات ناقصة" });
  }

  const uId = Number(user_id);
  const lId = Number(lesson_id);

  const lesson = db.lessons.find(l => l.id === lId);
  if (!lesson) {
    return res.status(404).json({ error: "الدرس غير موجود" });
  }

  let progressRecord = db.lesson_progress.find(p => p.user_id === uId && p.lesson_id === lId);
  if (!progressRecord) {
    progressRecord = {
      id: db.lesson_progress.length > 0 ? Math.max(...db.lesson_progress.map(p => p.id)) + 1 : 1,
      user_id: uId,
      lesson_id: lId,
      completed: true,
      completed_at: new Date().toISOString()
    };
    db.lesson_progress.push(progressRecord);
  } else {
    progressRecord.completed = true;
    progressRecord.completed_at = new Date().toISOString();
  }

  saveDB();

  // Check if course has been fully completed now
  const course_id = lesson.course_id;
  const courseLessons = db.lessons.filter(l => l.course_id === course_id);
  const completedLessonIds = db.lesson_progress
    .filter(p => p.user_id === uId && p.completed)
    .map(p => p.lesson_id);
  
  const completedCount = courseLessons.filter(l => completedLessonIds.includes(l.id)).length;

  let certificateGenerated = false;
  let certificate_id = "";

  if (completedCount === courseLessons.length && courseLessons.length > 0) {
    // Check if certificate already exists
    const existingCert = db.certificates.find(c => c.user_id === uId && c.course_id === course_id);
    if (!existingCert) {
      // Generate a unique Certificate Code like BST-2026-XXXXX
      const year = new Date().getFullYear();
      const randNum = Math.floor(10000 + Math.random() * 90000);
      certificate_id = `BST-${year}-${randNum}`;

      const certId = db.certificates.length > 0 ? Math.max(...db.certificates.map(c => c.id)) + 1 : 1;
      db.certificates.push({
        id: certId,
        user_id: uId,
        course_id,
        certificate_id,
        pdf_file: `${certificate_id}.pdf`,
        issue_date: new Date().toISOString().split('T')[0]
      });
      saveDB();
      certificateGenerated = true;
    }
  }

  res.json({
    success: true,
    percentage: Math.round((completedCount / courseLessons.length) * 100),
    certificateGenerated,
    certificate_id
  });
});

// Student Certificates list
app.get("/api/student/certificates/:user_id", (req, res) => {
  const userId = Number(req.params.user_id);
  const certs = db.certificates.filter(c => c.user_id === userId);
  
  const result = certs.map(c => {
    const course = db.courses.find(co => co.id === c.course_id);
    return {
      ...c,
      course_title: course ? course.title : "دورة تدريبية",
      course_cert_template: course ? course.cert_template_image : ""
    };
  });
  res.json(result);
});

// Public Certificate Verification
app.get("/api/certificates/verify/:id", (req, res) => {
  const certId = req.params.id.trim().toUpperCase();
  const cert = db.certificates.find(c => c.certificate_id.toUpperCase() === certId);
  if (!cert) {
    return res.status(404).json({ error: "عذراً، هذا الرمز غير صالح أو لم يتم العثور على الشهادة المطلوبة." });
  }

  const user = db.users.find(u => u.id === cert.user_id);
  const course = db.courses.find(c => c.id === cert.course_id);

  res.json({
    success: true,
    certificate_id: cert.certificate_id,
    full_name: user ? user.full_name : "طالب الأكاديمية",
    course_title: course ? course.title : "دورة معتمدة",
    issue_date: cert.issue_date,
    course_cert_template: course ? course.cert_template_image : ""
  });
});

// Student list for admin
app.get("/api/admin/students", (req, res) => {
  const students = db.users.filter(u => u.role === "student");
  const result = students.map(s => {
    // Count user enrollments
    const count = db.enrollments.filter(e => e.user_id === s.id).length;
    return {
      ...s,
      enrollmentsCount: count
    };
  });
  res.json(result);
});

// FAQs list
app.get("/api/faqs", (req, res) => {
  res.json(db.faqs);
});

// File Upload Endpoint (converts Base64 to actual file in /uploads/)
app.post("/api/upload", (req, res) => {
  const { filename, fileData } = req.body;
  if (!filename || !fileData) {
    return res.status(400).json({ error: "البيانات المطلوبة لرفع الملف غير مكتملة" });
  }

  try {
    const base64Content = fileData.replace(/^data:.*;base64,/, "");
    const buffer = Buffer.from(base64Content, "base64");
    
    // Generate a secure unique filename
    const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    
    fs.writeFileSync(filePath, buffer);
    const fileUrl = `/uploads/${safeFilename}`;
    
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "عذراً، فشل رفع الملف وحفظه بالخادم" });
  }
});

// Quick Direct Enrollment for Students (Quick test / free access bypass)
app.post("/api/student/quick-enroll", (req, res) => {
  const { user_id, course_id } = req.body;
  if (!user_id || !course_id) {
    return res.status(400).json({ error: "بيانات التسجيل غير مكتملة" });
  }

  const uId = Number(user_id);
  const cId = Number(course_id);

  // Check if already enrolled
  const alreadyEnrolled = db.enrollments.some(e => e.user_id === uId && e.course_id === cId);
  if (alreadyEnrolled) {
    return res.status(400).json({ error: "أنت مشترك بالفعل في هذه الدورة!" });
  }

  // Add enrollment
  const enrollId = db.enrollments.length > 0 ? Math.max(...db.enrollments.map(e => e.id)) + 1 : 1;
  db.enrollments.push({
    id: enrollId,
    user_id: uId,
    course_id: cId,
    enrolled_at: new Date().toISOString()
  });

  saveDB();

  const course = db.courses.find(c => c.id === cId);
  res.json({ success: true, course_title: course ? course.title : "الدورة" });
});

// Serve compiled static files in production or run Vite Dev server in development
async function startServer() {
  // Fetch real persistent database state from Cloud Firestore
  db = await loadDBFromFirestore();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
