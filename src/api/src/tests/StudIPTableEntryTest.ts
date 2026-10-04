import StudIPTableEntry from "../ignoreCoverage/StudIPTableEntry";
import ParseStudIPCSVToJSON from "../ignoreCoverage/ParseStudIPCSVToJSON";
import ExampleCSVContent from "../ignoreCoverage/ExampleCSVContent";

test('Entries are formatted with students, tutor and condition separated', () => {
    expect(StudIPTableEntry.format({members: ["Anna", "Ben"], tutor: "Nils Baumgartner", condition: "Online unter Vorbehalt, sonst in Präsenz"}))
        .toBe("Anna & Ben (bei Nils Baumgartner) [Online unter Vorbehalt, sonst in Präsenz]");
    expect(StudIPTableEntry.format({members: [], tutor: "Nils Baumgartner"})).toBe("(bei Nils Baumgartner)");
});

test('Entries are parsed back', () => {
    let entries = [
        {members: ["Anna", "Ben"], tutor: "Nils Baumgartner", condition: "Online unter Vorbehalt, sonst in Präsenz"},
        {members: ["Anna"], tutor: "Nils Baumgartner"},
        {members: [], tutor: "Nils Baumgartner", condition: "Präsenz (bei Bedarf online)"},
        {members: [], tutor: "Turing"},
    ];
    for(const entry of entries) {
        expect(StudIPTableEntry.parse(StudIPTableEntry.format(entry))).toEqual(entry);
    }
});

test('Older formats are understood', () => {
    expect(StudIPTableEntry.parse("Anna & Ben (bei Nils Baumgartner (Online))"))
        .toEqual({members: ["Anna", "Ben"], tutor: "Nils Baumgartner", condition: "Online"});
    expect(StudIPTableEntry.parse("  Anna\n &  Ben  (bei   Kolmogorov)  "))
        .toEqual({members: ["Anna", "Ben"], tutor: "Kolmogorov"});
    expect(StudIPTableEntry.parse("Anna & Ben")).toBeUndefined();
});

test('The example data is the parsed example CSV', async () => {
    let parsed = await ParseStudIPCSVToJSON.parseStudIPCSVToJSON(ExampleCSVContent.getExampleCSVContent());
    delete parsed.rawSlots;
    expect(parsed).toEqual(ExampleCSVContent.getExampleParsedJSON());
    for(const groupName of Object.keys(parsed.groups)) {
        expect(parsed.groups[groupName].members.length).toBeGreaterThan(0);
    }
});
