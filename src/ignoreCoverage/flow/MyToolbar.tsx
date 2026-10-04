import React, {FunctionComponent, ReactNode, useState} from 'react';
import {FileUpload} from 'primereact/fileupload';
import {InputTextarea} from 'primereact/inputtextarea';
import {Dialog} from 'primereact/dialog';
import {Button} from "primereact/button";
import {Dropdown} from "primereact/dropdown";
import DownloadHelper from "../helper/DownloadHelper";
import ParseStudIPCSVToJSON from "../../api/src/ignoreCoverage/ParseStudIPCSVToJSON";
import GraphHelper from "../../api/src/ignoreCoverage/GraphHelper";
import {JSONToGraph} from "../../api/src";
import HtmlTableStudIp from "../helper/HtmlTableStudIp";
import {Language, LANGUAGE_OPTIONS, useI18n} from "../i18n/I18n";
import {getTutorColor} from "./PlanTypes";

export interface AppState {
    oldPlan: any;
    newPlan: any;
    commitPlans: (oldPlan: any, newPlan: any, undoable: boolean) => void;
    switchMode: boolean;
    setSwitchMode: (active: boolean) => void;
    canUndo: boolean;
    undo: () => void;
    hideEmptyRows: boolean;
    setHideEmptyRows: (hide: boolean) => void;
    reloadNumber: number;
    setReloadNumber: (reloadNumber: number) => void;
    showToast: (severity: "success" | "info" | "warn" | "error", detail: string) => void;
}

