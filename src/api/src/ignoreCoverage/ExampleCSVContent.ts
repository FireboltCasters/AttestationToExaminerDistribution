/**
 * Example data with fictional students and tutors.
 * getExampleParsedJSON() is the result of ParseStudIPCSVToJSON.parseStudIPCSVToJSON(getExampleCSVContent()) without the rawSlots.
 */
export default class ExampleCSVContent {

    static getExampleParsedJSON(): any {
        return {
            "groups": {
                "Anna Becker": {
                    "members": [
                        "Anna Becker"
                    ],
                    "selectedSlot": {
                        "tutor": "Ada Lovelace",
                        "day": "Monday",
                        "time": "08:00"
                    },
                    "possibleSlots": {
                        "Monday": {
                            "08:00": true
                        }
                    }
                },
                "Ben Schulz & Clara Wagner": {
                    "members": [
                        "Ben Schulz",
                        "Clara Wagner"
                    ],
                    "selectedSlot": {
                        "tutor": "Ada Lovelace",
                        "day": "Monday",
                        "time": "09:00"
                    },
                    "possibleSlots": {
                        "Monday": {
                            "09:00": true
                        }
                    }
                },
                "David Hoffmann": {
                    "members": [
                        "David Hoffmann"
                    ],
                    "selectedSlot": {
                        "tutor": "Ada Lovelace",
                        "day": "Monday",
                        "time": "09:30"
                    },
                    "possibleSlots": {
                        "Monday": {
                            "09:30": true
                        }
                    }
                },
                "Emma Koch & Felix Richter": {
                    "members": [
                        "Emma Koch",
                        "Felix Richter"
                    ],
                    "selectedSlot": {
                        "tutor": "Ada Lovelace",
                        "day": "Monday",
                        "time": "10:00"
                    },
                    "possibleSlots": {
                        "Monday": {
                            "10:00": true
                        }
                    }
                },
                "Greta Klein & Hannes Wolf": {
                    "members": [
                        "Greta Klein",
                        "Hannes Wolf"
                    ],
                    "selectedSlot": {
                        "tutor": "Ada Lovelace",
                        "day": "Monday",
                        "time": "10:30"
                    },
                    "possibleSlots": {
                        "Monday": {
                            "10:30": true
                        }
                    }
                },
                "Ida Neumann": {
                    "members": [
                        "Ida Neumann"
                    ],
                    "selectedSlot": {
                        "tutor": "Ada Lovelace",
                        "day": "Wednesday",
                        "time": "10:00"
                    },
                    "possibleSlots": {
                        "Wednesday": {
                            "10:00": true
                        }
                    }
                },
                "Jonas Schwarz & Klara Braun": {
                    "members": [
                        "Jonas Schwarz",
                        "Klara Braun"
                    ],
                    "selectedSlot": {
                        "tutor": "Ada Lovelace",
                        "day": "Wednesday",
                        "time": "10:30"
                    },
                    "possibleSlots": {
                        "Wednesday": {
                            "10:30": true
                        }
                    }
                },
                "Lukas Zimmermann & Mia Krüger": {
                    "members": [
                        "Lukas Zimmermann",
                        "Mia Krüger"
                    ],
                    "selectedSlot": {
                        "tutor": "Ada Lovelace",
                        "day": "Wednesday",
                        "time": "11:00"
                    },
                    "possibleSlots": {
                        "Wednesday": {
                            "11:00": true
                        }
                    }
                },
                "Noah Hartmann & Olivia Lange": {
                    "members": [
                        "Noah Hartmann",
                        "Olivia Lange"
                    ],
                    "selectedSlot": {
                        "tutor": "Alan Turing",
                        "day": "Monday",
                        "time": "08:00"
                    },
                    "possibleSlots": {
                        "Monday": {
                            "08:00": true
                        }
                    }
                },
                "Paul Werner & Quirin Krause": {
                    "members": [
                        "Paul Werner",
                        "Quirin Krause"
                    ],
                    "selectedSlot": {
                        "tutor": "Alan Turing",
                        "day": "Monday",
                        "time": "08:30"
                    },
                    "possibleSlots": {
                        "Monday": {
                            "08:30": true
                        }
                    }
                },
                "Rosa Meier & Simon Lehmann": {
                    "members": [
                        "Rosa Meier",
                        "Simon Lehmann"
                    ],
                    "selectedSlot": {
                        "tutor": "Alan Turing",
                        "day": "Monday",
                        "time": "09:00"
                    },
                    "possibleSlots": {
                        "Monday": {
                            "09:00": true
                        }
                    }
                },
                "Tara Köhler & Uwe Frank": {
                    "members": [
                        "Tara Köhler",
                        "Uwe Frank"
                    ],
                    "selectedSlot": {
                        "tutor": "Alan Turing",
                        "day": "Tuesday",
                        "time": "12:00"
                    },
                    "possibleSlots": {
                        "Tuesday": {
                            "12:00": true
                        }
                    }
                },
                "Vera Berger & Willi Fuchs": {
                    "members": [
                        "Vera Berger",
                        "Willi Fuchs"
                    ],
                    "selectedSlot": {
                        "tutor": "Alan Turing",
                        "day": "Tuesday",
                        "time": "12:30"
                    },
                    "possibleSlots": {
                        "Tuesday": {
                            "12:30": true
                        }
                    }
                },
                "Xenia Vogel & Yannik Keller": {
                    "members": [
                        "Xenia Vogel",
                        "Yannik Keller"
                    ],
                    "selectedSlot": {
                        "tutor": "Alan Turing",
                        "day": "Tuesday",
                        "time": "13:00"
                    },
                    "possibleSlots": {
                        "Tuesday": {
                            "13:00": true
                        }
                    }
                },
                "Zoe Roth & Lea Graf": {
                    "members": [
                        "Zoe Roth",
                        "Lea Graf"
                    ],
                    "selectedSlot": {
                        "tutor": "Alan Turing",
                        "day": "Tuesday",
                        "time": "13:30"
                    },
                    "possibleSlots": {
                        "Tuesday": {
                            "13:30": true
                        }
                    }
                },
                "Tim Brandt & Nele Haas": {
                    "members": [
                        "Tim Brandt",
                        "Nele Haas"
                    ],
                    "selectedSlot": {
                        "tutor": "Emmy Noether",
                        "day": "Tuesday",
                        "time": "12:00"
                    },
                    "possibleSlots": {
                        "Tuesday": {
                            "12:00": true
                        }
                    }
                },
                "Max Sauer & Sophie Jung": {
                    "members": [
                        "Max Sauer",
                        "Sophie Jung"
                    ],
                    "selectedSlot": {
                        "tutor": "Emmy Noether",
                        "day": "Tuesday",
                        "time": "13:30"
                    },
                    "possibleSlots": {
                        "Tuesday": {
                            "13:30": true
                        }
                    }
                },
                "Jan Busch & Lina Pohl": {
                    "members": [
                        "Jan Busch",
                        "Lina Pohl"
                    ],
                    "selectedSlot": {
                        "tutor": "Emmy Noether",
                        "day": "Thursday",
                        "time": "08:30"
                    },
                    "possibleSlots": {
                        "Thursday": {
                            "08:30": true
                        }
                    }
                },
                "Erik Ernst & Marie Kraft": {
                    "members": [
                        "Erik Ernst",
                        "Marie Kraft"
                    ],
                    "selectedSlot": {
                        "tutor": "Carl Friedrich Gauß",
                        "day": "Wednesday",
                        "time": "10:00"
                    },
                    "possibleSlots": {
                        "Wednesday": {
                            "10:00": true
                        }
                    }
                },
                "Leon Lorenz & Frieda Seidel": {
                    "members": [
                        "Leon Lorenz",
                        "Frieda Seidel"
                    ],
                    "selectedSlot": {
                        "tutor": "Carl Friedrich Gauß",
                        "day": "Wednesday",
                        "time": "11:30"
                    },
                    "possibleSlots": {
                        "Wednesday": {
                            "11:30": true
                        }
                    }
                }
            },
            "tutors": {
                "Ada Lovelace": {
                    "Monday": {
                        "08:00": true,
                        "08:30": true,
                        "09:00": true,
                        "09:30": true,
                        "10:00": true,
                        "10:30": true
                    },
                    "Wednesday": {
                        "10:00": true,
                        "10:30": true,
                        "11:00": true
                    }
                },
                "Alan Turing": {
                    "Monday": {
                        "08:00": true,
                        "08:30": true,
                        "09:00": true,
                        "09:30": true
                    },
                    "Tuesday": {
                        "12:00": true,
                        "12:30": true,
                        "13:00": true,
                        "13:30": true
                    }
                },
                "Emmy Noether": {
                    "Tuesday": {
                        "12:00": true,
                        "12:30": true,
                        "13:00": true,
                        "13:30": true,
                        "14:00": true
                    },
                    "Thursday": {
                        "08:00": true,
                        "08:30": true,
                        "09:00": true
                    }
                },
                "Carl Friedrich Gauß": {
                    "Wednesday": {
                        "10:00": true,
                        "10:30": true,
                        "11:00": true,
                        "11:30": true
                    },
                    "Thursday": {
                        "08:00": true,
                        "08:30": true,
                        "09:00": true,
                        "09:30": true
                    }
                }
            },
            "tutorMultipliers": {
                "Ada Lovelace": 1,
                "Alan Turing": 1,
                "Emmy Noether": 1,
                "Carl Friedrich Gauß": 1
            },
            "slotDurationMinutes": 30,
            "tutorSlotConditions": {
                "Alan Turing": {
                    "Monday": {
                        "08:00": "Online",
                        "08:30": "Online",
                        "09:00": "Online",
                        "09:30": "Online"
                    }
                },
                "Emmy Noether": {
                    "Thursday": {
                        "08:00": "Präsenz",
                        "08:30": "Präsenz",
                        "09:00": "Präsenz"
                    }
                },
                "Carl Friedrich Gauß": {
                    "Wednesday": {
                        "11:30": "Online unter Vorbehalt, sonst in Präsenz"
                    }
                }
            }
        };
    }

