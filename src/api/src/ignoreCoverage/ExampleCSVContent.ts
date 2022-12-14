export default class ExampleCSVContent {

    static getExampleParsedJSON(): any {
        return {
            "tutors": {
                "Tutor 1": {
                    "Monday": {
                        "10:00": true,
                        "11:00": true,
                        "12:00": true,
                    }
                },
                "Tutor 2": {
                    "Monday": {
                        "11:00": true,
                        "12:00": true,
                        "13:00": true,
                    }
                }
            },
            "groups": {
                "Group 1": {
                    "selectedSlot": {
                        "tutor": "Tutor 1",
                        "day": "Monday",
                        "time": "10:00",
                    },
                    "possibleSlots": {
                        "Monday": {
                            "10:00": true,
                            "11:00": true,
                            "12:00": true,
                            "13:00": true,
                        }
                    }
                },
                "Group 2": {
                    "selectedSlot": {
                        "tutor": "Tutor 1",
                        "day": "Monday",
                        "time": "11:00",
                    },
                    "possibleSlots": {
                        "Monday": {
                            "10:00": true,
                            "11:00": true,
                            "12:00": true,
                            "13:00": true,
                        }
                    }
                },
                "Group 3": {
                    "selectedSlot": {
                        "tutor": "Tutor 1",
                        "day": "Monday",
                        "time": "12:00",
                    },
                    "possibleSlots": {
                        "Monday": {
                            "10:00": true,
                            "11:00": true,
                            "12:00": true,
                            "13:00": true,
                        }
                    }
                },
                "Group 4": {
                    "selectedSlot": {
                        "tutor": "Tutor 2",
                        "day": "Monday",
                        "time": "13:00",
                    },
                    "possibleSlots": {
                        "Monday": {
                            "10:00": true,
                            "11:00": true,
                            "12:00": true,
                            "13:00": true,
                        }
                    }
                }
            }
        }
    }

    static getExampleCSVContent(): string {
        return 'Datum;Beginn;Ende;Person;Ort;Notiz;Grund\n' +
            '07.11.2022;10:30;11:00;"Bjarne Blumenthal\n' +
            'Ren?? Mlodoch";"Simon Gildehaus";;"\n' +
            '"\n' +
            '07.11.2022;11:00;11:30;"Marius Meschter\n' +
            'Tim R??thig";"Simon Gildehaus";;"\n' +
            '"\n' +
            '07.11.2022;11:30;12:00;"Nikolai Sanders\n' +
            'Justin Bergbauer";"Simon Gildehaus";;"\n' +
            '"\n' +
            '07.11.2022;10:00;10:30;"Paul Schwabauer\n' +
            'Florian Abeln";"Lisa Strzelecki";;"\n' +
            '"\n' +
            '07.11.2022;10:30;11:00;"Arne Fr??mmel\n' +
            'Roman Kock";"Lisa Strzelecki";;"\n' +
            '"\n' +
            '07.11.2022;11:00;11:30;"Tristan Wesendahl Vel??zquez\n' +
            'Timo Wilkens";"Lisa Strzelecki";;"\n' +
            'Testat Software Engineering"\n' +
            '07.11.2022;11:30;12:00;"Sebastian Illi\n' +
            'Lena Br??ggemann";"Lisa Strzelecki";;"\n' +
            '"\n' +
            '07.11.2022;12:00;12:30;"Julian Lohuis\n' +
            'Juliana S??dbeck";"Luka Vukusic";;"\n' +
            '"\n' +
            '07.11.2022;12:30;13:00;"Jona Grolms";"Luka Vukusic";;\n' +
            '07.11.2022;13:00;13:30;"Jana Gerber";"Luka Vukusic";;\n' +
            '07.11.2022;13:30;14:00;"Marc Meijer\n' +
            'Alexander Moraitis";"Luka Vukusic";;"\n' +
            'Da kann ich?"\n' +
            '07.11.2022;14:00;14:30;;"Luka Vukusic";;\n' +
            '07.11.2022;14:30;15:00;;"Luka Vukusic";;\n' +
            '07.11.2022;15:00;15:30;;"Luka Vukusic";;\n' +
            '07.11.2022;15:30;16:00;;"Luka Vukusic";;\n' +
            '07.11.2022;12:30;13:00;"Lars Berner\n' +
            'Malte Helmers";"Simon Gildehaus";;"Testat mit Malte Helmers\n' +
            'Testat mit Lars Berner"\n' +
            '07.11.2022;13:00;13:30;"Tobias Wieghaus\n' +
            'Niels Schmidt";"Simon Gildehaus";;"\n' +
            '"\n' +
            '07.11.2022;13:30;14:00;;"Simon Gildehaus";;\n' +
            '07.11.2022;14:00;14:30;;"Simon Gildehaus";;\n' +
            '07.11.2022;14:30;15:00;;"Simon Gildehaus";;\n' +
            '07.11.2022;15:00;15:30;"Matthias Artmeyer\n' +
            'Luca Schneider";"Simon Gildehaus";;"Testat\n' +
            'Testat"\n' +
            '07.11.2022;15:30;16:00;;"Simon Gildehaus";;\n' +
            '07.11.2022;13:00;13:30;;"Lisa Strzelecki";;\n' +
            '07.11.2022;13:30;14:00;;"Lisa Strzelecki";;\n' +
            '07.11.2022;14:00;14:30;;"Lisa Strzelecki";;\n' +
            '07.11.2022;14:30;15:00;"Tatjana L??bbers\n' +
            'Lena Haasken";"Lisa Strzelecki";;"Testat\n' +
            '"\n' +
            '08.11.2022;10:00;10:30;;"Lisa Strzelecki";;\n' +
            '08.11.2022;10:30;11:00;"Tarek Sander\n' +
            'Julius Th??rner";"Lisa Strzelecki";;"\n' +
            '"\n' +
            '08.11.2022;11:00;11:30;"Joshua Meimeth\n' +
            'Kathleen Brack";"Lisa Strzelecki";;"\n' +
            '"\n' +
            '08.11.2022;11:30;12:00;;"Lisa Strzelecki";;\n' +
            '08.11.2022;12:00;12:30;;"Nicolas Kathmann";;\n' +
            '08.11.2022;12:00;12:30;"Daniel Lieber\n' +
            'Mayar Aljabban";"Luka Vukusic";;"\n' +
            '"\n' +
            '08.11.2022;12:30;13:00;;"Luka Vukusic";;\n' +
            '08.11.2022;13:00;13:30;;"Luka Vukusic";;\n' +
            '08.11.2022;13:30;14:00;"Abdulrahman Sakhnieh\n' +
            'Tjorven Grawunder";"Luka Vukusic";;"\n' +
            '"\n' +
            '08.11.2022;14:00;14:30;"Yu Xuan Diong\n' +
            'Roman Mirau";"Luka Vukusic";;"Das passt am besten mit meinem Zeitplan.\n' +
            '"\n' +
            '08.11.2022;14:30;15:00;;"Luka Vukusic";;\n' +
            '08.11.2022;15:00;15:30;;"Luka Vukusic";;\n' +
            '08.11.2022;15:30;16:00;;"Luka Vukusic";;\n' +
            '08.11.2022;12:30;13:00;;"Nicolas Kathmann";;\n' +
            '08.11.2022;13:00;13:30;;"Nicolas Kathmann";;\n' +
            '08.11.2022;13:30;14:00;"Markus Becker\n' +
            'Tim Heeke";"Nicolas Kathmann";;"\n' +
            '"\n' +
            '08.11.2022;14:00;14:30;;"Nicolas Kathmann";;\n' +
            '08.11.2022;14:30;15:00;;"Nicolas Kathmann";;\n' +
            '08.11.2022;15:00;15:30;;"Nicolas Kathmann";;\n' +
            '08.11.2022;15:30;16:00;;"Nicolas Kathmann";;\n' +
            '09.11.2022;10:30;11:00;"Lukas Schulz\n' +
            'Moritz Wellinghof";"Simon Gildehaus";;"\n' +
            '"\n' +
            '09.11.2022;11:00;11:30;;"Simon Gildehaus";;\n' +
            '09.11.2022;11:30;12:00;"Marlena Schmidt\n' +
            'Marius B??chler";"Simon Gildehaus";;"\n' +
            '????"\n' +
            '09.11.2022;10:00;10:30;"Tom Br??ning\n' +
            'Dennis Konkol";"Lisa Strzelecki";;"\n' +
            '"\n' +
            '09.11.2022;10:30;11:00;"Ronja-Verena Uder\n' +
            'Leon Brovelli";"Lisa Strzelecki";;"\n' +
            '"\n' +
            '09.11.2022;11:00;11:30;"Ibrahim Atma\n' +
            'Omid Daud";"Lisa Strzelecki";;"Test mit Omid Daud\n' +
            'Testat"\n' +
            '09.11.2022;14:00;14:30;"Arne Gr??nheid\n' +
            'Jannick Rohling";"Luka Vukusic";;"Testat\n' +
            '"\n' +
            '09.11.2022;14:30;15:00;;"Luka Vukusic";;\n' +
            '09.11.2022;15:00;15:30;;"Luka Vukusic";;\n' +
            '09.11.2022;15:30;16:00;;"Luka Vukusic";;\n' +
            '09.11.2022;14:00;14:30;"Mateusz Sosnowski\n' +
            'Paul H??ller";"Simon Gildehaus";;"\n' +
            '"\n' +
            '09.11.2022;14:30;15:00;"Lennart Becker\n' +
            'Andy Alisch";"Lisa Strzelecki";;"\n' +
            '"\n' +
            '09.11.2022;15:00;15:30;"Ammar Almohammad Alaabed\n' +
            'Julian Richter";"Lisa Strzelecki";;"\n' +
            '"\n' +
            '09.11.2022;14:30;15:00;"Dario Eschholz\n' +
            'Michael Ramich";"Simon Gildehaus";;"\n' +
            '"\n' +
            '09.11.2022;15:00;15:30;;"Nicolas Kathmann";;\n' +
            '09.11.2022;15:30;16:00;;"Nicolas Kathmann";;\n' +
            '09.11.2022;15:00;15:30;;"Simon Gildehaus";;\n' +
            '10.11.2022;09:00;09:30;;"Nicolas Kathmann";;\n' +
            '10.11.2022;09:30;10:00;;"Nicolas Kathmann";;\n' +
            '10.11.2022;10:00;10:30;"Luca Rosemann\n' +
            'Bastian Rihm";"Nicolas Kathmann";;"\n' +
            '"\n' +
            '10.11.2022;10:30;11:00;"Simeon Hellemann\n' +
            'Adrian Klodzinski";"Nicolas Kathmann";;"Testat\n' +
            '"\n' +
            '10.11.2022;11:00;11:30;"Mohamad Alhammoud";"Nicolas Kathmann";;\n' +
            '10.11.2022;11:30;12:00;"Lukas Haupt\n' +
            'Stefan Weisbeck";"Nicolas Kathmann";;"\n' +
            '"\n'
    }

}
