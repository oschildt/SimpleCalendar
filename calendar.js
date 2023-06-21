/**
 * @file
 * The file contains implementation of the simple calendar.
 *
 * @author
 * Oleg Schildt
 */

/**
 * The namespace for the simple calendar.
 *
 * @namespace SimpleCalendar
 *
 * @tutorial 5.using_calendar
 *
 * @author
 * Oleg Schildt
 */

var SimpleCalendar = {};

SimpleCalendar.setHideShowHandler = function (handler) {
    SimpleCalendar.handler = handler;
};

/**
 * The function is used to add an event listener to a DOM object.
 *
 * @protected
 *
 * @param {HTMLElement} oEmt
 * DOM node the event should be added.
 *
 * @param {string} sEvt
 * Name of the event.
 *
 * @param {eventCallback} act
 * Callback function to be called if the event occurs.
 *
 * @see SimpleCalendar.fire_event
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.add_event = function (oEmt, sEvt, act) {
    if (!oEmt) return;
    if (oEmt.addEventListener)
        oEmt.addEventListener(sEvt, act, false);
    else if (oEmt.attachEvent)
        oEmt.attachEvent('on' + sEvt, act);
    else
        oEmt['on' + sEvt] = act;
};

/**
 * The function is used to fire an event.
 *
 *  @protected
 *
 * @param {HTMLElement} oEmt
 * DOM node the event should be fired.
 *
 * @param {string} sEvt
 * Name of the event to be fired.
 *
 * @see SimpleCalendar.add_event
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.fire_event = function (oEmt, sEvt) {
    if ("createEvent" in document) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(sEvt, false, true);
        oEmt.dispatchEvent(evt);
    } else
        oEmt.fireEvent('on' + sEvt);
};

/**
 * The function is used to validate date parts, whether they comprise a valid date.
 *
 * @param {int} day
 * Day of the date.
 *
 * @param {int} month
 * Month of the date.
 *
 * @param {int} year
 * Year of the date.
 *
 * @returns {boolean}
 * Returns True if the date is valid, otherwise False.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.validate_date = function (day, month, year) {
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) {
        return false;
    }

    var dt = new Date(year, month + 1, 0);

    if (day < 1 || day > dt.getDate()) {
        return false;
    }

    return true;
};

/**
 * The function is used to convert date/time to a formatted string.
 *
 * @param {Date} time
 * Date/time to be converted.
 *
 * @param {string} format
 * The date format in PHP format.
 *
 * @returns {string}
 * Returns formatted string representation of the date/time.
 *
 * @see SimpleCalendar.string_to_time
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.time_to_string = function (time, format) {
    if (!time) return "";

    var timestr = format;
    var aux;

    aux = new String(time.getDate());
    if (aux.length == 1) aux = "0" + "" + aux;
    timestr = timestr.replace(/d/, aux);

    aux = new String(time.getMonth() + 1);
    if (aux.length == 1) aux = "0" + "" + aux;
    timestr = timestr.replace(/m/, aux);

    timestr = timestr.replace(/Y/, time.getFullYear());

    aux = new String(time.getHours());
    if (aux.length == 1) aux = "0" + "" + aux;
    timestr = timestr.replace(/H/, aux);

    aux = new String(time.getMinutes());
    if (aux.length == 1) aux = "0" + "" + aux;
    timestr = timestr.replace(/i/, aux);

    aux = new String(time.getSeconds());
    if (aux.length == 1) aux = "0" + "" + aux;
    timestr = timestr.replace(/s/, aux);

    return timestr;
};

/**
 * The function is used to convert a formatted string to date/time.
 *
 * @param {string} str
 * formatted string representation of the date/time.
 *
 * @param {string} format
 * The date format in PHP format.
 *
 * @returns {?Date}
 * Returns resulting date/time or null, if the input string is not a valid date/time.
 *
 * @see SimpleCalendar.time_to_string
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.string_to_time = function (str, format) {
    var pattern = format;

    pattern = pattern.replace(/\./g, "\\.");
    pattern = pattern.replace(/\//g, "\\/");

    pattern = pattern.replace(/d/, "([0-9]{1,2})");
    pattern = pattern.replace(/m/, "([0-9]{1,2})");
    pattern = pattern.replace(/Y/, "([0-9]{4})");
    pattern = pattern.replace(/H/, "([0-9]{1,2})");
    pattern = pattern.replace(/i/, "([0-9]{1,2})");
    pattern = pattern.replace(/s/, "([0-9]{1,2})");

    var re = new RegExp("^" + pattern + "$");
    var result = re.exec(str);

    if (!result) return null;

    var units = [];
    units[0] = result[1];
    units[1] = result[2];
    units[2] = result[3];
    units[3] = result[4];
    units[4] = result[5];
    units[5] = result[6];

    var order = format.replace(/[^YmdHis]/g, "");

    var i_year = order.indexOf("Y");
    var i_month = order.indexOf("m");
    var i_day = order.indexOf("d");
    var i_hour = order.indexOf("H");
    var i_minute = order.indexOf("i");
    var i_second = order.indexOf("s");

    var date_ok = false;
    var time_ok = false;

    if (i_year != -1 && i_month != -1 && i_day != -1) date_ok = true;
    if (i_hour != -1 && i_minute != -1) time_ok = true;

    if (!date_ok && !time_ok) return null;

    /*
        alert(units[i_day] + "." + units[i_month] + "." + units[i_year] + " " +
              units[i_hour] + ":" + units[i_minute] + ":" + units[i_second]
             );
    */

    var dt = new Date();

    if (date_ok) {
        if (!SimpleCalendar.validate_date(units[i_day], units[i_month], units[i_year])) return null;

        dt.setMonth(0);
        dt.setDate(units[i_day]);
        dt.setMonth(units[i_month] - 1);
        dt.setFullYear(units[i_year]);
    }

    if (time_ok) {
        if (isNaN(units[i_hour]) || units[i_hour] < 0 || units[i_hour] > 23) return null;
        if (isNaN(units[i_minute]) || units[i_minute] < 0 || units[i_minute] > 59) return null;

        dt.setHours(units[i_hour]);
        dt.setMinutes(units[i_minute]);
    } else {
        dt.setHours(0);
        dt.setMinutes(0);
    }

    if (i_second != -1) {
        if (isNaN(units[i_second]) || units[i_second] < 0 || units[i_second] > 59) return null;

        dt.setSeconds(units[i_second]);
    } else {
        dt.setSeconds(0);
    }

    return dt;
};

