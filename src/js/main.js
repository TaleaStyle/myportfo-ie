(function () {
    // DOM-Elemente
    const calendarDates = document.querySelector('.calendar-dates');
    const monthYear = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const timeContainer = document.querySelector('.freienTermine');
    const form = document.querySelector("form");
    const alertDangerEl = document.querySelector('.alert-danger');
    const fullyBookedblock = document.querySelector('.alert-fullyBooked');
    const submitButton = document.getElementById("submitButton"); // Hinzugefügt
    const inputs = {
        vorname: document.getElementById("vorname"),
        nachname: document.getElementById("nachname"),
        email: document.getElementById("email"),
        telefonnummer: document.getElementById("telefonnummer"),
        message: document.getElementById("message")
    };
    // alertDangerEl.textContent = "Bitte füllen Sie alle Felder aus.";
    // Zustandsvariablen
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDay = null;
    let selectedDate = localStorage.getItem("selectedDate") || "";
    let selectedTime = localStorage.getItem("selectedTime") || "";
    let userData = JSON.parse(localStorage.getItem("userData")) || [];

    const months = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];

    // Kalender rendern
    function renderCalendar(month, year) {
        calendarDates.innerHTML = '';
        monthYear.textContent = `${months[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date().setHours(0, 0, 0, 0);

        // Leere Tage am Anfang des Monats
        Array.from({ length: firstDayOfMonth }).forEach(() =>
            calendarDates.appendChild(document.createElement('div'))
        );

        // Tage des Monats
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            const date = new Date(year, month, i).setHours(0, 0, 0, 0);
            const formattedDate = `${i}.${month + 1}.${year}`;

            day.textContent = i;
            if (date === today) day.classList.add('current-date');
            if (date < today) day.classList.add('last-date');
            if (new Date(date).getDay() === 0) day.classList.add('holiday-date');

            let isAvailable = date >= today && date <= new Date(today).setMonth(new Date(today).getMonth() + 2)
                && !day.classList.contains('holiday-date');

            if (isAvailable) {
                day.classList.add('available-date');
            } else {
                day.classList.add('unavailable-date'); // Füge eine Klasse für nicht verfügbare Tage hinzu
            }

            if (isFullyBooked(formattedDate)) {
                day.classList.add('fully-booked');
            }

            calendarDates.appendChild(day);
        }

        // Event Delegation für Klicks auf Tage
        calendarDates.addEventListener("click", (event) => {
            const target = event.target;
            if (target.classList.contains('available-date')) {
                const day = target;
                const formattedDate = `${day.textContent}.${month + 1}.${year}`;
                selectDate(day, formattedDate);
            } else if (target.classList.contains('fully-booked')) {
                showFullyBookedMessage();
            } else if (target.classList.contains('unavailable-date')) {
                showUnavailableMessage(); // Zeige Meldung für nicht verfügbare Tage
            }
        });
    }

    // Zeitslots generieren
    function generateTimeSlots(slots = [{ start: 10, end: 12 }, { start: 17, end: 19 }]) {
        return slots.flatMap(slot => {
            const slotsArray = [];
            for (let i = slot.start; i < slot.end; i++) {
                slotsArray.push(`${i}:00 - ${i + 1}:00 Uhr`);
            }
            return slotsArray;
        });
    }

    // Zeitslots anzeigen
    function createTimeSlots(selectedDate) {
        timeContainer.innerHTML = '';
        fullyBookedblock.textContent = "";
        if (isFullyBooked(selectedDate)) {
            fullyBookedblock.textContent = "Alle Termine für diesen Tag sind bereits gebucht.";
            fullyBookedblock.style.display = "block";
            return;
        }

        const totalSlots = generateTimeSlots();
        const bookedSlots = new Set(userData.filter(entry => entry.date === selectedDate).map(entry => entry.time));
        const availableSlots = totalSlots.filter(slot => !bookedSlots.has(slot));

        availableSlots.forEach(timeString => {
            const timeDiv = document.createElement('div');
            timeDiv.classList.add('termin-slot');
            timeDiv.textContent = timeString;
            timeDiv.dataset.time = timeString;
            timeDiv.addEventListener("click", () => selectTime(timeDiv, timeString));
            timeContainer.appendChild(timeDiv);
        });
    }

    // Datum auswählen
    function selectDate(day, formattedDate) {
        if (selectedDay) selectedDay.classList.remove("selected");
        selectedDay = day;
        selectedDay.classList.add("selected");
        selectedDate = formattedDate;
        localStorage.setItem("selectedDate", selectedDate);
        createTimeSlots(selectedDate);
        // Setze die Uhrzeit zurück, wenn ein neues Datum ausgewählt wird
        selectedTime = "";
        localStorage.removeItem("selectedTime");
        submitButton.disabled = true; // Deaktiviere den Button
    }

    // Uhrzeit auswählen
    function selectTime(timeDiv, timeString) {
        document.querySelector('.termin-slot.selected')?.classList.remove("selected");
        timeDiv.classList.add("selected");
        selectedTime = timeString;
        localStorage.setItem("selectedTime", selectedTime);
        submitButton.disabled = false; // Aktiviere den Button
    }

    // Überprüfen, ob alle Slots gebucht sind
    function isFullyBooked(date) {
        const totalSlots = generateTimeSlots();
        const bookedSlotsCount = userData.filter(entry => entry.date === date).length;
        return bookedSlotsCount >= totalSlots.length;
    }

    // Nachricht anzeigen, wenn alle Slots gebucht sind
    function showFullyBookedMessage() {
        timeContainer.innerHTML = '<p>Alle Termine für diesen Tag sind bereits gebucht.</p>';
        timeContainer.style.color = '#dc3545';
    }

    // Nachricht anzeigen, wenn der Tag nicht verfügbar ist
    function showUnavailableMessage() {
        timeContainer.innerHTML = '<p>Dieser Tag ist nicht verfügbar.</p>';
        timeContainer.style.color = '#dc3545';
    }

    // Formular validieren
    function validateForm() {
        return Object.values(inputs).every(input => input.value.trim());
    }

    // Formular absenden
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!validateForm()) {
            alertDangerEl.textContent = "Bitte füllen Sie alle Felder aus.";
            alertDangerEl.style.display = "block";
            alertDangerEl.style.color = '#dc3545';

            return;
        }

        // Überprüfe, ob eine Uhrzeit ausgewählt wurde
        if (!selectedDate || !selectedTime) {
            alertDangerEl.textContent = "Bitte wählen Sie zuerst ein Datum und eine Uhrzeit aus, bevor Sie fortfahren.";
            alertDangerEl.style.display = "block";
            alertDangerEl.style.color = '#dc3545';
            alert("Bitte wählen Sie ein Datum und eine Uhrzeit aus.");
            return;
        }

        const url = `confirmation.html?name=${encodeURIComponent(inputs.vorname.value.trim())}&date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(selectedTime)}&email=${encodeURIComponent(inputs.email.value.trim())}&phone=${encodeURIComponent(inputs.telefonnummer.value.trim())}&message=${encodeURIComponent(inputs.message.value.trim())}`;
        window.location.href = url;

        userData.push({ date: selectedDate, time: selectedTime });
        localStorage.setItem("userData", JSON.stringify(userData));
        renderCalendar(currentMonth, currentYear);

        // Zurücksetzen von selectedDate und selectedTime nach dem Absenden
        selectedDate = "";
        selectedTime = "";
        localStorage.removeItem("selectedDate");
        localStorage.removeItem("selectedTime");
        submitButton.disabled = true;
    });

    // === Event Listener für Monatsnavigation ===
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });



    // Initialisierung
    renderCalendar(currentMonth, currentYear);

    document.querySelectorAll('.navbar-links a').forEach(link => {
        link.addEventListener('click', () => {
            const navToggle = document.querySelector('#nav-toggle');
            if (navToggle.checked) {
                navToggle.checked = false; // Deaktiviere das Menü
            }
        });
    });

    /*   function fadeTextAndShowImage() {
          const textElement = document.getElementById("textAnimate");
          const img = document.getElementById("imgAnimate");
      
          if (!textElement || !img) {
              console.error("Elemente nicht gefunden!");
              return;
          }
      
          // Initialzustand für Text und Bild
          textElement.style.opacity = "1"; // Text startet sichtbar
          img.style.opacity = "0"; // Bild startet unsichtbar
          img.style.display = "none"; // Bild ist anfangs nicht im Layout
      
          // CSS-Transition hinzufügen
          textElement.style.transition = "opacity 2s ease-in-out";
          img.style.transition = "opacity 3s ease-in-out";
      
          // Text nach einer bestimmten Zeit ausblenden
          setTimeout(() => {
              textElement.style.opacity = "0"; // Text langsam ausblenden
      
              setTimeout(() => {
                  textElement.style.display = "none"; // Text aus dem Layout entfernen
                  img.style.display = "block"; // Bild ins Layout einfügen
      
                  // Kurze Verzögerung, bevor die Opacity-Animation startet
                  setTimeout(() => {
                      img.style.opacity = "1"; // Bild langsam einblenden
                  }, 50); // 50ms Verzögerung für sauberen Übergang
      
              }, 2000); // Wartezeit für die Text-Ausblendung (2 Sekunden)
          }, 4000); // Startzeit: 4 Sekunden nach Laden der Seite
      }
       */
    // Funktion aufrufen, sobald das DOM geladen ist
    // document.addEventListener("DOMContentLoaded", fadeTextAndShowImage);





})();