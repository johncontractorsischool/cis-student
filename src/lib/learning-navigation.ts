export type LearningArea = "audio" | "practice" | "reading" | "resources" | "video";

function matchesSegment(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function learningAreaForPathname(pathname: string): LearningArea | null {
  if (matchesSegment(pathname, "/practice")) return "practice";
  if (matchesSegment(pathname, "/courses/video") || matchesSegment(pathname, "/videos")) return "video";
  if (matchesSegment(pathname, "/courses/reading") || matchesSegment(pathname, "/reading")) return "reading";
  if (matchesSegment(pathname, "/courses/audio") || matchesSegment(pathname, "/audio")) return "audio";
  if (matchesSegment(pathname, "/resources")) return "resources";
  return null;
}
