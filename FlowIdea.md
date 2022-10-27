# Idea

Es wird als FLuss Problem dargestellt. Die Quelle geht zu allen Übungsgruppen und hat bei der Kante eine Kapazität von 1 und kosten von 0. Über die Kapazität können wir nacher erfahren, wenn der Fluss 1 ist, welcher Weg genommen ist, sprich welche Lösung am Ende genutzt wird. 
Die Gruppen haben dann eine Verbindung zu allen Slots, zu welchen gleichen Zeiten diese genutzt wurden, wobei die Kapazität 1 ist und die Kosten 0 sind zu Beginn. Die Slots gehören jeweils zu einem Tutor Tx. Diese haben dann eine Verbindung zu dem jeweiligen Tutor mit Kapaziät 1 und kosten 0. Zuletzt haben die Tutoren zur Senke eine Verbindung, wobei die Kapazität der Anzahl an Testaten ist, welche diese Haben sollten im Idealfall + ein Delta. Das Delta sind die Anzahl Puffer Slots. Mit dem Max-Flow Alg. soll nun geschaut werden, bei welcher Lösung die größten Flüsse sind, begonnen mit einem hohen Delta (z. B. 6 ==> 10+6 ==> 16). Danach wird das Delta durch eine Binäre Suche immer kleiner Angepasst, bis die Optimale Lösung gefunden wird bsp. 16 --> 10 --> 13 --> 12. 

In einem Zweiten Schritt nachdem die Verteilung erfolgte, wird in der kommenden Woche natürlich eineige Studierenden ausfallen. Nun suchen wir wieder eine optimale Verteilung der Studierenden. Dabei kann es vorkommen, dass Studierende, für eine perfekte Aufteilung Ihren Tutor wechseln müssten. Da dies doof für die Studierenden ist, wird dieser Wechsel bestraft mit Kosten. Wechselt wie im Bild die rote gruppe von tutor 1 zu tutor 2 so wird dafür die Kosten von 1 erhoben. Mit diesem Schema machen wir dann eine min-cost analyse.