// Add Luxon
var script = document.createElement('script');
script.src = 'https://moment.github.io/luxon/global/luxon.min.js';
var head = document.head;
head.insertBefore(script, head.firstChild);

// Wait for DOM loaded AND luxon loaded
script.onload = ready;

function ready() {
  if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', showSchedule);
  } else {
    showSchedule();
  }
}

function showSchedule() {
  // We query the API by location name eg. "Fidelity"
  // In production we set this inside the Squarespace Header Code box
  // const LOCATION_NAME = 'Tuck';

  const LuxonDt = luxon.DateTime;

  const fetchUrl =
    'https://brain.zippitycars.com/schedule?location=' + LOCATION_NAME;

  fetch(fetchUrl)
    .then((results) => results.json())
    .then((results) => {
      console.log(results);
      if (!results || !results.schedule || results.schedule.length === 0) {
        return;
      }

      const nextDate = LuxonDt.fromISO(results[0]);
      const now = LuxonDt.local();
      const serviceIsToday = now.hasSame(nextDate, 'day');
      const advertiseToday = serviceIsToday && now.hour <= 12;

      // If service is happening today, don't include today's date in the dates list
      if (serviceIsToday) {
        results.schedule.shift();
      }

      // Format the dates like "January 12"
      const humanizedDates = results.schedule.map((date) => {
        return LuxonDt.fromISO(date).toLocaleString({
          month: 'long',
          day: 'numeric',
        });
      });

      const weekdays = results.schedule.map((date) => {
        return LuxonDt.fromISO(date).toLocaleString({
          weekday: 'long',
        });
      });

      // The HTML where we will insert the dates
      const textElement = document.getElementsByClassName(
        'sqs-slice-body-content',
      )[0];

      let htmlString = '';

      if (advertiseToday) {
        htmlString += `<strong>We're here TODAY! Book service for today until 12pm at zippitycars.com!</strong>
        <br/>`;
      } else {
        htmlString += `<strong>We're coming on ${weekdays[0]}, ${
          humanizedDates[0]
        }!</strong>`;
      }

      // Discard the first date b/c we used it in the headline
      // Only show up to 4 upcoming dates
      const upcomingDates = humanizedDates
        .slice(1, 5)
        .map((date, index, array) => {
          if (index + 1 === array.length) {
            return `${date}`;
          }
          return `${date} | `;
        });

      if (upcomingDates.length > 0) {
        htmlString += `<br/><br/>More services available on ${upcomingDates.join(
          '',
        )}`;
      }

      return (textElement.innerHTML = htmlString);
    });
}
