import type { Class } from "~/data/types";

export default function () {
  const getClasses = () => {
    return $fetch<Class[]>("/api/classes");
  };
  const deleteClass = (classId: string) => {
    return $fetch(`/api/classes/?id=${classId}`, {
      method: "DELETE",
    });
  }

  return {
    getClasses, deleteClass
  };
}