/**
 * The function lookups a parent width overflow scroll or hidden to check whether the calendar
 * should be placed above the field instead of below or alligned to the right of the field.
 *
 * @protected
 *
 * @param {HTMLElement} elm
 * The child element to start search.
 *
 * @returns {HTMLElement}
 * Returns the first found scrollable parent or BODY if none found.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.lookup_scrollable_parent = function (elm) {
    var cs, level = 1;

    var current_parent = elm.parentNode;
    while (current_parent instanceof Element) {
        cs = window.getComputedStyle(current_parent);

        if (cs.overflowY == "auto" || cs.overflowY == "hidden") {
            return current_parent;
        }

        if (current_parent.tagName == "BODY") {
            return current_parent;
        }

        current_parent = current_parent.parentNode;

        level++;
    }

    return null;
};

/**
 * The function is used to position the calendar related to the target input field.
 *
 * @protected
 *
 * @param {HTMLElement} field
 * The target input field where the calendar should be positioned.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.position_calendar = function (field) {
    var field_rect = field.getBoundingClientRect();
    var calendar_rect = field.my_calendar.getBoundingClientRect();
    var table_rect = field.my_calendar.calendar_table.getBoundingClientRect();

    var x = Math.round(field_rect.left - calendar_rect.left);
    var y = Math.round(field_rect.top - calendar_rect.top) + field_rect.height + 2;

    var scrollable_parent = SimpleCalendar.lookup_scrollable_parent(field.my_calendar);
    if (scrollable_parent) {
        var p_rect = scrollable_parent.getBoundingClientRect();

        if ((calendar_rect.top + y + table_rect.height) > (p_rect.top + scrollable_parent.clientHeight)) {
            y -= (field_rect.height + table_rect.height + 6);
        }

        if ((calendar_rect.left + x + table_rect.width) > (p_rect.left + scrollable_parent.clientWidth)) {
            x += (field_rect.width - table_rect.width);
        }
    }

    field.my_calendar.calendar_table.style.left = x + "px";
    field.my_calendar.calendar_table.style.top = y + "px";
};

/**
 * The function is used to create the DOM object of the calendar.
 *
 * @protected
 *
 * @param {HTMLElement} field
 * The target input field where the calendar should be positioned.
 *
 * @param {CalendarConfigDef} config
 * The calendar config object.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.create_calendar = function (field, config) {
    field.my_calendar = document.createElement('div');
    field.my_calendar.classList.add('calendar_container');

    // make them friends
    field.my_calendar.config = config;
    field.my_calendar.my_field = field;

    field.my_calendar.calendar_table = document.createElement('table');
    var table_body = document.createElement("tbody");
    field.my_calendar.calendar_table.append(table_body);

    var elm, option, tr, td, tmp;

    tr = document.createElement('tr');
    table_body.append(tr);

    tmp = document.createElement('td');
    tmp.classList.add('calendar_head');
    tmp.colSpan = 7;
    tr.append(tmp);

    td = document.createElement('div');
    td.classList.add('calendar_head_area');
    tmp.append(td);

    elm = document.createElement('button');
    elm.type = "button";
    elm.classList.add('arrow_left');
    elm.innerHTML = '&#10148;';
    SimpleCalendar.add_event(elm, "focus", function () {
        field.my_calendar.i_am_still_active = true;
    });
    SimpleCalendar.add_event(elm, "blur", function () {
        field.my_calendar.i_am_still_active = false;
        setTimeout(function () {
            SimpleCalendar.hide_if_inactive(field.my_calendar)
        }, 300);
    });
    SimpleCalendar.add_event(elm, 'click', function () {
        var year = field.my_calendar.display_date.getFullYear();
        var month = field.my_calendar.display_date.getMonth();
        SimpleCalendar.set_date(field.my_calendar, new Date(year, month, 0));
    });
    td.append(elm);

    elm = document.createElement('select');
    elm.classList.add('month_selector');
    for (var i = 0; i < 12; i++) {
        option = new Option(config.month_names[i], i, false, false);
        elm.options[elm.options.length] = option;
    }
    SimpleCalendar.add_event(elm, "focus", function () {
        field.my_calendar.i_am_still_active = true;
    });
    SimpleCalendar.add_event(elm, "blur", function () {
        field.my_calendar.i_am_still_active = false;
        setTimeout(function () {
            SimpleCalendar.hide_if_inactive(field.my_calendar)
        }, 300);
    });
    SimpleCalendar.add_event(elm, 'change', function () {
        var year = field.my_calendar.display_date.getFullYear();
        SimpleCalendar.set_date(field.my_calendar, new Date(year, Number.parseInt(this.value) + 1, 0));
    });
    td.append(elm);

    elm = document.createElement('select');
    elm.classList.add('year_selector');
    for (var i = config.start_year; i <= config.end_year; i++) {
        option = new Option(i, i, false, false);
        elm.options[elm.options.length] = option;
    }
    SimpleCalendar.add_event(elm, "focus", function () {
        field.my_calendar.i_am_still_active = true;
    });
    SimpleCalendar.add_event(elm, "blur", function () {
        field.my_calendar.i_am_still_active = false;
        setTimeout(function () {
            SimpleCalendar.hide_if_inactive(field.my_calendar)
        }, 300);
    });
    SimpleCalendar.add_event(elm, 'change', function () {
        var month = field.my_calendar.display_date.getMonth();
        SimpleCalendar.set_date(field.my_calendar, new Date(Number.parseInt(this.value), month + 1, 0));
    });
    td.append(elm);

    elm = document.createElement('button');
    elm.type = "button";
    elm.classList.add('arrow_right');
    elm.innerHTML = '&#10148;';
    SimpleCalendar.add_event(elm, "focus", function () {
        field.my_calendar.i_am_still_active = true;
    });
    SimpleCalendar.add_event(elm, "blur", function () {
        field.my_calendar.i_am_still_active = false;
        setTimeout(function () {
            SimpleCalendar.hide_if_inactive(field.my_calendar)
        }, 300);
    });
    SimpleCalendar.add_event(elm, 'click', function () {
        var year = field.my_calendar.display_date.getFullYear();
        var month = field.my_calendar.display_date.getMonth();
        SimpleCalendar.set_date(field.my_calendar, new Date(year, month + 2, 0));
    });
    td.append(elm);

    tr = document.createElement('tr');
    for (var j = 0; j < 7; j++) {
        td = document.createElement('td');
        td.classList.add('weekday');
        if (j > 4) td.classList.add('weekend');
        td.innerHTML = config.weekday_names[j];
        tr.append(td);
    }
    table_body.append(tr);

    for (var i = 0; i < 6; i++) {
        tr = document.createElement('tr');
        table_body.append(tr);

        for (var j = 0; j < 7; j++) {
            td = document.createElement('td');
            td.classList.add('day');
            if (j > 4) td.classList.add('weekend');
            tr.append(td);

            SimpleCalendar.add_event(td, 'click', function () {
                // IMPORTANT! The value must be set before changing the calendar month
                field.my_calendar.my_field.value = SimpleCalendar.time_to_string(this.my_date, config.format);
                SimpleCalendar.fire_event(field.my_calendar.my_field, "change");

                field.my_calendar.selected_date = this.my_date;
                SimpleCalendar.set_date(field.my_calendar, this.my_date);
                field.my_calendar.style.display = 'none';
                field.my_calendar.i_am_still_active = false;
            });
        }
    }

    field.my_calendar.append(field.my_calendar.calendar_table);

    SimpleCalendar.add_event(field, "focus", function () {
        SimpleCalendar.hide_all(this);

        if (field.readOnly || field.disabled) return;

        SimpleCalendar.set_date_from_field(this, config);

        field.my_calendar.style.display = 'block';
        SimpleCalendar.position_calendar(field);

        if (SimpleCalendar.handler) SimpleCalendar.handler();

        this.my_calendar.i_am_still_active = true;
    });

    SimpleCalendar.add_event(field, "blur", function () {
        var me = this;
        me.my_calendar.i_am_still_active = false;

        if (SimpleCalendar.string_to_time(me.value.trim(), config.format) === null) {
            me.value = "";
        }

        setTimeout(function () {
            SimpleCalendar.hide_if_inactive(me.my_calendar)
        }, 300);
    });

    SimpleCalendar.add_event(field, "keyup", function () {
        SimpleCalendar.set_date_from_field(this, config);
    });

    field.parentNode.append(field.my_calendar);

    SimpleCalendar.add_event(window, "resize", function () {
        SimpleCalendar.position_calendar(field);
    });
};

/**
 * The function is used to set the date on the calendar from the value in the target input field.
 *
 * @protected
 *
 * @param {HTMLElement} field
 * The target input field where the calendar should be positioned.
 *
 * @param {CalendarConfigDef} config
 * The calendar config object.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.set_date_from_field = function (field, config) {
    var date = new Date();
    if (field.value.trim()) {
        date = SimpleCalendar.string_to_time(field.value.trim(), config.format);
        if (date === null) {
            date = new Date();
        } else {
            field.my_calendar.selected_date = date;
        }
    }

    SimpleCalendar.set_date(field.my_calendar, date);
};

/**
 * The type definition of the calendar configuration, see {@link SimpleCalendar.assign}.
 *
 * @typedef CalendarConfigDef
 *
 * @type {Object}
 *
 * @property {string} format=Y-m-d
 * The date format of the calendar in PHP format.
 *
 * @property {string} placeholder
 * The hint for the date format.
 *
 * @property {int} start_year=current_year-10
 * The start year in the year list.
 *
 * @property {int} end_year=current_year+10
 * The end year in the year list.
 *
 * @property {Array.<Date>} holidays
 * The list of the holidays. They are marked specially.
 * The holidays should be specified as Date objects. If a holiday repeats every year,
 * set its year to 1970.
 *
 * @property {Array.<string>} month_names=English_names
 * The list of the month names. Per default, English names are used.
 *
 * @property {Array.<string>} weekday_names=English_names
 * The list of the weekday names. Per default, English names are used.
 */

