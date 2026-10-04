import React, {createContext, FunctionComponent, useContext, useEffect, useState} from "react";

export type Language = "de" | "en";

export const LANGUAGE_OPTIONS = [
    {label: "Deutsch", value: "de"},
    {label: "English", value: "en"},
];

const translations: Record<Language, Record<string, string>> = {
    de: {
        "title": "Testat-Verteilung auf Tutor:innen",
        "subtitle": "Gruppen per Drag & Drop verschieben, tauschen oder zusammenlegen",
        "language": "Sprache",
        "time": "Uhrzeit",
        "weekday.Monday": "Montag",
        "weekday.Tuesday": "Dienstag",
        "weekday.Wednesday": "Mittwoch",
        "weekday.Thursday": "Donnerstag",
        "weekday.Friday": "Freitag",
        "weekday.Saturday": "Samstag",
        "weekday.Sunday": "Sonntag",

        "section.import": "Import",
        "section.edit": "Bearbeiten",
        "section.export": "Export",
        "section.tutors": "Auslastung der Tutor:innen",
        "section.changes": "Änderungen ({count})",
        "section.singleGroups": "Einzelgruppen ({count})",
        "section.timeplans": "Zeitpläne der Tutor:innen",

        "import.studipCsv": "Stud.IP CSV einlesen",
        "import.json": "JSON laden",
        "import.jsonText": "JSON als Text",
        "import.htmlFile": "HTML-Tabelle laden",
        "import.htmlText": "Stud.IP Tabelle als Text",
        "import.jsonTextHeader": "JSON als Text importieren",
        "import.jsonTextHint": "Bitte den JSON-Inhalt hier einfügen.",
        "import.htmlTextHeader": "Stud.IP Tabelle importieren",
        "import.htmlTextHint": "Bitte den HTML-Inhalt der Stud.IP Tabelle hier einfügen.",
        "import.error": "Der Inhalt konnte nicht gelesen werden.",

        "edit.mergeSingleGroups": "Einzelgruppen zusammenlegen",
        "edit.optimize": "Optimieren",
        "edit.switch": "Tauschen",
        "edit.undo": "Zurück",
        "edit.redo": "Vor",
        "edit.resetChanges": "Änderungen verwerfen",
        "edit.hideEmptyRows": "Leere Zeilen ausblenden",
        "history.title": "Verlauf ({current} / {count})",
        "history.hint": "Klicke auf einen Eintrag, um zu diesem Stand zu springen. Strg+Z / Strg+Y für zurück / vor.",
        "history.shortcutBack": "Strg+Z",
        "history.shortcutForward": "Strg+Y oder Strg+Umschalt+Z",
        "history.initial": "Beispiel geladen",
        "history.importCsv": "Stud.IP CSV importiert",
        "history.importJson": "JSON importiert",
        "history.importHtml": "Stud.IP Tabelle importiert",
        "history.mergeSingleGroups": "Einzelgruppen zusammengelegt",
        "history.optimize": "Optimiert",
        "history.resetChanges": "Änderungen verworfen",
        "history.moveGroup": "{group} → {tutor}, {day} {time}",
        "history.swapGroups": "{a} ⇄ {b} getauscht",
        "history.mergeGroups": "{source} + {target} zusammengelegt",
        "history.moveMember": "{member}: {source} → {target}",
        "history.moveMemberToSlot": "{member} → {tutor}, {day} {time}",
        "history.moveTutorSlot": "Slot {tutor}: {fromDay} {fromTime} → {day} {time}",
        "history.editMembers": "Mitglieder von {group} geändert",
        "history.splitGroup": "{group} aufgeteilt",
        "history.deleteGroup": "{group} gelöscht",
        "history.condition": "Bedingung {tutor}, {day} {time}: {condition}",
        "history.deleteTutorSlot": "Slot {tutor}, {day} {time} gelöscht",
        "history.addGroup": "{group} angelegt bei {tutor}, {day} {time}",
        "history.multiplier": "Faktor {tutor}: {value}",

        "export.json": "JSON herunterladen",
        "export.tutorGroups": "Gruppen je Tutor:in",
        "export.studipTable": "Stud.IP HTML-Tabelle",

        "switch.active": "Tauschmodus: Wähle zwei Slots aus (mindestens einer mit Gruppe).",
        "switch.selected": "Ausgewählt: {count} / 2",
        "switch.cancel": "Abbrechen",
        "switch.needGroup": "Mindestens einer der beiden Slots muss eine Gruppe enthalten.",
        "switch.done": "Getauscht",

        "slot.free": "frei",
        "slot.tutor": "Tutor:in",
        "slot.before": "vorher",
        "slot.singleGroup": "Einzelgruppe",
        "slot.edit": "Bearbeiten",
        "slot.unknownTutor": "Unbekannte Tutor:in: {tutor}",

        "table.tutor": "Tutor:in",
        "table.multiplier": "Faktor",
        "table.multiplierHint": "Gewichtung der Auslastung, Dezimalzahlen erlaubt (z. B. 1,5)",
        "table.before": "vorher",
        "table.after": "nachher",
        "table.offered": "angeb. Slots",
        "table.dayTime": "Tag & Zeit",
        "table.group": "Gruppe",
        "table.amountGroups": "Anzahl Gruppen: {count}",
        "table.slotDuration": "Slotlänge: {minutes} min",
        "table.noChanges": "Keine Änderungen",
        "table.none": "Keine",

        "dnd.mergeOrSwapHeader": "Gruppen zusammenlegen oder tauschen?",
        "dnd.mergeOrSwapText": "\"{source}\" wurde auf \"{target}\" gezogen.",
        "dnd.merge": "Zusammenlegen",
        "dnd.swap": "Tauschen",
        "dnd.notPossible": "Hier nicht möglich",
        "dnd.slotTaken": "Diese Tutor:in bietet zu dieser Zeit bereits einen Slot an.",

        "modal.groupTitle": "Gruppe bearbeiten",
        "modal.slotTitle": "Freien Slot bearbeiten",
        "modal.members": "Mitglieder",
        "modal.addMember": "Mitglied hinzufügen",
        "modal.memberPlaceholder": "Name",
        "modal.saveMembers": "Mitglieder speichern",
        "modal.assignSlot": "Slot zuweisen",
        "modal.assignSlotPlaceholder": "Freien Slot wählen",
        "modal.assign": "Zuweisen",
        "modal.split": "In Einzelgruppen aufteilen",
        "modal.deleteGroup": "Gruppe löschen",
        "modal.deleteGroupConfirm": "Gruppe \"{group}\" wirklich löschen?",
        "modal.condition": "Bedingung der Tutor:in",
        "modal.conditionPlaceholder": "z. B. Präsenz",
        "modal.saveCondition": "Bedingung speichern",
        "modal.moveSlot": "Slot verschieben",
        "modal.day": "Tag",
        "modal.move": "Verschieben",
        "modal.deleteSlot": "Slot löschen",
        "modal.deleteSlotConfirm": "Slot von {tutor} am {day} um {time} wirklich löschen?",
        "modal.newGroup": "Neue Gruppe hier anlegen",
        "modal.newGroupPlaceholder": "Namen, getrennt durch Komma",
        "modal.create": "Anlegen",
        "modal.close": "Schließen",
        "modal.yes": "Ja",
        "modal.no": "Nein",
        "modal.ok": "OK",
        "modal.cancel": "Abbrechen",
    },
    en: {
        "title": "Attestation to Examiner Distribution",
        "subtitle": "Drag & drop groups to move, swap or merge them",
        "language": "Language",
        "time": "Time",
        "weekday.Monday": "Monday",
        "weekday.Tuesday": "Tuesday",
        "weekday.Wednesday": "Wednesday",
        "weekday.Thursday": "Thursday",
        "weekday.Friday": "Friday",
        "weekday.Saturday": "Saturday",
        "weekday.Sunday": "Sunday",

        "section.import": "Import",
        "section.edit": "Edit",
        "section.export": "Export",
        "section.tutors": "Tutor workload",
        "section.changes": "Changes ({count})",
        "section.singleGroups": "Single groups ({count})",
        "section.timeplans": "Tutor timetables",

        "import.studipCsv": "Parse Stud.IP CSV",
        "import.json": "Load JSON",
        "import.jsonText": "JSON as text",
        "import.htmlFile": "Load HTML table",
        "import.htmlText": "Stud.IP table as text",
        "import.jsonTextHeader": "Import JSON as text",
        "import.jsonTextHint": "Please paste the JSON content here.",
        "import.htmlTextHeader": "Import Stud.IP table",
        "import.htmlTextHint": "Please paste the HTML content of the Stud.IP table here.",
        "import.error": "The content could not be read.",

        "edit.mergeSingleGroups": "Merge single groups",
        "edit.optimize": "Optimize",
        "edit.switch": "Switch",
        "edit.undo": "Back",
        "edit.redo": "Forward",
        "edit.resetChanges": "Discard changes",
        "edit.hideEmptyRows": "Hide empty rows",
        "history.title": "History ({current} / {count})",
        "history.hint": "Click an entry to jump to this state. Ctrl+Z / Ctrl+Y for back / forward.",
        "history.shortcutBack": "Ctrl+Z",
        "history.shortcutForward": "Ctrl+Y or Ctrl+Shift+Z",
        "history.initial": "Example loaded",
        "history.importCsv": "Stud.IP CSV imported",
        "history.importJson": "JSON imported",
        "history.importHtml": "Stud.IP table imported",
        "history.mergeSingleGroups": "Single groups merged",
        "history.optimize": "Optimized",
        "history.resetChanges": "Changes discarded",
        "history.moveGroup": "{group} → {tutor}, {day} {time}",
        "history.swapGroups": "{a} ⇄ {b} swapped",
        "history.mergeGroups": "{source} + {target} merged",
        "history.moveMember": "{member}: {source} → {target}",
        "history.moveMemberToSlot": "{member} → {tutor}, {day} {time}",
        "history.moveTutorSlot": "Slot {tutor}: {fromDay} {fromTime} → {day} {time}",
        "history.editMembers": "Members of {group} changed",
        "history.splitGroup": "{group} split",
        "history.deleteGroup": "{group} deleted",
        "history.condition": "Condition {tutor}, {day} {time}: {condition}",
        "history.deleteTutorSlot": "Slot {tutor}, {day} {time} deleted",
        "history.addGroup": "{group} created at {tutor}, {day} {time}",
        "history.multiplier": "Factor {tutor}: {value}",

        "export.json": "Download JSON",
        "export.tutorGroups": "Groups per tutor",
        "export.studipTable": "Stud.IP HTML table",

        "switch.active": "Switch mode: select two slots (at least one with a group).",
        "switch.selected": "Selected: {count} / 2",
        "switch.cancel": "Cancel",
        "switch.needGroup": "At least one of the two slots must contain a group.",
        "switch.done": "Switched",

        "slot.free": "free",
        "slot.tutor": "Tutor",
        "slot.before": "before",
        "slot.singleGroup": "Single group",
        "slot.edit": "Edit",
        "slot.unknownTutor": "Unknown tutor: {tutor}",

        "table.tutor": "Tutor",
        "table.multiplier": "Factor",
        "table.multiplierHint": "Weight of the workload, decimal numbers allowed (e.g. 1.5)",
        "table.before": "before",
        "table.after": "after",
        "table.offered": "offered",
        "table.dayTime": "Day & time",
        "table.group": "Group",
        "table.amountGroups": "Amount of groups: {count}",
        "table.slotDuration": "Slot duration: {minutes} min",
        "table.noChanges": "No changes",
        "table.none": "None",

        "dnd.mergeOrSwapHeader": "Merge or swap groups?",
        "dnd.mergeOrSwapText": "\"{source}\" was dropped on \"{target}\".",
        "dnd.merge": "Merge",
        "dnd.swap": "Swap",
        "dnd.notPossible": "Not possible here",
        "dnd.slotTaken": "This tutor already offers a slot at this time.",

        "modal.groupTitle": "Edit group",
        "modal.slotTitle": "Edit free slot",
        "modal.members": "Members",
        "modal.addMember": "Add member",
        "modal.memberPlaceholder": "Name",
        "modal.saveMembers": "Save members",
        "modal.assignSlot": "Assign slot",
        "modal.assignSlotPlaceholder": "Choose a free slot",
        "modal.assign": "Assign",
        "modal.split": "Split into single groups",
        "modal.deleteGroup": "Delete group",
        "modal.deleteGroupConfirm": "Really delete group \"{group}\"?",
        "modal.condition": "Condition of the tutor",
        "modal.conditionPlaceholder": "e.g. on site",
        "modal.saveCondition": "Save condition",
        "modal.moveSlot": "Move slot",
        "modal.day": "Day",
        "modal.move": "Move",
        "modal.deleteSlot": "Delete slot",
        "modal.deleteSlotConfirm": "Really delete the slot of {tutor} on {day} at {time}?",
        "modal.newGroup": "Create a new group here",
        "modal.newGroupPlaceholder": "Names, separated by comma",
        "modal.create": "Create",
        "modal.close": "Close",
        "modal.yes": "Yes",
        "modal.no": "No",
        "modal.ok": "OK",
        "modal.cancel": "Cancel",
    },
};

