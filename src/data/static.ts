import type { Gender, Student } from "./types";

export const genderOptions = [
  { label: "ذكر", value: "M" },
  { label: "أنثى", value: "F" },
] satisfies {
  label: string;
  value: Gender;
}[];

export const ArabicStudentProperties : Record<keyof Student,string> ={
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
}