/**
 * This function should be used to add calendar functionality to an input field.
 *
 * @param {string|HTMLInputElement} field_ref
 * The target field where the calendar functionality should be added - an element or selector.
 *
 * @param {CalendarConfigDef} config
 * The calendar config object.
 *
 * @tutorial 5.using_calendar
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.assign = function (field_ref, config) {
    if (!field_ref) return;

    if (!config) config = {};

    var date = new Date();

    if (config.placeholder) field.placeholder = config.placeholder;

    if (!config.format) config.format = "Y-m-d";
    if (!config.start_year) config.start_year = date.getFullYear() - 10;
    if (!config.end_year) config.end_year = date.getFullYear() + 10;

    if (!config.month_names) {
        config.month_names = new Array(
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
        );
    }

    if (!config.weekday_names) {
        config.weekday_names = new Array(
            "Mo",
            "Tu",
            "We",
            "Th",
            "Fr",
            "Sa",
            "Su"
        );
    }
    
    var fields = [];

    if ((field_ref instanceof HTMLInputElement && field_ref.type == 'text')) {
        fields.push(field_ref);
    } else if (typeof field_ref == "string" || typeof field_ref == "number") {
        fields = document.querySelectorAll(field_ref);
    } else {
        return;
    }

    for (var i = 0; i < fields.length; i++) {
        fields[i].autocomplete = "off";

        SimpleCalendar.create_calendar(fields[i], config);

        SimpleCalendar.set_date_from_field(fields[i], config);
    }
};

/**
 * The function is an auxiliary function that checks whether the date is a holiday due to the config settings.
 *
 * @protected
 *
 * @param {Date} date
 * The date to check.
 *
 * @param {HTMLElement} calendar
 * The calendar DOM object.
 *
 * @returns {boolean}
 * Returns True if the date is a holiday, otherwise False.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.is_holiday = function (date, calendar) {
    if (!calendar.config.holidays) return false;

    var idx = -1;
    calendar.config.holidays.forEach(function (item, index) {
        var local = new Date(item);

        if (local.getFullYear() == 1970) {
            local.setFullYear(date.getFullYear());
        }

        if (date.getTime() == local.getTime())
            idx = index;
    });

    return idx != -1;
};

/**
 * The function is an auxiliary function that hides the calendar if it is no more active.
 *
 * @protected
 *
 * @param {HTMLElement} calendar
 * The calendar DOM object.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.hide_if_inactive = function (calendar) {
    if (calendar.i_am_still_active) return;

    calendar.style.display = 'none';

    if (SimpleCalendar.handler) SimpleCalendar.handler();
};

/**
 * The function is an auxiliary function that sets the date on the calendar.
 *
 * @protected
 *
 * @param {HTMLElement} calendar
 * The calendar DOM object.
 *
 * @param {Date} date
 * Date/time to be set.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.set_date = function (calendar, date) {
    calendar.display_date = date;

    var elms = calendar.getElementsByClassName('month_selector');
    if (elms.length > 0) {
        elms[0].value = date.getMonth();
    }

    elms = calendar.getElementsByClassName('year_selector');
    if (elms.length > 0) {
        elms[0].value = date.getFullYear();
    }

    elms = calendar.getElementsByClassName('day');
    if (elms.length == 0) {
        alert('No day cells found!');
        return;
    }

    var today_date = new Date();
    today_date = new Date(today_date.getFullYear(), today_date.getMonth(), today_date.getDate());

    var first_day_date = new Date(date.getFullYear(), date.getMonth(), 1);
    var first_day_of_week = first_day_date.getDay();
    if (first_day_of_week == 0) first_day_of_week = 7;

    var other_month_date = new Date(first_day_date.getTime() - 1 * 24 * 3600 * 1000);

    var current_date = new Date(other_month_date.getFullYear(), other_month_date.getMonth(), other_month_date.getDate() - first_day_of_week + 2, 0, 0, 0);

    for (var i = 0; i < elms.length; i++) {
        elms[i].classList.remove('holiday');
        elms[i].classList.remove('other_month');
        elms[i].classList.remove('today');
        elms[i].classList.remove('selected_date');

        elms[i].innerHTML = current_date.getDate();
        elms[i].my_date = current_date;

        if (SimpleCalendar.is_holiday(current_date, calendar)) elms[i].classList.add('holiday');

        if (current_date.getMonth() != date.getMonth() ||
            current_date.getFullYear() != date.getFullYear()) elms[i].classList.add('other_month');

        if (current_date.getFullYear() == today_date.getFullYear() &&
            current_date.getMonth() == today_date.getMonth() &&
            current_date.getDate() == today_date.getDate()
        ) elms[i].classList.add('today');

        if (calendar.selected_date &&
            current_date.getFullYear() == calendar.selected_date.getFullYear() &&
            current_date.getMonth() == calendar.selected_date.getMonth() &&
            current_date.getDate() == calendar.selected_date.getDate()
        ) elms[i].classList.add('selected_date');

        current_date = new Date(current_date.getTime() + 1 * 24 * 3600 * 1000);
    }
};

/**
 * The function is an auxiliary function that hides all active calendars.
 *
 * @protected
 *
 * @param {HTMLElement} [except]
 * The input field that should be excluded from hiding.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.hide_all = function (except) {
    var elms = document.getElementsByClassName('calendar_container');
    if (elms.length == 0) {
        if (SimpleCalendar.handler) SimpleCalendar.handler();

        return;
    }

    for (var i = 0; i < elms.length; i++) {
        if (elms[i].my_field == except) continue;

        if (elms[i].my_field == document.activeElement) {
            SimpleCalendar.fire_event(elms[i].my_field, "blur");
        }
        elms[i].style.display = 'none';
        elms[i].i_am_still_active = false;
    }

    if (SimpleCalendar.handler) SimpleCalendar.handler();
};

/**
 * The function is an auxiliary function for handling press of the Esc key and hiding the calendar if necessary.
 *
 * @protected
 *
 * @param {Event} event
 * The event object describing the details of the event.
 *
 * @see SimpleCalendar.observe_escape
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.handle_escape = function (event) {
    if (event.keyCode != 27) return;

    SimpleCalendar.hide_all();
};

/**
 * The function activates observing the Esc press.
 *
 * @protected
 *
 * @see SimpleCalendar.handle_escape
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.observe_escape = function () {
    SimpleCalendar.add_event(window, 'keydown', SimpleCalendar.handle_escape);
};


