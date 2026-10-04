import HtmlTableStudIp from "./HtmlTableStudIp";
import {ExampleCSVContent} from "../../api/src";

test('Export and import of the Stud.IP table keeps students, tutors and conditions apart', () => {
    let plan = ExampleCSVContent.getExampleParsedJSON();
    let html = HtmlTableStudIp.getPlanAsStudipTable(null, plan);
    expect(html).toContain("(bei Alan Turing) [Online]");
    expect(html).toContain("[Online unter Vorbehalt, sonst in Präsenz]");

    let imported = HtmlTableStudIp.htmlToJson(html);
    expect(imported.tutors).toEqual(plan.tutors);
    expect(imported.tutorSlotConditions).toEqual(plan.tutorSlotConditions);
    expect(Object.keys(imported.groups).sort()).toEqual(Object.keys(plan.groups).sort());
    for(const groupName of Object.keys(plan.groups)) {
        expect(imported.groups[groupName].members).toEqual(plan.groups[groupName].members);
        expect(imported.groups[groupName].selectedSlot).toEqual(plan.groups[groupName].selectedSlot);
    }
});

test('Older tables with conditions inside the tutor brackets are imported', () => {
    let html = "<table><tr><td>Uhrzeit</td><td>Montag</td><td>Dienstag</td></tr>" +
        "<tr><td>8:00</td><td><ul><li>Anna &amp; Ben (bei Nils (Präsenz))</li><li>(bei Nils)</li></ul></td><td><ul><li>Clara (bei Kolmogorov)</li></ul></td></tr></table>";
    let imported = HtmlTableStudIp.htmlToJson(html);
    expect(imported.groups["Anna & Ben"].selectedSlot).toEqual({tutor: "Nils", day: "Monday", time: "08:00"});
    expect(imported.groups["Clara"].selectedSlot).toEqual({tutor: "Kolmogorov", day: "Tuesday", time: "08:00"});
    expect(imported.tutorSlotConditions).toEqual({Nils: {Monday: {"08:00": "Präsenz"}}});
    expect(Object.keys(imported.tutors)).toEqual(["Nils", "Kolmogorov"]);
});
