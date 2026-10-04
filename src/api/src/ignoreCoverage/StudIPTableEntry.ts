import ParseStudIPCSVToJSON from "./ParseStudIPCSVToJSON";

export interface StudIPTableEntryData {
    members: string[];
    tutor: string;
    condition?: string;
}

/**
 * One entry (list item) of a cell in the Stud.IP HTML table.
 * Format: "Anna & Ben (bei Nils Baumgartner) [Präsenz]"
 *  - students before "(bei ...)", separated by " & " (empty for a free slot)
 *  - the tutor inside "(bei ...)"
 *  - the optional condition of the tutor for this slot in square brackets
 */
export default class StudIPTableEntry {

    static TUTOR_PREFIX = "(bei ";

    static format(entry: StudIPTableEntryData): string {
        let text = "";
        if(entry.members.length > 0) {
            text += entry.members.join(" & ") + " ";
        }
        text += StudIPTableEntry.TUTOR_PREFIX + entry.tutor + ")";
        if(entry.condition) {
            text += " [" + entry.condition + "]";
        }
        return text;
    }

    /**
     * Parses an entry. Also understands older formats like "Anna (bei Nils Baumgartner (Online))".
     */
    static parse(text: string): StudIPTableEntryData | undefined {
        let normalized = ("" + text).replace(/\s+/g, " ").trim();
        let start = normalized.indexOf(StudIPTableEntry.TUTOR_PREFIX);
        if(start < 0) {
            return undefined;
        }

        // find the closing bracket of "(bei ...", the tutor may contain a condition in brackets
        let depth = 0;
        let end = -1;
        for(let i = start; i < normalized.length; i++) {
            if(normalized[i] === "(") {
                depth++;
            } else if(normalized[i] === ")") {
                depth--;
                if(depth === 0) {
                    end = i;
                    break;
                }
            }
        }
        if(end < 0) {
            end = normalized.length;
        }

        let inner = normalized.substring(start + StudIPTableEntry.TUTOR_PREFIX.length, end).trim();
        let before = normalized.substring(0, start).trim();
        let after = normalized.substring(end + 1).trim();

        let {tutor, condition} = ParseStudIPCSVToJSON.parseTutorAndCondition(inner);
        if(!tutor) {
            return undefined;
        }

        let conditionAfter = after
            .replace(/^[\s\-–:,]+/, "")
            .replace(/^\[([\s\S]*)\]$/, "$1")
            .replace(/^\(([\s\S]*)\)$/, "$1")
            .trim();
        if(conditionAfter.length > 0) {
            condition = conditionAfter;
        }

        let members = before.length > 0
            ? before.split("&").map((member) => member.trim()).filter((member) => member.length > 0)
            : [];

        let result: StudIPTableEntryData = {members, tutor};
        if(condition) {
            result.condition = condition;
        }
        return result;
    }
}
