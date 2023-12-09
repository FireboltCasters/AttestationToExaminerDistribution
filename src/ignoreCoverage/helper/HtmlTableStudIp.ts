import React, {Component} from "react";
import {JSONToGraph} from "../../api/src";
import cheerio from 'cheerio';

const weekdayTranslation: Record<string, string> = {
    Montag: 'Monday',
    Dienstag: 'Tuesday',
    Mittwoch: 'Wednesday',
    Donnerstag: 'Thursday',
    Freitag: 'Friday',
};

interface TutorTimes {
    [tutor: string]: {
        [day: string]: {
            [time: string]: boolean;
        };
    };
}

interface Group {
    selectedSlot: {
        tutor: string;
        day: string;
        time: string;
    };
    possibleSlots: {
        [day: string]: {
            [time: string]: boolean;
        };
    };
}

interface Data {
    groups: { [name: string]: Group };
    tutors: TutorTimes;
    tutorMultipliers: { [tutor: string]: number };
}

export default class HtmlTableStudIp {

    static getTableTdsFromList(list: string[]): string{
        let tds = "";
        for(let item of list){
            tds += '\t\t\t<td>'+item+'</td>\n';
        }
        return tds;
    }

    static getContentForCell(time: string, day: string, plan: any, tutors: TutorTimes): string {
        let groups = plan?.groups || {};
        let groupNames = Object.keys(groups);
        let content = "";
        let listContent = "";
        for (let groupName of groupNames) {
            let group = groups[groupName];
            let selectedSlot = group?.selectedSlot;
            if (selectedSlot?.time === time && selectedSlot?.day === day) {
                let tutor = selectedSlot?.tutor;
                listContent += `\t\t\t\t<li>${groupName} (bei ${tutor})</li>\n`;
            }
        }

        // Check if any tutor is available at this timeslot
        for (const tutor in tutors) {
            if (tutors[tutor][day] && tutors[tutor][day][time]) {
                // Check if this slot is not already taken by a group
                if (!listContent.includes(`(bei ${tutor})`)) {
                    listContent += `\t\t\t\t<li>(bei ${tutor})</li>\n`;
                }
            }
        }

        if (listContent) {
            content = `\t\t\t<ul>\n${listContent}\t\t\t</ul>\n`;
        }
        return content;
    }


    static getPlanAsStudipTable(newPlan: any, oldPlan: any) {
        let usePlan = newPlan || oldPlan;
        let tutors = usePlan.tutors || {};

        let workingWeekdays = JSONToGraph.getWorkingWeekdays();
        let timeslots = JSONToGraph.getTimeslots();

        let headerTexts = ["Uhrzeit"];
        for (let weekday of workingWeekdays) {
            let germanWeekday = JSONToGraph.getWeekdayTranslation(weekday);
            headerTexts.push(germanWeekday);
        }
        let header = '\t\t<tr>\n' +
            HtmlTableStudIp.getTableTdsFromList(headerTexts) +
            '\t\t</tr>';

        let rows = "";
        for (let timeslot of timeslots) {
            let rowTexts = [timeslot];
            for (let weekday of workingWeekdays) {
                let textForCell = HtmlTableStudIp.getContentForCell(timeslot, weekday, usePlan, tutors);
                rowTexts.push(textForCell);
            }

            let row = '\t\t<tr>\n' +
                HtmlTableStudIp.getTableTdsFromList(rowTexts) +
                '\t\t</tr>\n';
            rows += row;
        }

        return '<!--HTML-->\n<figure class="table">\n<table>\n' +
            '\t<tbody>\n' +
            header + '\n' +
            rows + '\n' +
            '\t</tbody>\n' +
            '</table>\n</figure>';
    }

    static getTutorsList($: any): Set<string> {
        const tutors = new Set<string>();
        $('li').each((_: any, element: any) => {
            const text = $(element).text();
            const match = text.match(/\(bei (.+?)\)/);
            if (match) {
                tutors.add(match[1].trim());
            }
        });
        return tutors;
    }

    static extractGroupAndTutor(text: string): [string | null, string | null] {
        const matchTwo = text.match(/(.+?) & (.+?) \(bei (.+?)\)/);
        if (matchTwo) {
            const groupName = matchTwo[1].trim() + ' & ' + matchTwo[2].trim();
            const tutorName = matchTwo[3].trim();
            return [groupName, tutorName];
        }

        const matchOne = text.match(/(.+?) \(bei (.+?)\)/);
        if (matchOne) {
            return [matchOne[1].trim(), matchOne[2].trim()];
        }

        return [null, null];
    }

    static parseHtmlForData($: any): [Record<string, Group>, TutorTimes] {
        const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
        const groups: Record<string, Group> = {};
        const tutorsTimes: TutorTimes = {};

        $('tr').slice(1).each((_: any, tr: any) => {
            const cells = $(tr).find('td');
            const time = cells.first().text().trim();

            days.forEach((day, index) => {
                const englishDay = weekdayTranslation[day];
                $(cells[index + 1]).find('li').each((_: any, li: any) => {
                    const text = $(li).text();

                    if (text.startsWith('(bei ')) {
                        const tutorName = text.match(/\(bei (.+?)\)/)[1].trim();
                        tutorsTimes[tutorName] = tutorsTimes[tutorName] || {};
                        tutorsTimes[tutorName][englishDay] = tutorsTimes[tutorName][englishDay] || {};
                        tutorsTimes[tutorName][englishDay][time] = true;
                    } else {
                        const [groupName, tutorName] = HtmlTableStudIp.extractGroupAndTutor(text);

                        if (!groupName || !tutorName) return;

                        if (!groups[groupName]) {
                            groups[groupName] = {
                                selectedSlot: { tutor: tutorName, day: englishDay, time },
                                possibleSlots: { [englishDay]: { [time]: true } },
                            };
                        } else {
                            groups[groupName].possibleSlots[englishDay] = groups[groupName].possibleSlots[englishDay] || {};
                            groups[groupName].possibleSlots[englishDay][time] = true;
                        }

                        tutorsTimes[tutorName] = tutorsTimes[tutorName] || {};
                        tutorsTimes[tutorName][englishDay] = tutorsTimes[tutorName][englishDay] || {};
                        tutorsTimes[tutorName][englishDay][time] = true;
                    }
                });
            });
        });

        return [groups, tutorsTimes];
    }


    static htmlToJson(htmlData: string): any {
        const $ = cheerio.load(htmlData);

        const data: Data = {
            groups: {},
            tutors: {},
            tutorMultipliers: {},
        };

        const tutors = HtmlTableStudIp.getTutorsList($);
        tutors.forEach((tutor) => {
            data.tutors[tutor] = {};
            data.tutorMultipliers[tutor] = 1;
        });

        const [groups, tutorsTimes] = HtmlTableStudIp.parseHtmlForData($);

        data.groups = groups;
        for (const [tutor, times] of Object.entries(tutorsTimes)) {
            data.tutors[tutor] = times;
        }

        return data;
    }

}
