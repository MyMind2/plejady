import { z } from "zod";

export const studentClasses = [
  "Kvinta A",
  "Kvinta B",
  "Prvák",
  "Sexta A",
  "Sexta B",
  "Druhák",
  "Septima A",
  "Septima B",
  "Třeťák",
  "Oktáva A",
  "Oktáva B",
  "Čtvrťák",
] as const;

export const studentClassSchema = z.enum(studentClasses);
export type StudentClass = z.infer<typeof studentClassSchema>;