export const MyToolbar: FunctionComponent<AppState> = (props) => {
    const {oldPlan, newPlan, commitPlans, reloadNumber, setReloadNumber} = props;
    const {t, language, setLanguage} = useI18n();

    const [displayJsonTextImport, setDisplayJsonTextImport] = useState(false);
    const [jsonTextImportValue, setJsonTextImportValue] = useState("");
    const [displayStudipTableImport, setDisplayStudipTableImport] = useState(false);
    const [studipTableImportValue, setStudipTableImportValue] = useState("");
    const [, setMultiplierChangeCounter] = useState(0);
    const [multiplierDrafts, setMultiplierDrafts] = useState<Record<string, string>>({});

    function formatMultiplier(multiplier: number): string {
        let text = "" + multiplier;
        return language === "de" ? text.replace(".", ",") : text;
    }

    const usePlan = newPlan || oldPlan;

    function importPlan(plan: any) {
        commitPlans(plan, null, false);
        setReloadNumber(reloadNumber + 1);
    }

    function readFile(event: any, handleContent: (content: string) => Promise<void> | void) {
        let file = event.files?.[0];
        if(!file) {
            return;
        }
        const reader = new FileReader();
        reader.addEventListener('load', async (loadEvent) => {
            try {
                await handleContent("" + loadEvent?.target?.result);
            } catch (err) {
                console.error(err);
                props.showToast("error", t("import.error"));
                setReloadNumber(reloadNumber + 1);
            }
        });
        reader.readAsText(file);
    }

    function handleImportStudipCsv(event: any) {
        readFile(event, async (content) => {
            let json = await ParseStudIPCSVToJSON.parseStudIPCSVToJSON(content);
            DownloadHelper.downloadTextAsFiletile(JSON.stringify(json, null, 2), "parsedStudip.json");
            importPlan(json);
        });
    }

    function handleImportJson(event: any) {
        readFile(event, (content) => importPlan(JSON.parse(content)));
    }

    function handleImportHtmlTable(event: any) {
        readFile(event, (content) => importPlan(HtmlTableStudIp.htmlToJson(content)));
    }

    function handleExport() {
        let json = JSON.parse(JSON.stringify(usePlan));
        for(const groupName of Object.keys(json.groups || {})) {
            delete json.groups[groupName].selectedSlot?.["id"];
        }
        DownloadHelper.downloadTextAsFiletile(JSON.stringify(json, null, 2), "export.json");
    }

    function renderUpload(label: string, icon: string, accept: string, handler: (event: any) => void) {
        return (
            <FileUpload key={label + reloadNumber} auto mode="basic" accept={accept} name="file" url="./upload" customUpload
                        chooseOptions={{label, icon, className: 'p-button-outlined'}}
                        uploadHandler={handler}/>
        );
    }

    // ---------- Sections ----------

    function renderLanguageSection() {
        return (
            <div className="atd-panel atd-panel-row">
                <strong><i className="pi pi-globe" style={{marginRight: 6}}/>{t("language")}</strong>
                <Dropdown value={language} options={LANGUAGE_OPTIONS} onChange={(e) => setLanguage(e.value as Language)} style={{minWidth: 140}}/>
            </div>
        );
    }

    function renderImportSection() {
        return (
            <div className="atd-panel">
                <h3>{t("section.import")}</h3>
                <div className="atd-buttons">
                    <FileUpload key={"csv" + reloadNumber} auto mode="basic" accept=".csv,text/csv" name="file" url="./upload" customUpload
                                chooseOptions={{label: t("import.studipCsv"), icon: 'pi pi-upload', className: 'p-button-warning'}}
                                uploadHandler={handleImportStudipCsv}/>
                    {renderUpload(t("import.json"), "pi pi-file", ".json,application/json", handleImportJson)}
                    {renderUpload(t("import.htmlFile"), "pi pi-table", ".html,.htm,.txt,text/html,text/plain", handleImportHtmlTable)}
                    <Button label={t("import.jsonText")} icon="pi pi-align-left" className="p-button-outlined" onClick={() => setDisplayJsonTextImport(true)}/>
                    <Button label={t("import.htmlText")} icon="pi pi-align-left" className="p-button-outlined" onClick={() => setDisplayStudipTableImport(true)}/>
                </div>
            </div>
        );
    }

    function renderEditSection() {
        return (
            <div className="atd-panel">
                <h3>{t("section.edit")}</h3>
                <div className="atd-buttons">
                    <Button label={t("edit.mergeSingleGroups")} icon="pi pi-users" className="p-button-outlined" disabled={!oldPlan}
                            onClick={() => commitPlans(GraphHelper.mergeSingleGroups(oldPlan), null, true)}/>
                    <Button label={t("edit.optimize")} icon="pi pi-bolt" disabled={!oldPlan}
                            onClick={() => commitPlans(oldPlan, GraphHelper.getOptimizedDistribution(oldPlan), true)}/>
                    <Button label={props.switchMode ? t("switch.cancel") : t("edit.switch")} icon="pi pi-arrows-h"
                            className={props.switchMode ? "p-button-help" : "p-button-outlined p-button-help"}
                            onClick={() => props.setSwitchMode(!props.switchMode)}/>
                    <Button label={t("edit.undo")} icon="pi pi-undo" className="p-button-outlined p-button-secondary" disabled={!props.canUndo} onClick={props.undo}/>
                    <Button label={t("edit.resetChanges")} icon="pi pi-replay" className="p-button-outlined p-button-danger" disabled={!newPlan}
                            onClick={() => commitPlans(oldPlan, null, true)}/>
                </div>
                <label className="atd-checkbox">
                    <input type="checkbox" checked={props.hideEmptyRows} onChange={(e) => props.setHideEmptyRows(e.target.checked)}/>
                    {t("edit.hideEmptyRows")}
                </label>
            </div>
        );
    }

    function renderExportSection() {
        return (
            <div className="atd-panel">
                <h3>{t("section.export")}</h3>
                <div className="atd-buttons">
                    <Button label={t("export.json")} icon="pi pi-download" disabled={!usePlan} onClick={handleExport}/>
                    <Button label={t("export.tutorGroups")} icon="pi pi-download" className="p-button-outlined" disabled={!usePlan} onClick={() => {
                        let groupsForTutor = ParseStudIPCSVToJSON.getGroupsForTutors(usePlan);
                        DownloadHelper.downloadTextAsFiletile(JSON.stringify(groupsForTutor, null, 2), "tutorsGroups.json");
                    }}/>
                    <Button label={t("export.studipTable")} icon="pi pi-download" className="p-button-outlined" disabled={!usePlan} onClick={() => {
                        let htmlTable = HtmlTableStudIp.getPlanAsStudipTable(newPlan, oldPlan);
                        DownloadHelper.downloadTextAsFiletile(htmlTable, "studipHTMLTable.txt");
                    }}/>
                </div>
            </div>
        );
    }

    function getAmountOfferedSlotsForTutor(tutor: string): number {
        let tutorsWeekdaysDict = oldPlan?.tutors?.[tutor] || {};
        let amount = 0;
        for(const weekday of Object.keys(tutorsWeekdaysDict)) {
            amount += Object.keys(tutorsWeekdaysDict[weekday] || {}).length;
        }
        return amount;
    }

    function renderTutorSection() {
        let tutorNames: string[] = Object.keys(oldPlan?.tutors || {});
        let groupsDict = usePlan?.groups || {};
        for(const groupName of Object.keys(groupsDict)) {
            let tutor = groupsDict[groupName]?.selectedSlot?.tutor;
            if(tutor && !tutorNames.includes(tutor)) {
                tutorNames.push(tutor);
            }
        }

        let groupsForTutorInOldPlan: any = ParseStudIPCSVToJSON.getGroupsForTutors(oldPlan) || {};
        let groupsForTutorInNewPlan: any = ParseStudIPCSVToJSON.getGroupsForTutors(newPlan) || {};

        return (
            <div className="atd-panel">
                <h3>{t("section.tutors")}</h3>
                <div className="atd-muted" style={{marginBottom: 8}}>
                    {t("table.amountGroups", {count: Object.keys(oldPlan?.groups || {}).length})}
                    {" · "}
                    {t("table.slotDuration", {minutes: JSONToGraph.getSlotDurationMinutes(oldPlan)})}
                </div>
                <table className="atd-table">
                    <thead>
                    <tr>
                        <th>{t("table.tutor")}</th>
                        <th className="atd-num" title={t("table.multiplierHint")}>{t("table.multiplier")}</th>
                        <th className="atd-num">{t("table.before")}</th>
                        <th className="atd-num">{t("table.after")}</th>
                        <th className="atd-num">{t("table.offered")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tutorNames.map((tutor) => {
                        let known = !!oldPlan?.tutors?.[tutor];
                        let multiplier = oldPlan?.tutorMultipliers?.[tutor] ?? 1;
                        let amountNew = newPlan ? (groupsForTutorInNewPlan[tutor] || []).length : undefined;
                        return (
                            <tr key={tutor}>
                                <td>
                                    <span className="atd-tutor-dot" style={{["--atd-tutor-color" as any]: getTutorColor(tutor, oldPlan), marginRight: 6}}/>
                                    {known ? tutor : t("slot.unknownTutor", {tutor})}
                                </td>
                                <td className="atd-num">
                                    <input type="text" inputMode="decimal" className="atd-multiplier"
                                           value={multiplierDrafts[tutor] ?? formatMultiplier(JSONToGraph.parseTutorMultiplier(multiplier))}
                                           onChange={(e) => {
                                               let text = e.target.value;
                                               setMultiplierDrafts({...multiplierDrafts, [tutor]: text});
                                               // decimal numbers with comma or dot, e.g. 1,5
                                               if(/^\s*\d+([.,]\d*)?\s*$/.test(text) && oldPlan) {
                                                   oldPlan.tutorMultipliers = oldPlan.tutorMultipliers || {};
                                                   oldPlan.tutorMultipliers[tutor] = JSONToGraph.parseTutorMultiplier(text);
                                                   setMultiplierChangeCounter((counter) => counter + 1);
                                               }
                                           }}
                                           onBlur={() => {
                                               let nextDrafts = {...multiplierDrafts};
                                               delete nextDrafts[tutor];
                                               setMultiplierDrafts(nextDrafts);
                                           }}/>
                                </td>
                                <td className="atd-num">{(groupsForTutorInOldPlan[tutor] || []).length}</td>
                                <td className="atd-num">{amountNew === undefined ? "–" : amountNew}</td>
                                <td className="atd-num">{getAmountOfferedSlotsForTutor(tutor)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        );
    }

    function formatSlot(slot: any): string {
        if(!slot) {
            return "–";
        }
        return t("weekday." + slot.day) + " " + slot.time;
    }

    function renderChangesSection() {
        let changes: {groupName: string, oldSlot: any, newSlot: any}[] = [];
        if(oldPlan && newPlan) {
            for(const groupName of Object.keys(newPlan.groups || {})) {
                let oldSlot = oldPlan.groups?.[groupName]?.selectedSlot;
                let newSlot = newPlan.groups[groupName]?.selectedSlot;
                if(oldSlot?.tutor !== newSlot?.tutor || oldSlot?.day !== newSlot?.day || oldSlot?.time !== newSlot?.time) {
                    changes.push({groupName, oldSlot, newSlot});
                }
            }
        }

        return (
            <div className="atd-panel">
                <h3>{t("section.changes", {count: changes.length})}</h3>
                {changes.length === 0 ? <div className="atd-muted">{t("table.noChanges")}</div> : (
                    <table className="atd-table">
                        <thead>
                        <tr>
                            <th>{t("table.group")}</th>
                            <th>{t("table.before")}</th>
                            <th>{t("table.after")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {changes.map((change) => (
                            <tr key={change.groupName}>
                                <td>{change.groupName}</td>
                                <td>{change.oldSlot?.tutor || "–"}<br/><span className="atd-muted">{formatSlot(change.oldSlot)}</span></td>
                                <td>{change.newSlot?.tutor || "–"}<br/><span className="atd-muted">{formatSlot(change.newSlot)}</span></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        );
    }

    function renderSingleGroupsSection() {
        let groups = usePlan?.groups || {};
        let singleGroupNames = Object.keys(groups).filter((groupName) => (groups[groupName]?.members || []).length === 1);

        return (
            <div className="atd-panel">
                <h3>{t("section.singleGroups", {count: singleGroupNames.length})}</h3>
                {singleGroupNames.length === 0 ? <div className="atd-muted">{t("table.none")}</div> : (
                    <table className="atd-table">
                        <thead>
                        <tr>
                            <th>{t("table.dayTime")}</th>
                            <th>{t("table.group")}</th>
                            <th>{t("table.tutor")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {singleGroupNames.map((groupName) => {
                            let slot = groups[groupName]?.selectedSlot;
                            return (
                                <tr key={groupName}>
                                    <td>{formatSlot(slot)}</td>
                                    <td>{groupName}</td>
                                    <td>{slot?.tutor}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        );
    }

    function renderTimeplansSection() {
        let tutorsDict = usePlan?.tutors || {};
        let groupsDict = usePlan?.groups || {};
        let weekdays = JSONToGraph.getWorkingWeekdays();

        let renderedTimeplans: ReactNode[] = Object.keys(tutorsDict).map((tutor) => {
            let entries = Object.keys(groupsDict)
                .filter((groupName) => groupsDict[groupName]?.selectedSlot?.tutor === tutor)
                .map((groupName) => ({groupName, slot: groupsDict[groupName].selectedSlot}))
                .sort((a, b) => (weekdays.indexOf(a.slot.day) - weekdays.indexOf(b.slot.day)) || ("" + a.slot.time).localeCompare("" + b.slot.time));

            return (
                <div key={tutor}>
                    <h4>
                        <span className="atd-tutor-dot" style={{["--atd-tutor-color" as any]: getTutorColor(tutor, oldPlan)}}/>
                        {tutor}
                    </h4>
                    {entries.length === 0 ? <div className="atd-muted">{t("table.none")}</div> : (
                        <ul>
                            {entries.map((entry) => {
                                let condition = JSONToGraph.getTutorSlotCondition(usePlan, tutor, entry.slot.day, entry.slot.time);
                                return (
                                    <li key={entry.groupName}>
                                        <strong>{formatSlot(entry.slot)}</strong>: {entry.groupName}
                                        {condition ? <> <span className="atd-condition">{condition}</span></> : null}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            );
        });

        return (
            <div className="atd-panel atd-timeplan">
                <h3>{t("section.timeplans")}</h3>
                {renderedTimeplans}
            </div>
        );
    }

    function renderImportDialogs() {
        const footerJson = (
            <div>
                <Button label={t("modal.cancel")} icon="pi pi-times" className="p-button-text" onClick={() => setDisplayJsonTextImport(false)}/>
                <Button label={t("modal.ok")} icon="pi pi-check" onClick={() => {
                    try {
                        importPlan(JSON.parse(jsonTextImportValue));
                        setDisplayJsonTextImport(false);
                        setJsonTextImportValue("");
                    } catch (err) {
                        console.error(err);
                        props.showToast("error", t("import.error"));
                    }
                }}/>
            </div>
        );

        const footerStudip = (
            <div>
                <Button label={t("modal.cancel")} icon="pi pi-times" className="p-button-text" onClick={() => setDisplayStudipTableImport(false)}/>
                <Button label={t("modal.ok")} icon="pi pi-check" onClick={() => {
                    try {
                        importPlan(HtmlTableStudIp.htmlToJson(studipTableImportValue));
                        setDisplayStudipTableImport(false);
                        setStudipTableImportValue("");
                    } catch (err) {
                        console.error(err);
                        props.showToast("error", t("import.error"));
                    }
                }}/>
            </div>
        );

        return (
            <>
                <Dialog header={t("import.jsonTextHeader")} visible={displayJsonTextImport} style={{width: 'min(800px, 95vw)'}} footer={footerJson} onHide={() => setDisplayJsonTextImport(false)}>
                    <p>{t("import.jsonTextHint")}</p>
                    <InputTextarea rows={20} style={{width: "100%"}} value={jsonTextImportValue} onChange={(e) => setJsonTextImportValue(e.target.value)}/>
                </Dialog>
                <Dialog header={t("import.htmlTextHeader")} visible={displayStudipTableImport} style={{width: 'min(800px, 95vw)'}} footer={footerStudip} onHide={() => setDisplayStudipTableImport(false)}>
                    <p>{t("import.htmlTextHint")}</p>
                    <InputTextarea rows={20} style={{width: "100%"}} value={studipTableImportValue} onChange={(e) => setStudipTableImportValue(e.target.value)}/>
                </Dialog>
            </>
        );
    }

    return (
        <>
            {renderLanguageSection()}
            {renderImportSection()}
            {renderEditSection()}
            {renderExportSection()}
            {renderTutorSection()}
            {renderChangesSection()}
            {renderSingleGroupsSection()}
            {renderTimeplansSection()}
            {renderImportDialogs()}
        </>
    );
};
