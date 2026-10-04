import {useEffect, useState} from "react";

export interface HistoryLabel {
    key: string;
    params?: Record<string, string | number>;
}

export interface HistoryEntry {
    oldPlan: any;
    newPlan: any;
    label: HistoryLabel;
    time: number;
}

interface Timeline {
    entries: HistoryEntry[];
    index: number;
}

const MAX_ENTRIES = 200;
const STORAGE_KEY = "attestationToExaminerDistribution.history";
const MAX_STORED_ENTRIES = 30;

function loadTimeline(): Timeline | undefined {
    try {
        let stored = window.sessionStorage.getItem(STORAGE_KEY);
        if(stored) {
            let timeline = JSON.parse(stored);
            if(Array.isArray(timeline?.entries) && timeline.entries.length > 0 && typeof timeline.index === "number") {
                timeline.index = Math.min(Math.max(0, timeline.index), timeline.entries.length - 1);
                return timeline;
            }
        }
    } catch (e) {
        // sessionStorage not available or broken content
    }
    return undefined;
}

function saveTimeline(timeline: Timeline) {
    // only the latest entries are kept, so a reload of the page in the same tab does not lose the work
    let start = Math.max(0, timeline.entries.length - MAX_STORED_ENTRIES);
    let toStore = {entries: timeline.entries.slice(start), index: timeline.index - start};
    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
        try {
            // quota exceeded: at least keep the current state
            let current = timeline.entries[timeline.index];
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({entries: [current], index: 0}));
        } catch (e2) {
            // sessionStorage not available
        }
    }
}

/**
 * Tracks all changes of the plans as a timeline, so it is possible to go back and forward during a session.
 * A new change after going back removes the entries after the current one.
 */
export function usePlanHistory(getInitialOldPlan: () => any, initialLabel: HistoryLabel) {
    const [timeline, setTimeline] = useState<Timeline>(() => loadTimeline() || {
        entries: [{oldPlan: getInitialOldPlan(), newPlan: null, label: initialLabel, time: Date.now()}],
        index: 0,
    });

    useEffect(() => {
        saveTimeline(timeline);
    }, [timeline]);

    const current = timeline.entries[timeline.index];

    function record(oldPlan: any, newPlan: any, label: HistoryLabel) {
        setTimeline((previous) => {
            let entries = [...previous.entries.slice(0, previous.index + 1), {oldPlan, newPlan, label, time: Date.now()}];
            if(entries.length > MAX_ENTRIES) {
                entries = entries.slice(entries.length - MAX_ENTRIES);
            }
            return {entries, index: entries.length - 1};
        });
    }

    function goTo(index: number) {
        setTimeline((previous) => ({
            entries: previous.entries,
            index: Math.min(Math.max(0, index), previous.entries.length - 1),
        }));
    }

    return {
        oldPlan: current.oldPlan,
        newPlan: current.newPlan,
        entries: timeline.entries,
        index: timeline.index,
        canUndo: timeline.index > 0,
        canRedo: timeline.index < timeline.entries.length - 1,
        record,
        goTo,
        undo: () => goTo(timeline.index - 1),
        redo: () => goTo(timeline.index + 1),
    };
}
