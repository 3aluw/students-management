import { defineStore, acceptHMRUpdate } from "pinia";
import type { Class, Student } from "~/data/types";
export const useStudentStore = defineStore("studentStore", () => {

  const classes = ref<Class[]>();
  const students = ref<Student[]>();
  const searchedStudents = ref<Student[]>();

  return {classes, students, searchedStudents};
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStudentStore, import.meta.hot));
}
