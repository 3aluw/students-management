/*===============  utils for entities (Students & classes)  ====================== */
type ClassOptions = {
    label: string;
    value: number;
}[]
export const getClassName = (classOptions: ClassOptions,classId: number) => classOptions.find((cl) => cl.value === classId)?.label