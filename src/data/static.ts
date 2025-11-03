import type { Class, Gender, Student, SchoolLevel } from "./types";

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
  school_level : "الطور التعليمي",
  section: "الحرف",
};
export const ArabicSchoolLevels: Record<SchoolLevel, string> = {
 primary: "ابتدائي",
 middle : "متوسط",
 high : "ثانوي"
};
