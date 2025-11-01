import { ArabicStudentProperties } from "~/data/static";

export default function () {
  const getRequiredFieldMessage = (
    fieldName: keyof typeof ArabicStudentProperties,
    type: "text" | "choice" = "text"
  ) => {
    return type === "text" ?`يجب إدخال ${ArabicStudentProperties[fieldName]}` 
        : type == "choice" ? `يجب اختيار ${ArabicStudentProperties[fieldName]}` : "هذا الحقل مطلوب";
  };
  return {
    getRequiredFieldMessage
  };
}
