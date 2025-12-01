import type {
  EventQueryFilters,
  Class,
  NewClass,
  EditClass,
  Student,
  NewStudent,
  EditStudent,
  BatchEditStudent,
  LocalAbsence,
  Absence,
  BatchEditAbsence,
  EditAbsence,
  LocalLateness,
  Lateness,
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

  const getAbsences = (params: EventQueryFilters) => {
    return $fetch<{ absences: LocalAbsence[]; total: number }>(
      `/api/absences`,
      {
        params,
      }
    );
  };
  const deleteAbsences = (body: Absence["id"][]) => {
    return $fetch(`/api/absences/`, {
      method: "DELETE",
      body,
    });
  };
  const updateAbsences = (body: BatchEditAbsence | EditAbsence) => {
    return $fetch("/api/absences", {
      method: "POST",
      body,
    });
  };
  const getLateness = (params: EventQueryFilters) => {
    return $fetch<{ lateness: LocalLateness[]; total: number }>(
      `/api/lateness`,
      {
        params,
      }
    );
  };
  const updateLateness = (body: BatchEditAbsence | EditAbsence) => {
    return $fetch("/api/lateness", {
      method: "POST",
      body,
    });
  };
  const deleteLateness = (body: Lateness["id"][]) => {
    return $fetch(`/api/lateness/`, {
      method: "DELETE",
      body,
    });
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
    deleteAbsences,
    updateAbsences,
    getLateness,
    updateLateness,
    deleteLateness
  };
}
