import {generatedText} from './journal-activity.js';
export function journalDay(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part=type=>parts.find(p=>p.type===type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function journalMarkdown(entry){
  return `# ${entry.day}\n\n## My reflection\n\n${entry.reflection}\n\n## Activity notes — written by me\n\n${entry.recap}\n\nLast file save: ${entry.updatedAt||'unsaved draft'}\nExport includes current text and may contain unsaved edits.\n\n## Generated recap — model-authored\n\n${generatedText(entry.generated)}\n\nHermes activity: not connected.\n`;
}
