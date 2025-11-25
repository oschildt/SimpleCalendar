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

/**
 * Internal reference to the calendar control.
 *
 * @type {HTMLElement}
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.calendar = null;

/**
 * The function sets a callback function that is called if the calendar is shown or hidden.
 *
 * @param {hide_show_handler_callback} handler
 * The callback function to be called.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.set_hide_show_handler = function (handler) {
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
 * @see SimpleCalendar.remove_event
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
 * The function is used to remove an event listener from a DOM object.
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
 * @see SimpleCalendar.add_event
 * @see SimpleCalendar.fire_event
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.remove_event = function(oEmt, sEvt, act)
{
	if (!oEmt) return;
	if (oEmt.removeEventListener)
		oEmt.removeEventListener (sEvt, act, false);
	else
		if (oEmt.detachEvent)
			oEmt.detachEvent ('on'+sEvt, act);
		else
			oEmt['on'+sEvt] = null;
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
 * @see SimpleCalendar.remove_event
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
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return false;
    }
    
    day = parseInt(day);
    month = parseInt(month);
    year = parseInt(year);
    
    if (month < 1 || month > 12) {
        return false;
    }

    // we get the number of days in the month by setting
    // next month with the day 0.
    // The month index starts with 0, so, the normal month
    // value is already the next month
    var dt = new Date(year, month, 0);

    if (day < 1 || day > dt.getDate()) {
        return false;
    }

    return true;
};

/**
 * The function is used to get the current time zone.
 *
 * @returns {string}
 * Returns the code of the current time zone.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.get_current_time_zone_code = function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * The function is used to get the current date/time based on the time zone.
 *
 * @param {CalendarConfigDef} config
 * The calendar config object.
 *
 * @returns {Date}
 * Returns the current date based on the time zone in config.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.get_current_date = function (config) {
    var today_date = new Date();
    
    current_time_zone_offset = SimpleCalendar.get_time_zone_offset(today_date, SimpleCalendar.get_current_time_zone_code());
    var target_time_zone_offset = SimpleCalendar.get_time_zone_offset(today_date, config.time_zone);
    var today_date = new Date(today_date.getTime() - current_time_zone_offset + target_time_zone_offset);

    return today_date;
};

/**
 * The function is used to get the offset of a given time zone.
 *
 * @param {Date} date
 * The base date used for getting the offset. The offset can depend on the date.
 *
 * @param {string} timeZone
 * The code of the time zone for getting the offset.
 *
 * @returns {int}
 * Returns the offset of a given time zone in milliseconds.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.get_time_zone_offset = function (date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone,
        timeZoneName: 'shortOffset'
    });

    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((part) => part.type === 'timeZoneName').value;

    const match = offsetPart.match(/GMT([+-]?\d{1,2})(:(\d{2}))?/);

    if (match) {
        const hour = match[1];
        const minute = match[3] || 0; 
        
        return (hour * 3600 + minute * 60) * 1000;
    }

    return 0;
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

    var dt = new Date();

    dt.setHours(0);
    dt.setMinutes(0);
    dt.setSeconds(0);
    dt.setMilliseconds(0);

    if (date_ok) {
        if (!SimpleCalendar.validate_date(units[i_day], units[i_month], units[i_year])) return null;

        // If we start setting with the day, it might not be possible
        // to set the 29 of February, if the 29 of February of a leap year
        // is chosen, but the current year is not a leap year.
        
        // So, we set first the month to January, because it always has 31 days.
        dt.setMonth(0);
        // now we can surely set the desired year.
        dt.setFullYear(units[i_year]);
        // now we can surely set the desired day.
        dt.setDate(units[i_day]);
        // now we can set the desired month.
        dt.setMonth(units[i_month] - 1);
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

        if (current_parent.tagName == "HTML") {
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
 * This function is used to init the field for attaching the calendar functionality.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The target field where the calendar functionality is added.
 *
 * @param {CalendarConfigDef} config
 * The calendar config object.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.init_field = function (field, config) {
    if (field.classList.contains("simple_calendar_added")) {
        return;
    }

    field.calendar_config = config;
    
    field.classList.add("simple_calendar_added");
    
    field.autocomplete = "off";

    if (config.placeholder) field.placeholder = config.placeholder;
    
    SimpleCalendar.add_event(field, "focus", function () {
        SimpleCalendar.hide();

        if (this.readOnly || this.disabled) return;
        
        SimpleCalendar.show(this);
    });

    SimpleCalendar.add_event(field, "blur", function () {
        this.my_calendar.i_am_still_active = false;

        if (SimpleCalendar.string_to_time(this.value.trim(), this.calendar_config.format) === null) {
            this.value = "";
        }

        setTimeout(function () {
            SimpleCalendar.hide_if_inactive();
        }, 300);
    });

    SimpleCalendar.add_event(field, "keyup", function () {
        SimpleCalendar.set_date_from_field();
    });
};

/**
 * The function is used to create the DOM object of the calendar.
 *
 * @protected
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.create_calendar = function () {
    if (SimpleCalendar.calendar !== null) {
        return;
    }
    
    var default_config = {};

    default_config.time_zone = SimpleCalendar.get_current_time_zone_code();

    var date = SimpleCalendar.get_current_date(default_config);

    default_config.format = "Y-m-d";
    default_config.start_year = date.getFullYear() - 10;
    default_config.end_year = date.getFullYear() + 10;

    default_config.month_names = new Array(
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

    default_config.weekday_names = new Array(
        "Mo",
        "Tu",
        "We",
        "Th",
        "Fr",
        "Sa",
        "Su"
    );
    
    SimpleCalendar.calendar = document.createElement('div');
    SimpleCalendar.calendar.classList.add('calendar_container');

    SimpleCalendar.calendar.calendar_table = document.createElement('table');
    var table_body = document.createElement("tbody");
    SimpleCalendar.calendar.calendar_table.append(table_body);

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
        SimpleCalendar.calendar.i_am_still_active = true;
    });
    SimpleCalendar.add_event(elm, "blur", function () {
        SimpleCalendar.calendar.i_am_still_active = false;
        setTimeout(function () {
            SimpleCalendar.hide_if_inactive();
        }, 300);
    });
    SimpleCalendar.add_event(elm, 'click', function () {
        var year = SimpleCalendar.calendar.my_date.getFullYear();
        var month = SimpleCalendar.calendar.my_date.getMonth();
        SimpleCalendar.set_date(new Date(year, month, 0));
    });
    td.append(elm);

    elm = document.createElement('select');
    elm.classList.add('month_selector');
    for (var i = 0; i < 12; i++) {
        option = new Option(default_config.month_names[i], i, false, false);
        elm.options[elm.options.length] = option;
    }
    SimpleCalendar.add_event(elm, "focus", function () {
        SimpleCalendar.calendar.i_am_still_active = true;
    });
    SimpleCalendar.add_event(elm, "blur", function () {
        SimpleCalendar.calendar.i_am_still_active = false;
        setTimeout(function () {
            SimpleCalendar.hide_if_inactive();
        }, 300);
    });
    SimpleCalendar.add_event(elm, 'change', function () {
        var year = SimpleCalendar.calendar.my_date.getFullYear();
        SimpleCalendar.set_date(new Date(year, Number.parseInt(this.value) + 1, 0));
    });
    td.append(elm);

    elm = document.createElement('select');
    elm.classList.add('year_selector');
    for (var i = default_config.start_year; i <= default_config.end_year; i++) {
        option = new Option(i, i, false, false);
        elm.options[elm.options.length] = option;
    }
    SimpleCalendar.add_event(elm, "focus", function () {
        SimpleCalendar.calendar.i_am_still_active = true;
    });
    SimpleCalendar.add_event(elm, "blur", function () {
        SimpleCalendar.calendar.i_am_still_active = false;
        setTimeout(function () {
            SimpleCalendar.hide_if_inactive();
        }, 300);
    });
    SimpleCalendar.add_event(elm, 'change', function () {
        var month = SimpleCalendar.calendar.my_date.getMonth();
        SimpleCalendar.set_date(new Date(Number.parseInt(this.value), month + 1, 0));
    });
    td.append(elm);

    elm = document.createElement('button');
    elm.type = "button";
    elm.classList.add('arrow_right');
    elm.innerHTML = '&#10148;';
    SimpleCalendar.add_event(elm, "focus", function () {
        SimpleCalendar.calendar.i_am_still_active = true;
    });
    SimpleCalendar.add_event(elm, "blur", function () {
        SimpleCalendar.calendar.i_am_still_active = false;
        setTimeout(function () {
            SimpleCalendar.hide_if_inactive();
        }, 300);
    });
    SimpleCalendar.add_event(elm, 'click', function () {
        var year = SimpleCalendar.calendar.my_date.getFullYear();
        var month = SimpleCalendar.calendar.my_date.getMonth();
        SimpleCalendar.set_date(new Date(year, month + 2, 0));
    });
    td.append(elm);

    tr = document.createElement('tr');
    tr.classList.add('weekday_head');
    for (var j = 0; j < 7; j++) {
        td = document.createElement('td');
        td.setAttribute("data-weekday", j);
        
        td.classList.add('weekday');
        if (j > 4) td.classList.add('weekend');
        td.innerHTML = default_config.weekday_names[j];
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
                if (!SimpleCalendar.calendar.my_field) {
                    return;
                }
                
                // IMPORTANT! The value must be set before changing the calendar month
                SimpleCalendar.calendar.my_field.value = SimpleCalendar.time_to_string(this.my_date, SimpleCalendar.calendar.my_field.calendar_config.format);
                SimpleCalendar.fire_event(SimpleCalendar.calendar.my_field, "change");

                SimpleCalendar.set_date(this.my_date);
                SimpleCalendar.hide();
            });
        }
    }

    SimpleCalendar.calendar.append(SimpleCalendar.calendar.calendar_table);

    document.body.append(SimpleCalendar.calendar);
};

/**
 * The function is used to set the date on the calendar from the value in the target input field.
 *
 * @protected
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.set_date_from_field = function () {
    var date = SimpleCalendar.get_current_date(SimpleCalendar.calendar.my_field.calendar_config);
    if (SimpleCalendar.calendar.my_field.value.trim()) {
        date = SimpleCalendar.string_to_time(SimpleCalendar.calendar.my_field.value.trim(), SimpleCalendar.calendar.my_field.calendar_config.format);
        if (date === null) {
            date = SimpleCalendar.get_current_date(SimpleCalendar.calendar.my_field.calendar_config);
        }
    }

    SimpleCalendar.set_date(date);
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
 * @property {string} time_zone
 * The time zone of the calendar. It is necessary to define the correct today day. 
 * If not specified, the time zone of the browser is used.
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

    if (!config.time_zone) {
        config.time_zone = SimpleCalendar.get_current_time_zone_code();
    }

    var date = SimpleCalendar.get_current_date(config);

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
    
    SimpleCalendar.create_calendar();

    var fields = [];

    if ((field_ref instanceof HTMLInputElement && field_ref.type == 'text')) {
        fields.push(field_ref);
    } else if (typeof field_ref == "string" || typeof field_ref == "number") {
        fields = document.querySelectorAll(field_ref);
    } else {
        return;
    }

    for (var i = 0; i < fields.length; i++) {
        SimpleCalendar.init_field(fields[i], config);
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
 * @param {CalendarConfigDef} config
 * The calendar config object.
 *
 * @returns {boolean}
 * Returns True if the date is a holiday, otherwise False.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.is_holiday = function (date, config) {
    if (!config.holidays) return false;

    var idx = -1;
    config.holidays.forEach(function (item, index) {
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
 * This function is used to attach the field to the calendard control.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The target field where the calendar functionality is added.
 *
 * @see SimpleCalendar.detach_from_calender
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.attach_to_calender = function (field) {
    SimpleCalendar.calendar.my_field = field;
    field.my_calendar = SimpleCalendar.calendar;
    
    var option;
    
    // Adjust month names
    var elms = SimpleCalendar.calendar.querySelectorAll(".month_selector");
    for (var i = 0; i < elms.length; i++) {
        elms[i].options.length = 0;
        
        for (var j = 0; j < 12; j++) {
            option = new Option(field.calendar_config.month_names[j], j, false, false);
            elms[i].options[elms[i].options.length] = option;
        }
    }
    
    // Adjust year range
    elms = SimpleCalendar.calendar.querySelectorAll(".year_selector");
    for (var i = 0; i < elms.length; i++) {
        elms[i].options.length = 0;

        for (var y = field.calendar_config.start_year; y <= field.calendar_config.end_year; y++) {
            option = new Option(y, y, false, false);
            elms[i].options[elms[i].options.length] = option;
        }
    }

    // Adjust weekday names
    elms = SimpleCalendar.calendar.querySelectorAll(".weekday_head .weekday");
    for (var i = 0; i < elms.length; i++) {
        elms[i].innerHTML = field.calendar_config.weekday_names[elms[i].getAttribute("data-weekday")];
    }

    SimpleCalendar.add_observation_events(field);

    SimpleCalendar.set_date_from_field();
};

/**
 * This function is used to detach the field from the calendard control.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The target field where the calendar functionality is added.
 *
 * @see SimpleCalendar.attach_to_calender
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.detach_from_calender = function (field) {
    SimpleCalendar.calendar.my_field = null;

    SimpleCalendar.remove_observation_events(field);
};

/**
 * The function is an auxiliary function that shows the calendar.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The target field where the calendar functionality is added.
 *
 * @see SimpleCalendar.hide
 * @see SimpleCalendar.hide_if_inactive
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.show = function (field) {
    if (SimpleCalendar.calendar.my_field == field) {
        field.my_calendar.i_am_still_active = true;
        field.my_calendar.style.display = 'block';
        SimpleCalendar.position_calendar(field);

        if (SimpleCalendar.handler) SimpleCalendar.handler();
        return;
    }

    SimpleCalendar.hide();
    
    SimpleCalendar.attach_to_calender(field);

    field.my_calendar.i_am_still_active = true;
    field.my_calendar.style.display = 'block';
    SimpleCalendar.position_calendar(field);

    if (SimpleCalendar.handler) SimpleCalendar.handler();
};

/**
 * The function is an auxiliary function that hides the calendar.
 *
 * @protected
 *
 * @see SimpleCalendar.show
 * @see SimpleCalendar.hide_if_inactive
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.hide = function () {
    if (SimpleCalendar.calendar.my_field) {
        SimpleCalendar.detach_from_calender(SimpleCalendar.calendar.my_field);
    }    

    SimpleCalendar.calendar.style.display = 'none';
    SimpleCalendar.calendar.i_am_still_active = false;

    if (SimpleCalendar.handler) SimpleCalendar.handler();
};


/**
 * The function is an auxiliary function that hides the calendar if it is no more active.
 *
 * @protected
 *
 * @see SimpleCalendar.show
 * @see SimpleCalendar.hide
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.hide_if_inactive = function () {
    if (SimpleCalendar.calendar.i_am_still_active) return;

    SimpleCalendar.hide();
};

/**
 * The function is an auxiliary function for getting the previous day of a day.
 *
 * @param {Date} date
 * Base date/time.
 *
 * @see SimpleCalendar.get_next_day
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.get_previous_day = function (date) {
  var previousDay = new Date(date);
  
  if (date.getDate() === 1) {
    previousDay.setMonth(date.getMonth() - 1);
    previousDay.setDate(new Date(date.getFullYear(), date.getMonth(), 0).getDate());
  } else {
    previousDay.setDate(date.getDate() - 1);
  }
  
  return previousDay;
};

/**
 * The function is an auxiliary function for getting the next day of a day.
 *
 * @param {Date} date
 * Base date/time.
 * 
 * @see SimpleCalendar.get_previous_day
 * 
 * @author
 * Oleg Schildt
 */
