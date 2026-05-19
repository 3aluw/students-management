import { classService } from "~/server/services/classService";

export default defineEventHandler(() => classService.getClasses()
);