    static getExampleCSVContent(): string {
        return "Datum;Beginn;Ende;Person;Ort;Notiz;Grund\n13.10.2025;08:00;08:30;\"Anna Becker\";\"Ada Lovelace\";;\n13.10.2025;08:30;09:00;\"\";\"Ada Lovelace\";;\n13.10.2025;09:00;09:30;\"Ben Schulz\nClara Wagner\";\"Ada Lovelace\";;\n13.10.2025;09:30;10:00;\"David Hoffmann\";\"Ada Lovelace\";;\n13.10.2025;10:00;10:30;\"Emma Koch\nFelix Richter\";\"Ada Lovelace\";;\n13.10.2025;10:30;11:00;\"Greta Klein\nHannes Wolf\";\"Ada Lovelace\";;\n15.10.2025;10:00;10:30;\"Ida Neumann\";\"Ada Lovelace\";;\n15.10.2025;10:30;11:00;\"Jonas Schwarz\nKlara Braun\";\"Ada Lovelace\";;\n15.10.2025;11:00;11:30;\"Lukas Zimmermann\nMia Krüger\";\"Ada Lovelace\";;\n13.10.2025;08:00;08:30;\"Noah Hartmann\nOlivia Lange\";\"Alan Turing (Online)\";;\n13.10.2025;08:30;09:00;\"Paul Werner\nQuirin Krause\";\"Alan Turing (Online)\";;\n13.10.2025;09:00;09:30;\"Rosa Meier\nSimon Lehmann\";\"Alan Turing (Online)\";;\n13.10.2025;09:30;10:00;\"\";\"Alan Turing (Online)\";;\n14.10.2025;12:00;12:30;\"Tara Köhler\nUwe Frank\";\"Alan Turing\";;\n14.10.2025;12:30;13:00;\"Vera Berger\nWilli Fuchs\";\"Alan Turing\";;\n14.10.2025;13:00;13:30;\"Xenia Vogel\nYannik Keller\";\"Alan Turing\";;\n14.10.2025;13:30;14:00;\"Zoe Roth\nLea Graf\";\"Alan Turing\";;\n14.10.2025;12:00;12:30;\"Tim Brandt\nNele Haas\";\"Emmy Noether\";;\n14.10.2025;12:30;13:00;\"\";\"Emmy Noether\";;\n14.10.2025;13:00;13:30;\"\";\"Emmy Noether\";;\n14.10.2025;13:30;14:00;\"Max Sauer\nSophie Jung\";\"Emmy Noether\";;\n14.10.2025;14:00;14:30;\"\";\"Emmy Noether\";;\n16.10.2025;08:00;08:30;\"\";\"Emmy Noether (Präsenz)\";;\n16.10.2025;08:30;09:00;\"Jan Busch\nLina Pohl\";\"Emmy Noether (Präsenz)\";;\n16.10.2025;09:00;09:30;\"\";\"Emmy Noether (Präsenz)\";;\n15.10.2025;10:00;10:30;\"Erik Ernst\nMarie Kraft\";\"Carl Friedrich Gauß\";;\n15.10.2025;10:30;11:00;\"\";\"Carl Friedrich Gauß\";;\n15.10.2025;11:00;11:30;\"\";\"Carl Friedrich Gauß\";;\n15.10.2025;11:30;12:00;\"Leon Lorenz\nFrieda Seidel\";\"Carl Friedrich Gauß (Online unter Vorbehalt, sonst in Präsenz)\";;\n16.10.2025;08:00;08:30;\"\";\"Carl Friedrich Gauß\";;\n16.10.2025;08:30;09:00;\"\";\"Carl Friedrich Gauß\";;\n16.10.2025;09:00;09:30;\"\";\"Carl Friedrich Gauß\";;\n16.10.2025;09:30;10:00;\"\";\"Carl Friedrich Gauß\";;\n";
    }

}
