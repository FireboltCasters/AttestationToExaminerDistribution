import {JSONToGraph} from "../../api/src";
import cheerio from 'cheerio';
import PlanEditHelper from "../../api/src/ignoreCoverage/PlanEditHelper";
import StudIPTableEntry from "../../api/src/ignoreCoverage/StudIPTableEntry";
import ParseStudIPCSVToJSON from "../../api/src/ignoreCoverage/ParseStudIPCSVToJSON";

// german and english weekday names of the table header => internal weekday
const weekdayTranslation: Record<string, string> = {
    montag: 'Monday',
    dienstag: 'Tuesday',
    mittwoch: 'Wednesday',
    donnerstag: 'Thursday',
    freitag: 'Friday',
    samstag: 'Saturday',
    sonntag: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
};

/**
 * Import and export of the plan as HTML table for Stud.IP.
 * Every cell contains a list, every list item is one slot of a tutor, see StudIPTableEntry for the format:
 * "Anna & Ben (bei Nils Baumgartner) [Präsenz]" or for a free slot "(bei Nils Baumgartner) [Präsenz]"
 */
export default class HtmlTableStudIp {

    static escapeHtml(text: string): string {
        return ("" + text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    static getTableTdsFromList(list: string[]): string {
        let tds = "";
        for(let item of list) {
            tds += '\t\t\t<td>' + item + '</td>\n';
        }
        return tds;
    }

    static getContentForCell(time: string, day: string, plan: any): string {
        let groups = plan?.groups || {};
        let tutors = plan?.tutors || {};
        let entries: string[] = [];

        let groupNames = Object.keys(groups)
            .filter((groupName) => groups[groupName]?.selectedSlot?.time === time && groups[groupName]?.selectedSlot?.day === day)
            .sort((a, b) => ("" + groups[a].selectedSlot.tutor).localeCompare("" + groups[b].selectedSlot.tutor) || a.localeCompare(b));
        for(const groupName of groupNames) {
            let tutor = groups[groupName].selectedSlot.tutor;
            entries.push(StudIPTableEntry.format({
                members: PlanEditHelper.getMembers(plan, groupName),
                tutor: tutor,
                condition: JSONToGraph.getTutorSlotCondition(plan, tutor, day, time),
            }));
        }

        // free slots of the tutors
        for(const tutor of Object.keys(tutors).sort()) {
            let slot = {tutor, day, time};
            if(PlanEditHelper.isTutorSlotFree(plan, slot)) {
                entries.push(StudIPTableEntry.format({
                    members: [],
                    tutor: tutor,
                    condition: JSONToGraph.getTutorSlotCondition(plan, tutor, day, time),
                }));
            }
        }

        if(entries.length === 0) {
            return "";
        }
        let listContent = entries.map((entry) => `\t\t\t\t<li>${HtmlTableStudIp.escapeHtml(entry)}</li>\n`).join("");
        return `\t\t\t<ul>\n${listContent}\t\t\t</ul>\n`;
    }

    static getPlanAsStudipTable(newPlan: any, oldPlan: any) {
        let usePlan = newPlan || oldPlan;

        let workingWeekdays = JSONToGraph.getWorkingWeekdays();
        let timeslots = JSONToGraph.getTimeslots(usePlan);

        let headerTexts = ["Uhrzeit"];
        for(let weekday of workingWeekdays) {
            headerTexts.push(JSONToGraph.getWeekdayTranslation(weekday));
        }
        let header = '\t\t<tr>\n' +
            HtmlTableStudIp.getTableTdsFromList(headerTexts) +
            '\t\t</tr>';

        let rows = "";
        for(let timeslot of timeslots) {
            let rowTexts = [timeslot];
            for(let weekday of workingWeekdays) {
                rowTexts.push(HtmlTableStudIp.getContentForCell(timeslot, weekday, usePlan));
            }
            rows += '\t\t<tr>\n' +
                HtmlTableStudIp.getTableTdsFromList(rowTexts) +
                '\t\t</tr>\n';
        }

        return '<!--HTML-->\n<figure class="table">\n<table>\n' +
            '\t<tbody>\n' +
            header + '\n' +
            rows + '\n' +
            '\t</tbody>\n' +
            '</table>\n</figure>';
    }

    /**
     * Returns for every column of the table the weekday, using the header row (german or english names).
     * Falls back to Monday - Friday.
     */
    static getColumnWeekdays($: any, headerRow: any): (string | undefined)[] {
        let columnWeekdays: (string | undefined)[] = [];
        $(headerRow).find('td, th').each((index: number, cell: any) => {
            columnWeekdays[index] = weekdayTranslation[$(cell).text().trim().toLowerCase()];
        });
        if(columnWeekdays.filter((weekday) => !!weekday).length === 0) {
            return [undefined, ...JSONToGraph.getWorkingWeekdays()];
        }
        return columnWeekdays;
    }

    static htmlToJson(htmlData: string): any {
        const $ = cheerio.load(htmlData);

        const data: any = {
            groups: {},
            tutors: {},
            tutorMultipliers: {},
            tutorSlotConditions: {},
        };

        let rows = $('tr').toArray();
        if(rows.length === 0) {
            return data;
        }
        let columnWeekdays = HtmlTableStudIp.getColumnWeekdays($, rows[0]);

        for(const row of rows.slice(1)) {
            const cells = $(row).find('td, th').toArray();
            const time = ParseStudIPCSVToJSON.normalizeTime($(cells[0]).text().trim());

            cells.forEach((cell: any, index: number) => {
                let day = columnWeekdays[index];
                if(index === 0 || !day) {
                    return;
                }

                $(cell).find('li').each((_: any, li: any) => {
                    let entry = StudIPTableEntry.parse($(li).text());
                    if(!entry) {
                        return;
                    }
                    let tutor = entry.tutor;
                    let slot = {tutor, day: day as string, time};

                    data.tutors[tutor] = data.tutors[tutor] || {};
                    data.tutors[tutor][slot.day] = data.tutors[tutor][slot.day] || {};
                    data.tutors[tutor][slot.day][time] = true;
                    if(data.tutorMultipliers[tutor] === undefined) {
                        data.tutorMultipliers[tutor] = 1;
                    }
                    if(entry.condition) {
                        data.tutorSlotConditions[tutor] = data.tutorSlotConditions[tutor] || {};
                        data.tutorSlotConditions[tutor][slot.day] = data.tutorSlotConditions[tutor][slot.day] || {};
                        data.tutorSlotConditions[tutor][slot.day][time] = entry.condition;
                    }

                    if(entry.members.length > 0) {
                        let groupName = PlanEditHelper.getGroupNameFromMembers(entry.members);
                        let group = data.groups[groupName];
                        if(!group) {
                            group = {
                                members: [...entry.members],
                                selectedSlot: slot,
                                possibleSlots: {},
                            };
                            data.groups[groupName] = group;
                        }
                        PlanEditHelper.addPossibleSlot(group, slot.day, time);
                    }
                });
            });
        }

        return data;
    }

}
