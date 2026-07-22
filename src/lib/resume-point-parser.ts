export type ResumePointCandidate = {
  title: string;
  chinese: string;
  english: string;
};

function tagContent(block: string, tag: string) {
  const startTag = "<" + tag + ">";
  const endTag = "</" + tag + ">";
  const start = block.indexOf(startTag);
  const end = block.indexOf(endTag, start + startTag.length);
  if (start < 0 || end < 0) return "";
  return block.slice(start + startTag.length, end).trim();
}

export function parseResumePointCandidate(raw: string): {
  reply: string;
  point?: ResumePointCandidate;
} {
  const opening = "<resume-point>";
  const closing = "</resume-point>";
  const start = raw.indexOf(opening);
  const end = raw.indexOf(closing, start + opening.length);

  if (start < 0 || end < 0) {
    return { reply: raw.trim() };
  }

  const block = raw.slice(start + opening.length, end);
  const title = tagContent(block, "title");
  const chinese = tagContent(block, "zh");
  const english = tagContent(block, "en");
  if (!title || !chinese || !english) {
    return { reply: raw.trim() };
  }

  const reply = (raw.slice(0, start) + raw.slice(end + closing.length)).trim();
  return {
    reply: reply || "我已整理出一条候选要点，你可以直接编辑后收藏。",
    point: { title, chinese, english },
  };
}