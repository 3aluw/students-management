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
  Absence,
  BatchEditAbsence,
  EditAbsence,
  Lateness,
  NewAbsence,
  NewLateness,
  SchoolSeason,
  EditSchoolSeason,
  NewSeasonPayload,
  Infraction,
  EditLateness,
  BatchEditLateness,
  NewInfraction,
  BatchEditInfraction,
  EditInfraction,
} from "~/models/types";

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
  const getStudents = (query: StudentsQueryFilters | { ids: number[] }) => {
    const params = new URLSearchParams();
    
    if ('ids' in query) {
      query.ids.forEach(id => {
        params.append("ids", `${id}`);
      });
      return $fetch<Student[]>(`/api/students/?${params.toString()}`)
    }

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
  const createStudents = (body: NewStudent[]) => {
    return $fetch("/api/students", {
      method: "POST",
      body,
    });
  }
  const updateStudents = (body: EditStudent | EditStudent[] | BatchEditStudent) => {
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
    return $fetch(
      `/api/absences`,
      {
        params,
      },
    );
  };
  const insertAbsences = (body: NewAbsence[]) => {
    return $fetch("/api/absences", {
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
    return $fetch(
      `/api/lateness`,
      {
        params,
      },
    );
  };
  const insertLateness = (body: NewLateness[]) => {
    return $fetch("/api/lateness", {
      method: "POST",
      body,
    });
  };
  const updateLateness = (body: BatchEditLateness | EditLateness) => {
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

  // ========== infraction functions ==========
  const getInfractions = (params: EventQueryFilters) => {
    return $fetch(
      `/api/infraction`,
      {
        params,
      },
    );
  };
  const insertInfractions = (body: NewInfraction[]) => {
    return $fetch("/api/infraction", {
      method: "POST",
      body,
    });
  };
  const updateInfractions = (body: BatchEditInfraction | EditInfraction) => {
    return $fetch("/api/infraction", {
      method: "POST",
      body,
    });
  };
  const deleteInfractions = (body: Infraction["id"][]) => {
    return $fetch(`/api/infraction/`, {
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
    createStudents,
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
    getInfractions,
    updateInfractions,
    insertInfractions,
    deleteInfractions,
    getSeasons,
    createSeason,
    updateSeasons,
    deleteSeason
  };
}
