export function compareRoomNumbers(first: string, second: string) {
  return first.localeCompare(second, "cs", {
    numeric: true,
    sensitivity: "base",
  });
}
