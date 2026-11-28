## SimpleCalendar is a date picker for the input fields

- pure JavaScript, no libraries and frameworks required
- very simple, lightweight and robust
- very performant
- easily and highly customizable

## Demo

http://php-smart-factory.org/calendar/

## How to use

### Step 1

Include the files:

```
<link rel="stylesheet" href="calendar.css" type="text/css"/>
<script src='calendar.js'></script>
```

### Step 2

Define config object:

```
var config = {
  format: 'd.m.Y',
  holidays: [new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)],
  start_year: 1970,
  end_year: 2030
};
```

### Step 3

Initialize the fields with CSS selectors or pass the text input elements directly.

```
window.onload = function () {
  SimpleCalendar.observe_escape();

  SimpleCalendar.assign('.date_picker', config);

  SimpleCalendar.assign("#begin_date", config);
  SimpleCalendar.assign("#end_date", config);
}
```

From the input, press Down Arrow to focus the highlighted day. Use the arrow keys
to move by day or week, Enter or Space to select, and Escape to close the calendar.
Selecting a day updates the field and sends a bubbling change event.

## Configuration parameters

```
var config = {
  format: 'd.m.Y',
  start_year: 1970,
  end_year: 2030,

  holidays: [new Date(1970, 6, 4), new Date(1970, 10, 24)],

  month_names: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ],

  weekday_names: [
    "Mo",
    "Tu",
    "We",
    "Th",
    "Fr",
    "Sa",
    "Su"
  ]
};
```

**format**

The default format is Y-m-d. The supported PHP-style tokens are Y (four-digit
year), m (month), d (day), H (24-hour clock), i (minute), and s (second).
Formatting pads the numeric fields with zeros. Parsing accepts one or two digits
for fields other than the year and requires repeated tokens to agree. The format
must include a complete date (Y, m, d) or time (H, i). Omitted date parts use
today's date, and omitted time parts default to zero. A backslash makes the next
character literal. In a JavaScript string, write it as a doubled backslash.

**time_zone**

The time zone used to find today's date and the default year range. It defaults
to the browser's time zone.

**start_year**

The first year of the regular year list. It defaults to the current year minus ten.

**end_year**

The last year of the regular year list. It defaults to the current year plus ten.
The bounds are normalized to ascending order within the range 0–9999.
If typing or calendar navigation displays a year outside the list, that year
temporarily appears as an additional option.

**holidays**

Holiday Date objects are matched by their local calendar date. Use the year
1970 for a holiday that repeats every year.
In `new Date(year, monthIndex, day)`, January is 0 and December is 11.

**month_names**

The month names. If not set, the English names are used.

**weekday_names**

The seven weekday names in Monday-first order. They default to English.

