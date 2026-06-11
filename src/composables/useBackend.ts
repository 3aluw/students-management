import type {
  EventQueryFilters,
  Class,
  NewClass,
  EditClass,
  StudentsQueryFilters,
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
  NewAbsence,
  NewLateness,
  SchoolSeason,
  EditSchoolSeason,
  NewSeasonPayload,
} from "~/data/types";

export default function () {
  // ========== Class functions ==========
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

  // ========== Student functions ==========
  const getStudents = (query: StudentsQueryFilters) => {
    const params = new URLSearchParams();

    if (query.name && query.name.trim().length) params.append("name", query.name);
    if ("class_id" in query && query.class_id !== undefined)
      params.append("class_id", String(query.class_id));
    if (query.status) params.append("status", query.status);
    if ("exited_at_Year" in query && query.exited_at_Year !== undefined)
      params.append("exited_at_Year", String(query.exited_at_Year));

    return $fetch<Student[]>(`/api/students/?${params.toString()}`);
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

  // ========== Absence functions ==========
  const getAbsences = (params: EventQueryFilters) => {
    return $fetch<{ absences: LocalAbsence[]; total: number }>(
      `/api/absences`,
      {
        params,
      },
    );
  };
  const insertAbsences = (body: NewAbsence[]) => {
    return $fetch<{
      success: boolean;
      insertedCount: number;
      skippedIds: number[];
    }>("/api/absences", {
      method: "POST",
      body,
    });
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

  // ========== Lateness functions ==========
  const getLateness = (params: EventQueryFilters) => {
    return $fetch<{ lateness: LocalLateness[]; total: number }>(
      `/api/lateness`,
      {
        params,
      },
    );
  };
  const insertLateness = (body: NewLateness[]) => {
    return $fetch<{
      success: boolean;
      insertedCount: number;
      skippedIds: number[];
    }>("/api/lateness", {
      method: "POST",
      body,
    });
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

  // ========== Season functions ==========
  const getSeasons = () => {
    return $fetch<SchoolSeason[]>("/api/season");
  };
  const createSeason = (body: NewSeasonPayload) => {
    return $fetch("/api/season", {
      method: "POST",
      body,
    });
  };
  const updateSeasons = (body: EditSchoolSeason) => {
    return $fetch("/api/season", {
      method: "POST",
      body,
    });
  };
  const deleteSeason = (seasonId: number) => {
    return $fetch(`/api/season/?id=${seasonId}`, {
      method: "DELETE",
    });
  };
  return {
    createClass,
    updateClass,
    getClasses,
    deleteClass,
    getStudents,
    createStudent,
    deleteStudents,
    updateStudents,
    getAbsences,
    insertAbsences,
    deleteAbsences,
    updateAbsences,
    getLateness,
    insertLateness,
    updateLateness,
    deleteLateness,
    getSeasons,
    createSeason,
    updateSeasons,
    deleteSeason
  };
}