export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

export function translate(language: Language, key: string, params?: Record<string, string | number>): string {
    let text = translations[language]?.[key] ?? translations.en[key] ?? key;
    for(const param of Object.keys(params || {})) {
        text = text.split("{" + param + "}").join("" + params?.[param]);
    }
    return text;
}

const STORAGE_KEY = "attestationToExaminerDistribution.language";

function getInitialLanguage(): Language {
    try {
        let stored = window.localStorage.getItem(STORAGE_KEY);
        if(stored === "de" || stored === "en") {
            return stored;
        }
    } catch (e) {
        // localStorage not available
    }
    return (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) ? "en" : "de";
}

interface I18nContextValue {
    language: Language;
    setLanguage: (language: Language) => void;
    t: TranslateFunction;
}

const I18nContext = createContext<I18nContextValue>({
    language: "de",
    setLanguage: () => {},
    t: (key, params) => translate("de", key, params),
});

export const I18nProvider: FunctionComponent<{children?: React.ReactNode}> = ({children}) => {
    const [language, setLanguage] = useState<Language>(getInitialLanguage());

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, language);
        } catch (e) {
            // localStorage not available
        }
        document.documentElement.lang = language;
    }, [language]);

    const t: TranslateFunction = (key, params) => translate(language, key, params);

    return (
        <I18nContext.Provider value={{language, setLanguage, t}}>
            {children}
        </I18nContext.Provider>
    );
};

export function useI18n(): I18nContextValue {
    return useContext(I18nContext);
}
