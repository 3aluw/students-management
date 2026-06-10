import { arabicProperties } from "~/data/static";
  
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