SimpleCalendar.get_next_day = function (date) {
  var nextDay = new Date(date);

  nextDay.setDate(date.getDate() + 1);

  return nextDay;
};

/**
 * The function is an auxiliary function that sets the date on the calendar.
 *
 * @protected
 *
 * @param {Date} date
 * Date/time to be set.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.set_date = function (date) {
    SimpleCalendar.calendar.my_date = date;

    var elms = SimpleCalendar.calendar.getElementsByClassName('month_selector');
    if (elms.length > 0) {
        elms[0].value = date.getMonth();
    }
    
    elms = SimpleCalendar.calendar.getElementsByClassName('year_selector');
    if (elms.length > 0) {
        elms[0].value = date.getFullYear();
    }

    elms = SimpleCalendar.calendar.getElementsByClassName('day');
    if (elms.length == 0) {
        alert('No day cells found!');
        return;
    }

    var today_date = SimpleCalendar.get_current_date(SimpleCalendar.calendar.my_field.calendar_config);
    
    var first_day_date = new Date(date.getFullYear(), date.getMonth(), 1);
    var first_day_of_week = first_day_date.getDay();
    if (first_day_of_week == 0) first_day_of_week = 7;

    var other_month_date = SimpleCalendar.get_previous_day(first_day_date);

    var current_date = new Date(other_month_date.getFullYear(), other_month_date.getMonth(), other_month_date.getDate() - first_day_of_week + 2, 0, 0, 0);

    for (var i = 0; i < elms.length; i++) {
        elms[i].classList.remove('holiday');
        elms[i].classList.remove('other_month');
        elms[i].classList.remove('today');
        elms[i].classList.remove('selected_date');

        elms[i].innerHTML = current_date.getDate();
        elms[i].my_date = current_date;

        if (SimpleCalendar.is_holiday(current_date, SimpleCalendar.calendar.my_field.calendar_config)) elms[i].classList.add('holiday');

        if (current_date.getMonth() != date.getMonth() ||
            current_date.getFullYear() != date.getFullYear()) elms[i].classList.add('other_month');

        if (current_date.getFullYear() == today_date.getFullYear() &&
            current_date.getMonth() == today_date.getMonth() &&
            current_date.getDate() == today_date.getDate()
        ) elms[i].classList.add('today');

        if (SimpleCalendar.calendar.my_date &&
            current_date.getFullYear() == SimpleCalendar.calendar.my_date.getFullYear() &&
            current_date.getMonth() == SimpleCalendar.calendar.my_date.getMonth() &&
            current_date.getDate() == SimpleCalendar.calendar.my_date.getDate()
        ) elms[i].classList.add('selected_date');

        current_date = SimpleCalendar.get_next_day(current_date);
    }
};

/**
 * The function is an auxiliary function for removing observation events.
 *
 * @protected
 *
 * @param {HTMLElement} field
 * The target input field with the calendar.
 *
 * @see SimpleCalendar.add_observation_events
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.remove_observation_events = function (field) {
    for (const fn of field.event_cleanup_fns) fn();
};

/**
 * The function is an auxiliary function for adding observation events.
 *
 * @protected
 *
 * @param {HTMLElement} field
 * The target input field with the calendar.
 *
 * @see SimpleCalendar.remove_observation_events
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.add_observation_events = function (field) {
    SimpleCalendar.collect_ancestors(field);

    field.event_cleanup_fns = [];
    
    for (const ancestor of field.ancestors) {
        const reposition_fn = function () {
            SimpleCalendar.position_calendar(field);  
        };

        SimpleCalendar.add_event(ancestor, "scroll", reposition_fn);
        field.event_cleanup_fns.push(function () {
            SimpleCalendar.remove_event(ancestor, "scroll", reposition_fn);
        });

        const ro = new ResizeObserver(reposition_fn);
        ro.observe(ancestor);

        field.event_cleanup_fns.push(function () {
            ro.disconnect();
        });
    }

    const reposition_fn = function () {
        SimpleCalendar.position_calendar(field);  
    };

    SimpleCalendar.add_event(window, "resize", reposition_fn);
    field.event_cleanup_fns.push(function () {
        SimpleCalendar.remove_event(window, "resize", reposition_fn);
    });

    SimpleCalendar.add_event(window, "scroll", reposition_fn);
    field.event_cleanup_fns.push(function () {
        SimpleCalendar.remove_event(window, "scroll", reposition_fn);
    });
};

/**
 * The function is an auxiliary function for getting scrollable ancentors.
 *
 * @protected
 *
 * @param {HTMLElement} field
 * The target input field with the calendar.
 *
 * @returns {Array.<Object>}
 * Returns the list of scrollable containers.
 *
 * @author
 * Oleg Schildt
 */
SimpleCalendar.collect_ancestors = function (field) {
    field.ancestors = [];
    
    let parent = field.parentElement;

    while (parent) {
        if (!field.ancestors.includes(parent)) {
            field.ancestors.push(parent);
        }
        parent = parent.parentElement;
    }

    if (!field.ancestors.includes(document.body)) {
        field.ancestors.push(document.body);
    }

    if (!field.ancestors.includes(document.documentElement)) {
        field.ancestors.push(document.documentElement);
    }
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

    SimpleCalendar.hide();
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

/**
 * Callback function called when the calendar is shown or hidden.
 *
 * @callback hide_show_handler_callback
 *
 * @author
 * Oleg Schildt
 */
 

