import { z } from "zod";

export const studentClasses = [
  "Kvinta A",
  "Sexta A",
  "Septima A",
  "Oktáva A",
  "Kvinta B",
  "Sexta B",
  "Septima B",
  "Oktáva B",
  "Prvák",
  "Druhák",
  "Třeťák",
  "Čtvrťák",
] as const;

export const studentClassSchema = z.enum(studentClasses);
export type StudentClass = z.infer<typeof studentClassSchema>;
