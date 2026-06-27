export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'student';
  created_at: string;
  is_verified?: boolean;
  verification_code?: string;
}

export interface Trainer {
  id: number;
  full_name: string;
  job_title: string;
  photo?: string; // Base64 or local URL
  bio?: string;
  created_at: string;
}

export interface Course {
  id: number;
  trainer_id?: number | null;
  title: string;
  description: string;
  image?: string; // URL or Base64
  cert_template_image?: string; // URL or Base64 of the custom certificate background template
  price: number;
  duration: string;
  language: string;
  created_at: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  video_type: 'upload' | 'youtube';
  video_url: string; // URL or file name
  lesson_order: number;
  created_at: string;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: string;
}

export interface LessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  completed: boolean;
  completed_at?: string;
}

export interface Certificate {
  id: number;
  user_id: number;
  course_id: number;
  certificate_id: string; // BST-YYYY-XXXXX
  pdf_file: string;
  issue_date: string;
}

export interface Article {
  id: number;
  title: string;
  image?: string;
  content: string;
  created_at: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface Payment {
  id: number;
  user_id: number;
  course_id: number;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_date: string;
}

export interface Settings {
  site_name: string;
  phone: string;
  telegram: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  about_text: string;
  logo?: string;
}

export interface EnrollmentCode {
  id: number;
  course_id: number;
  code: string;
  is_used: boolean;
  used_by: number | null;
  created_at: string;
}

export interface PasswordReset {
  id: number;
  email: string;
  token: string;
  expires_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  image?: string;
  is_free: boolean;
  category: string;
  date: string;
  time: string;
  registration_link?: string;
  created_at: string;
}
