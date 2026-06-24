import { arabicProperties } from "~/models/static";
import type { InArabic, PropDict, ArabicKeysOf, XLSXType, } from "~/models/types";

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
/*                               record translate Logic                       */
/* -------------------------------------------------------------------------- */


/**
 * Transforms an object's property keys from English to Arabic using a dictionary mapping.
 * @typeParam T - The original object type with English property keys.
 * @typeParam Dict - The dictionary type mapping English keys to Arabic keys.
 * @param XLSXRecord - The source object with English property names (Now we are using it for XLSX records only).
 * @param arabicPropsDict - A dictionary mapping English property names to their Arabic equivalents.
 * @returns A new object with Arabic property names but the same values.
 * @remarks
 * This function uses type assertions because TypeScript cannot track dynamic correlated properties inside the loop.
 * @example
 * ```typescript
 * const student = { name: "Ahmed", age: 20 };
 * const dict = { name: "الاسم", age: "العمر" };
 * transformToArabic(student, dict); // Returns { "الاسم": "Ahmed", "العمر": 20 }
 * ```
 */
export const transformToArabic = <T extends XLSXType, Dict extends PropDict<T>>(
  XLSXRecord: T,
  arabicPropsDict: Dict
): InArabic<T, Dict> => {
  // Initialize with a type cast to our final shape
  const studentInArabic = {} as InArabic<T, Dict>;

  for (const key of Object.keys(XLSXRecord) as Array<keyof T>) {
    const arabicKey = arabicPropsDict[key];

    // We use a type assertion here because TypeScript's compiler 
    // struggles to track dynamic correlated properties inside a loop.
    (studentInArabic as any)[arabicKey] = XLSXRecord[key];
  }
  return studentInArabic as InArabic<T, Dict>;
}


/**
 * Transforms an object's property keys from Arabic back to English using a dictionary mapping.
 * @typeParam T - The target object type with English property keys.
 * @typeParam Dict - The dictionary type mapping English keys to Arabic keys.
 * @param arabicRecord - The source object with Arabic property names.
 * @param dict - The dictionary mapping English property names to their Arabic equivalents.
 * @returns A new object with English property names and the original values.
 * @remarks
 * This function automatically reverses the dictionary to map Arabic keys back to English.
 * Keys in the Arabic object that don't exist in the dictionary are filtered out.
 * @example
 * ```typescript
 * const arabicStudent = { "الاسم": "Ahmed", "العمر": 20 };
 * const dict = { name: "الاسم", age: "العمر" };
 * transformToEnglish(arabicStudent, dict); // Returns { name: "Ahmed", age: 20 }
 * ```
 */
export const transformToEnglish = <T extends object, Dict extends PropDict<T>>(
  arabicRecord: InArabic<T, Dict>,
  dict: Dict
): T => {
  const reverseDict = Object.fromEntries(
    (Object.entries(dict) as Array<[keyof T, string]>).map(([enKey, arVal]) => [arVal, enKey])
  ) as Record<ArabicKeysOf<Dict>, keyof T>;

  return Object.fromEntries(
    (Object.keys(arabicRecord) as Array<ArabicKeysOf<Dict>>)
      .filter((arKey) => reverseDict[arKey] !== undefined)
      .map((arKey) => [reverseDict[arKey], arabicRecord[arKey as keyof InArabic<T, Dict>]])
  ) as T;
};


