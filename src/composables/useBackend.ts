import type { Class, NewClass, EditClass, Student } from "~/data/types";

export default function () {
  const createClass = (body: NewClass) => {
    return $fetch("/api/classes", {
      method: "POST",
      body,
    });
  };
  const updateClass = (body: EditClass) => {
    return $fetch("/api/classes", {
      method: "POST",
      body,
    });
  };
  const getClasses = () => {
    return $fetch<Class[]>("/api/classes");
  };
  const deleteClass = (classId: number) => {
    return $fetch(`/api/classes/?id=${classId}`, {
      method: "DELETE",
    });
  };

  const getStudentsByClass = (classId: number) => {
       return $fetch<Student[]>(`/api/students/?id=${classId}`)
  };

  return { createClass, updateClass, getClasses, deleteClass,
    getStudentsByClass
   };
}
