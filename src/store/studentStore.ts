import { defineStore, acceptHMRUpdate } from "pinia";
import type { Class, Student } from "~/data/types";
export const useStudentStore = defineStore("studentStore", () => {
  const backend = useBackend();

  const classes = ref<Class[]>();
  const students = ref<Student[]>();
  const searchedStudents = ref<Student[]>();

  const populateClasses = async () => {
    classes.value = await backend.getClasses();
  };

  return { classes, students, searchedStudents, populateClasses };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStudentStore, import.meta.hot));
}
