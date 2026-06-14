import { arabicProperties } from "~/data/static";
import type { Student, XLSXAbsnece, XLSXLateness, XLSXStudent } from "~/data/types";
import { ArabicStudentProperties, XLSXArabicStudentProperties, XLSXArabicAbsenceProperties, XLSXArabicLatenessProperties } from "~/data/static";
// ========== Fields / its Arabic translations functions ==========
/*Internal */
const formatRequiredFieldMessage = (
  arabicFieldName: string,
  type: "text" | "choice" = "text",
) =>
  type === "text"
    ? `يجب إدخال ${arabicFieldName}`
    : type == "choice"
      ? `يجب اختيار ${arabicFieldName}`
      : "هذا الحقل مطلوب";

export const getRequiredFieldMessage = (
  fieldName: string,
  type: "text" | "choice" = "text",
) => {
  const arabicPropertyName = getPropertyArabicName(fieldName)
  return arabicPropertyName
    ? formatRequiredFieldMessage(arabicPropertyName, type)
    : formatRequiredFieldMessage(fieldName, type)
};
export const getPropertyArabicName = (fieldName: string) => fieldName in arabicProperties ? arabicProperties[fieldName as keyof typeof arabicProperties] : undefined



/* -------------------------------------------------------------------------- */
/*                               Excel Logic                                  */
/* -------------------------------------------------------------------------- */

/* type Alisa */
type XLSXStudentDict = typeof XLSXArabicStudentProperties
type XLSXAbsenceDict = typeof XLSXArabicAbsenceProperties
type XLSXLatenessDict = typeof XLSXArabicLatenessProperties


/**
 * Generic property-mapping dictionary type.
 * @typeParam T - The object type to extract keys from.
 * @example
 * ```typescript
 * type XLSXArabicStudentProperties = PropDict<XLSXStudent> // gives typeof XLSXArabicStudentPropertie
 * ```
 */
type PropDict<T> = Record<keyof T, string>;

/**
 * Generic key extractor.
 * @typeParam T - The object type to extract keys from.
 * @example
 * ```typescript
 * type arabicStudentProps = ArabicKeysOf<typeof ArabicStudentProperties> // gives "المعرف" | "الحالة" | "الاسم" | "اللقب" | "اسم الأب" | "اسم الجد" | "الصف" | "الجنس" | "رقم الهاتف" | "تاريخ الميلاد" | "العنوان" | "تاريخ المغادرة"
 * ```
 */
type ArabicKeysOf<Dict> = Dict[keyof Dict];

/**
 * Generic Arabic-keyed type, derived from any source type T and its dict.
 * @typeParam T - The object type to extract keys from.
 * @typeParam Dict - The dictionary that holds T keys. (So we can map using it)
 * @example
 * ```typescript
 * type arabicStufdent : InArabic<XLSXStudent, typeof XLSXArabicStudentProperties> // gives XLSXStudent but with Arabic keys
 * ```
 */
 
type InArabic<T, Dict extends PropDict<T>> = {
  [K in keyof T as Dict[K]]: T[K];
};


// 2. Define the shape of the Arabic student object
// It maps the Arabic string keys to the corresponding values from the Student object
export type StudentInArabic = {
  [K in keyof XLSXStudent as typeof XLSXArabicStudentProperties[K]]: XLSXStudent[K];
};

export const transformPropertiesToArabic = (
  itemObj: XLSXStudent,
  arabicPropsDict: typeof XLSXArabicStudentProperties
): InArabic<XLSXStudent, typeof ArabicStudentProperties> => {
  // Initialize with a type cast to our final shape
  const studentInArabic = {} as StudentInArabic;

  for (const key of Object.keys(itemObj) as Array<keyof XLSXStudent>) {
    const arabicKey = arabicPropsDict[key];

    // We use a type assertion here because TypeScript's compiler 
    // struggles to track dynamic correlated properties inside a loop.
    (studentInArabic as any)[arabicKey] = itemObj[key];
  }

  return studentInArabic;
};
export const transformPropertiesToEnglish = (
  studentInArabic: StudentInArabic,
  arabicPropsDict: typeof ArabicStudentProperties
): Student => {
  // 1. Initialize the object so it's not undefined
  let engStudent = {} as Student;

  // 2. Create a reverse mapping lookup: { "المعرف": "id", "الحالة": "status" }
  const englishKeysDict = Object.fromEntries(
    Object.entries(arabicPropsDict).map(([enKey, arValue]) => [arValue, enKey])
  ) as Record<ArabicKeysOf<typeof ArabicStudentProperties>, keyof Student>;

  // 3. Loop through the Arabic object safely
  for (const arabicKey in studentInArabic) {
    if (Object.hasOwn(studentInArabic, arabicKey)) {
      // TypeScript now knows exactly what English key matches this Arabic key
      const engKey = (englishKeysDict as any)[arabicKey];

      if (engKey) {
        // Use a small type cast here to bypass compiler limitations on dynamic keys
        (engStudent as any)[engKey] = studentInArabic[arabicKey as keyof StudentInArabic];
      }
    }
  }

  return engStudent as Student;
};