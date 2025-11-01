import { ArabicStudentProperties, ArabicClassProperties } from "~/data/static";
import type { Student, Class } from "~/data/types";

export default function () {
  const formatRequiredFieldMessage = (
    arabicText: string,
    type: "text" | "choice" = "text"
  ) =>
    type === "text"
      ? `يجب إدخال ${arabicText}`
      : type == "choice"
      ? `يجب اختيار ${arabicText}`
      : "هذا الحقل مطلوب";

  const getRequiredFieldMessage = (
    fieldName: keyof typeof ArabicStudentProperties | keyof Class,
    type: "text" | "choice" = "text"
  ) => {
    return fieldName in ArabicStudentProperties
      ? formatRequiredFieldMessage(
          ArabicStudentProperties[fieldName as keyof Student],
          type
        )
      : fieldName in ArabicClassProperties
      ? formatRequiredFieldMessage(
          ArabicClassProperties[fieldName as keyof Class],
          type
        )
      : "هذا الحقل مطلوب";
  };
  return {
    getRequiredFieldMessage,
  };
}
