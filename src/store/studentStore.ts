import { defineStore, acceptHMRUpdate } from "pinia";
import type { Class, Student } from "~/data/types";
export const useStudentStore = defineStore("studentStore", () => {
  const backend = useBackend();

  const classes = ref<Class[]>([]);
  const students = ref<Student[]>([]);
  const searchedStudents = ref<Student[]>([]);

  const populateClasses = async () => {
    classes.value = await backend.getClasses();
  };
  const populateStudents = async (classId: number) => {
    students.value = await backend.getStudentsByClass(classId);
  };
  
  const classOptions = computed(() => {
    return classes.value.map((cls) => ({
      label: cls.grade + ' ' +   cls.school_level + ' ' + cls.section,
      value: cls.id,
    }));
  });
  return {
    classes,
    students,
    searchedStudents,
    populateClasses,
    populateStudents,
    classOptions,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStudentStore, import.meta.hot));
}
