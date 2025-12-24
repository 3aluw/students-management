import type {
  Class,
  Gender,
  Student,
  SchoolLevel,
  SupportedDateRanges,
} from "./types";

export const genderOptions = [
  { label: "ذكر", value: "M" },
  { label: "أنثى", value: "F" },
] satisfies {
  label: string;
  value: Gender;
}[];

export const schoolLevelOptions = [
  { label: "ابتدائي", value: "primary" },
  { label: "متوسط", value: "middle" },
  { label: "ثانوي", value: "high" },
] satisfies {
  label: string;
  value: SchoolLevel;
}[];

export const dateFilterOptions = [
  { label: "اليوم", value: "today" },
  { label: "أمس", value: "yesterday" },
  { label: "هذا الأسبوع", value: "this week" },
  { label: "هذا الشهر", value: "this month" },
] satisfies {
  label: string;
  value: SupportedDateRanges;
}[];
export const ArabicBooleans = [
  { label: "لا", value: false },
  { label: "نعم", value: true },
];
export const sqliteBoolean = [
  { label: "لا", value: 0 },
  { label: "نعم", value: 1 },
];
export const ArabicStudentProperties: Record<keyof Student, string> = {
  id: "المعرف",
  first_name: "الاسم",
  last_name: "اللقب",
  father_name: "اسم الأب",
  grandfather_name: "اسم الجد",
  class_id: "الصف",
  sex: "الجنس",
  phone_number: "رقم الهاتف",
  birth_date: "تاريخ الميلاد",
  address: "العنوان",
};
export const ArabicClassProperties: Record<keyof Class, string> = {
  id: "المعرف",
  grade: "المستوى",
  school_level: "الطور التعليمي",
  section: "الحرف",
};
export const ArabicSchoolLevels: Record<SchoolLevel, string> = {
  primary: "ابتدائي",
  middle: "متوسط",
  high: "ثانوي",
};
export const commonReasons = [
  "المرض",
  "موعد طبي",
  "ظرف عائلي ",
  "عدم توفر المواصلات",
  "ضغوط نفسية ",
  "عدم الدافعية تجاه المدرسة",
  "مشاكل التنمّر",
  "سفر",
  "سوء الطقس",
  "مسؤوليات منزلية",
  "ازدحام المرور",
  "النوم",
  "تأخر الحافلة المدرسية",
  "فقدان المتعلّقات أو نسيانها",
  "مهام منزلية أو رعاية إخوة أصغر",
  "مشكلة مفاجئة في الطريق",
];

export const studyTimes = [{ start: 480, end: 660 }];
export const userFeedbackMessages = {
  student: {
    addSuccess: "تمت إضافة التلميذ بنجاح",
    addFailed: "حدث خطأ أثناء إضافة التلميذ",
    fetchSuccess: "تم تحميل بيانات التلاميذ بنجاح",
    fetchFailed: "حدث خطأ أثناء تحميل بيانات التلاميذ",
    updateSuccess: "تم تحديث بيانات التلميذ بنجاح",
    updateFailed: "حدث خطأ أثناء تحديث بيانات التلميذ",
    deleteSuccess: "تم حذف التلميذ بنجاح",
    deleteFailed: "حدث خطأ أثناء حذف التلميذ",
  },
  class: {
    addSuccess: "تمت إضافة القسم بنجاح",
    addFailed: "حدث خطأ أثناء إضافة القسم",
    fetchSuccess: "تم تحميل بيانات الأقسام بنجاح",
    fetchFailed: "حدث خطأ أثناء تحميل بيانات الأقسام",
    updateSuccess: "تم تحديث بيانات القسم بنجاح",
    updateFailed: "حدث خطأ أثناء تحديث بيانات القسم",
    deleteSuccess: "تم حذف القسم بنجاح",
    deleteFailed: "حدث خطأ أثناء حذف القسم",
  },
  absence: {
    addSuccess: "تم تسجيل الغياب بنجاح",
    addFailed: "حدث خطأ أثناء تسجيل الغياب",
    fetchSuccess: "تم تحميل بيانات الغيابات بنجاح",
    fetchFailed: "حدث خطأ أثناء تحميل بيانات الغيابات",
    updateSuccess: "تم تحديث الغياب بنجاح",
    updateFailed: "حدث خطأ أثناء تحديث الغياب",
    deleteSuccess: "تم حذف الغياب بنجاح",
    deleteFailed: "حدث خطأ أثناء حذف الغياب",
  },
  lateness: {
    addSuccess: "تم تسجيل التأخر بنجاح",
    addFailed: "حدث خطأ أثناء تسجيل التأخر",
    fetchSuccess: "تم تحميل بيانات التأخرات بنجاح",
    fetchFailed: "حدث خطأ أثناء تحميل بيانات التأخرات",
    updateSuccess: "تم تحديث التأخر بنجاح",
    updateFailed: "حدث خطأ أثناء تحديث التأخر",
    deleteSuccess: "تم حذف التأخر بنجاح",
    deleteFailed: "حدث خطأ أثناء حذف التأخر",
  },
};
