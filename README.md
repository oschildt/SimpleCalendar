## SimpleCalendar is a date picker for the input fields

- pure JavaScript, no libraries and frameworks required
- very simple, lightweight and robust
- very performant
- easiliy and highly customizable

## Demo

http://php-smart-factory.org/calender/

Also, the local files index.html and mobile.html can bу used for testing.

## How to use

### Step 1

Include the files:

```
<link rel="stylesheet" href="calendar.css" type="text/css"/>
<script type='text/JavaScript' src='calendar.js'></script>
```

### Step 2

Define config object:

```
var config = {
  format: 'd.m.Y',
  start_year: 1970,
  end_year: 2030
};
```

### Step 3

Init the fields passing the field ID string or the object variable:

```
window.onload = function () {
  SimpleCalendar.assign("begin_date", config);
  SimpleCalendar.assign("end_date", config);
}
```

## Configuration parameters

```
var config = {
  format: 'd.m.Y',
  start_year: 1970,
  end_year: 2030,
  
  month_names: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "Septemeber",
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

The date format in PHP style. If not set, the format Y-m-d is used.

**start_year**

The start year of the year dropdown. If not set, the (current_year - 10) is used.

**end_year**

The end year of the year dropdown. If not set, the (current_year + 10) is used.

**month_names**

The month names. If not set, the English names are used.

**weekday_names**

The weekday names. If not set, the English names are used.

