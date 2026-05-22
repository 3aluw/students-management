import db from '~/db/db';
import type { EditClass, NewClass, Class } from "~/data/types";
import useDBUtils from '~/composables/useDBUtils';
 
const { generateDBSetClause } = useDBUtils();

export const classRepo = {
    getClasses() {
        const stmt = db.prepare('SELECT * FROM class');
        const classes = stmt.all();
        return classes as Class[];
    },

    deleteClass(id: number) {
        const stmt = db.prepare(`
    DELETE FROM class WHERE id = ?
    `);
        const result = stmt.run(id)
        return result
    },

    createClass(classObject: NewClass) {
        const { grade, school_level, section } = classObject;

        const stmt = db.prepare(
            "INSERT INTO class (grade, school_level,section) VALUES (?, ?, ?)"
        );
        const result = stmt.run(grade, school_level, section);
        return result
    },

    editClass(classObject: EditClass) {
    const values = Object.values(classObject);

    const setClause = generateDBSetClause(classObject);
    const stmt = db.prepare(`UPDATE class SET ${setClause} WHERE id = ?`);
    const result = stmt.run(...values, classObject.id);
    return result;
    }
}