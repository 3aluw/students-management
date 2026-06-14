import type {
  Class,
  Gender,
  Student,
  SchoolLevel,
  SupportedDateRanges,
  SeasonStatus,
  Absence,
  SchoolSeason,
  Lateness,
  SchoolTerm,
  AllEntitiesKeys,
  StudentStatus,
  XLSXStudent,
  XLSXLateness,
  XLSXAbsnece
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
export const statusFilterOptions = [
  { label: "متخرج", value: "graduated" },
  { label: "منسحب", value: "dropped" },
  { label: "محول", value: "transferred" },
] satisfies {
  label: string;
  value: StudentStatus;
}[];
export const ArabicBooleans = [
  { label: "لا", value: false },
  { label: "نعم", value: true },
];
export const sqliteBoolean = [
  { label: "لا", value: 0 },
  { label: "نعم", value: 1 },
];
export const ArabicStudentProperties = {
  id: "المعرف",
  status: "الحالة",
  first_name: "الاسم",
  last_name: "اللقب",
  father_name: "اسم الأب",
  grandfather_name: "اسم الجد",
  class_id: "الصف",
  sex: "الجنس",
  phone_number: "رقم الهاتف",
  birth_date: "تاريخ الميلاد",
  address: "العنوان",
  exited_at: "تاريخ المغادرة"
} as const satisfies Record<keyof Student, string>;

export const ArabicClassProperties: Record<keyof Class, string> = {
  id: "المعرف",
  grade: "المستوى",
  school_level: "الطور التعليمي",
  section: "الحرف",
};
export const ArabicLatenessProperties = {
  id: "المعرف",
  student_id: "معرف الطالب",
  date: "التاريخ",
  start_time: "وقت بداية الحصة",
  late_by: "مدة التأخر (بالدقائق)",
  reason: "السبب",
  reason_accepted: "قبول العذر",
} as const satisfies Record<keyof Lateness, string>;

export const ArabicAbsenceProperties = {
  id: "المعرف",
  student_id: "معرف الطالب",
  date: "التاريخ",
  start_time: "وقت بداية الحصة",
  reason: "السبب",
  reason_accepted: "قبول السبب",
} as const satisfies Record<keyof Absence, string>;

export const ArabicSchoolSeasonProperties: Record<keyof SchoolSeason, string> = {
  id: "المعرف",
  name: "اسم الموسم الدراسي",
  terms: "الفصول الدراسية",
};

export const ArabicSchoolTermProperties: Record<keyof SchoolTerm, string> = {
  name: "اسم الفصل",
  startDate: "تاريخ البداية",
  endDate: "تاريخ النهاية",
};

export const arabicProperties: Record<AllEntitiesKeys, string> = {
  ...ArabicStudentProperties,
  ...ArabicClassProperties,
  ...ArabicLatenessProperties,
  ...ArabicAbsenceProperties,
  ...ArabicSchoolSeasonProperties,
  ...ArabicSchoolTermProperties,
}
export const ArabicStudentStatus: Record<StudentStatus, string> = {
  active: "نشط",
  graduated: "متخرج",
  transferred: "محوّل",
  dropped: "منسحب",
}
export const ArabicSchoolLevels: Record<SchoolLevel, string> = {
  primary: "ابتدائي",
  middle: "متوسط",
  high: "ثانوي",
};
export const ArabicSeasonStatus: Record<SeasonStatus, string> = {
  past: "منتهي",
  current: "حالي",
  future: "مستقبل",
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
    transferSuccess: "تم نقل التلاميذ المحددين بنجاح",
    transferFailed: "حدث خطأ أثناء نقل التلاميذ",
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
    partialAddSuccess: 'عدد الغيابات التي تم تسجيلها : ',
    addFailed: "حدث خطأ أثناء تسجيل الغياب",
    partialAddFailed: 'لم يتم تسجيل الغياب ل:  ',
    fetchSuccess: "تم تحميل بيانات الغيابات بنجاح",
    fetchFailed: "حدث خطأ أثناء تحميل بيانات الغيابات",
    updateSuccess: "تم تحديث الغياب بنجاح",
    updateFailed: "حدث خطأ أثناء تحديث الغياب",
    deleteSuccess: "تم حذف الغياب بنجاح",
    deleteFailed: "حدث خطأ أثناء حذف الغياب",
  },
  lateness: {
    addSuccess: "تم تسجيل التأخر بنجاح",
    partialAddSuccess: 'عدد التأخرات التي تم تسجيلها : ',
    addFailed: "حدث خطأ أثناء تسجيل التأخر",
    partialAddFailed: 'لم يتم تسجيل التأخر ل : ',
    fetchSuccess: "تم تحميل بيانات التأخرات بنجاح",
    fetchFailed: "حدث خطأ أثناء تحميل بيانات التأخرات",
    updateSuccess: "تم تحديث التأخر بنجاح",
    updateFailed: "حدث خطأ أثناء تحديث التأخر",
    deleteSuccess: "تم حذف التأخر بنجاح",
    deleteFailed: "حدث خطأ أثناء حذف التأخر",
  },
  season: {
    addSuccess: "تمت إضافة الموسم الدراسي بنجاح",
    addFailed: "حدث خطأ أثناء إضافة الموسم الدراسي",
    fetchSuccess: "تم تحميل بيانات المواسم الدراسية بنجاح",
    fetchFailed: "حدث خطأ أثناء تحميل بيانات المواسم الدراسية",
    updateSuccess: "تم تحديث الموسم الدراسي بنجاح",
    updateFailed: "حدث خطأ أثناء تحديث الموسم الدراسي",
    deleteSuccess: "تم حذف الموسم الدراسي بنجاح",
    deleteFailed: "حدث خطأ أثناء حذف الموسم الدراسي",
  },
};
export const toGraduateClass: Pick<Class, 'section' | 'id'> = {
  id: -1,
  section: 'المتخرجون'
}


// ============== XLSX files arabic properties ====================
export const ArabicXLSXStudentProperties = {
  id: "المعرف",
  first_name: "الاسم",
  last_name: "اللقب",
  father_name: "اسم الأب",
  grandfather_name: "اسم الجد",
  sex: "الجنس",
  phone_number: "رقم الهاتف",
  birth_date: "تاريخ الميلاد",
  address: "العنوان",
} as const satisfies Record<keyof XLSXStudent, string>;

export const ArabicXLSXLatenessProperties = {
  student: " الطالب",
  date: "التاريخ",
  late_by: "مدة التأخر (بالدقائق)",
  reason: "السبب",
  reason_accepted: "قبول العذر",
} as const satisfies Record<keyof XLSXLateness, string>;

export const ArabicXLSXcAbsenceProperties = {
  student: " الطالب",
  date: "التاريخ",
  reason: "السبب",
  reason_accepted: "قبول السبب",
} as const satisfies Record<keyof XLSXAbsnece, string>;
