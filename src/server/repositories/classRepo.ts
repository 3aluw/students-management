import db from '~/db/db';
import type { Class } from '~/data/types';

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
    }
}