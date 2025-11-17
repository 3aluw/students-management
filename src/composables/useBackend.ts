import type {
  Class,
  NewClass,
  EditClass,
  Student,
  NewStudent,
  EditStudent,
  BatchEditStudent,
  LocalAbsence,
} from "~/data/types";

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
    return $fetch<Student[]>(`/api/students/?classId=${classId}`);
  };
  const getStudentsByName = (name: string) => {
    return $fetch<Student[]>(`/api/students/?name=${name}`);
  };
  const createStudent = (body: NewStudent) => {
    return $fetch("/api/students", {
      method: "POST",
      body,
    });
  };
  const updateStudents = (body: EditStudent | BatchEditStudent) => {
    return $fetch("/api/students", {
      method: "POST",
      body,
    });
  };
  const deleteStudents = (body: Student["id"][]) => {
    return $fetch(`/api/students/`, {
      method: "DELETE",
      body,
    });
  };


  const getAbsences = () => {
    return $fetch<LocalAbsence[]>(`/api/absences`);
  };
  return {
    createClass,
    updateClass,
    getClasses,
    deleteClass,
    getStudentsByClass,
    getStudentsByName,
    createStudent,
    deleteStudents,
    updateStudents,
    getAbsences,
  };
}
