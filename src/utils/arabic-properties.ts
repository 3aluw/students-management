import { ArabicAbsenceProperties, arabicProperties } from "~/data/static";
import type { InArabic, PropDict, ArabicKeysOf, XLSXTypes } from "~/data/types";

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



export const transformToArabic = <T extends XLSXTypes, Dict extends PropDict<T>>(
  itemObj: T,
  arabicPropsDict: Dict
): InArabic<T, Dict> => {
  // Initialize with a type cast to our final shape
  const studentInArabic = {} as InArabic<T, Dict>;

  for (const key of Object.keys(itemObj) as Array<keyof T>) {
    const arabicKey = arabicPropsDict[key];

    // We use a type assertion here because TypeScript's compiler 
    // struggles to track dynamic correlated properties inside a loop.
    (studentInArabic as any)[arabicKey] = itemObj[key];
  }
  return studentInArabic as InArabic<T, Dict>;
}


export const transformToEnglish = <T extends object, Dict extends PropDict<T>>(
  arabicObj: InArabic<T, Dict>,
  dict: Dict
): T => {
  const reverseDict = Object.fromEntries(
    (Object.entries(dict) as Array<[keyof T, string]>).map(([enKey, arVal]) => [arVal, enKey])
  ) as Record<ArabicKeysOf<Dict>, keyof T>;

  return Object.fromEntries(
    (Object.keys(arabicObj) as Array<ArabicKeysOf<Dict>>)
      .filter((arKey) => reverseDict[arKey] !== undefined)
      .map((arKey) => [reverseDict[arKey], arabicObj[arKey as keyof InArabic<T, Dict>]])
  ) as T;
};
