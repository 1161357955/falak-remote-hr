export function extractMentionedWorkers(content, workers = []) {
  if (!content) return [];
  return workers.filter((w) => w.full_name && content.includes(`@${w.full_name}`));
}