let SimpleCalendar = {};

SimpleCalendar.add_event = function (oEmt, sEvt, act) {
    if (!oEmt) return;
    if (oEmt.addEventListener)
        oEmt.addEventListener(sEvt, act, false);
    else if (oEmt.attachEvent)
        oEmt.attachEvent('on' + sEvt, act);
    else
        oEmt['on' + sEvt] = act;
};

SimpleCalendar.fire_event = function (oEmt, sEvt) {
    if ("createEvent" in document) {
        let evt = document.createEvent("HTMLEvents");
        evt.initEvent(sEvt, false, true);
        oEmt.dispatchEvent(evt);
    } else
        oEmt.fireEvent('on' + sEvt);
};

SimpleCalendar.validate_date = function (day, month, year) {
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) {
        return false;
    }

    let dt = new Date(year, month + 1, 0);

    if (day < 1 || day > dt.getDate()) {
        return false;
    }

    return true;
};

SimpleCalendar.time_to_string = function (time, format) {
    if (!time) return "";

    let timestr = format;
    let aux;

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

SimpleCalendar.string_to_time = function (str, format) {
    let pattern = format;

    pattern = pattern.replace(/\./g, "\\.");
    pattern = pattern.replace(/\//g, "\\/");

    pattern = pattern.replace(/d/, "([0-9]{1,2})");
    pattern = pattern.replace(/m/, "([0-9]{1,2})");
    pattern = pattern.replace(/Y/, "([0-9]{4})");
    pattern = pattern.replace(/H/, "([0-9]{1,2})");
    pattern = pattern.replace(/i/, "([0-9]{1,2})");
    pattern = pattern.replace(/s/, "([0-9]{1,2})");

    let re = new RegExp(pattern);
    let result = re.exec(str);

    if (!result) return null;

    let units = new Array();
    units[0] = RegExp.$1;
    units[1] = RegExp.$2;
    units[2] = RegExp.$3;
    units[3] = RegExp.$4;
    units[4] = RegExp.$5;
    units[5] = RegExp.$6;

    let order = format.replace(/[^YmdHis]/g, "");

    let i_year = order.indexOf("Y");
    let i_month = order.indexOf("m");
    let i_day = order.indexOf("d");
    let i_hour = order.indexOf("H");
    let i_minute = order.indexOf("i");
    let i_second = order.indexOf("s");

    let date_ok = false;
    let time_ok = false;

    if (i_year != -1 && i_month != -1 && i_day != -1) date_ok = true;
    if (i_hour != -1 && i_minute != -1) time_ok = true;

    if (!date_ok && !time_ok) return null;

    /*
        alert(units[i_day] + "." + units[i_month] + "." + units[i_year] + " " +
              units[i_hour] + ":" + units[i_minute] + ":" + units[i_second]
             );
    */

    let dt = new Date();

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

SimpleCalendar.log_positions = function (field) {
    let field_rect = field.getBoundingClientRect();

    console.log("Position of the field: " + field_rect.top);
    console.log("Height of the field: " + field_rect.height);
    console.log("Window Y offset: " + window.pageYOffset);
    console.log("Window inner height: " + window.innerHeight);

    let calendar_rect = field.my_calendar.getBoundingClientRect();

    console.log("Height of calendar: " + calendar_rect.height);
    console.log("Top of calendar: " + calendar_rect.top);
    console.log("Bottom  of calendar: " + calendar_rect.bottom);
    console.log("Bottom 2 of calendar: " + Math.round(field_rect.top + field_rect.height + 2 + calendar_rect.height));
};

SimpleCalendar.position_calendar = function (field) {
    let field_rect = field.getBoundingClientRect();

    let calendar_rect = field.my_calendar.getBoundingClientRect();

    if(Math.round(field_rect.top + field_rect.height + 2 + calendar_rect.height) > window.innerHeight) {
        field.my_calendar.style.top = Math.round(field_rect.top - calendar_rect.height - 2 + window.pageYOffset) + 'px';
        field.my_calendar.style.left = Math.round(field_rect.left) + 'px';
    } else {
        field.my_calendar.style.top = Math.round(field_rect.top + field_rect.height + 2 + window.pageYOffset) + 'px';
        field.my_calendar.style.left = Math.round(field_rect.left) + 'px';
    }
};

SimpleCalendar.create_calendar = function (field, config) {
    field.my_calendar = document.createElement('div');
    field.my_calendar.classList.add('calendar_container');

    // make them friends
    field.my_calendar.my_field = field;

    let calendar_table = document.createElement('table');
    let table_body = document.createElement("tbody");
    calendar_table.appendChild(table_body);

    let elm, option, tr, td;

    tr = document.createElement('tr');
    table_body.appendChild(tr);

    td = document.createElement('td');
    td.classList.add('calendar_head');
    td.colSpan = 7;
    tr.appendChild(td);

    elm = document.createElement('button');
    elm.type = 'button';
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
        let year = field.my_calendar.display_date.getFullYear();
        let month = field.my_calendar.display_date.getMonth();
        SimpleCalendar.set_date(field.my_calendar, new Date(year, month, 0));
    });
    td.appendChild(elm);

    elm = document.createElement('select');
    elm.classList.add('month_selector');
    for (let i = 0; i < 12; i++) {
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
        let year = field.my_calendar.display_date.getFullYear();
        SimpleCalendar.set_date(field.my_calendar, new Date(year, Number.parseInt(this.value) + 1, 0));
    });
    td.appendChild(elm);

    elm = document.createElement('select');
    elm.classList.add('year_selector');
    for (let i = config.start_year; i <= config.end_year; i++) {
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
        let month = field.my_calendar.display_date.getMonth();
        SimpleCalendar.set_date(field.my_calendar, new Date(Number.parseInt(this.value), month + 1, 0));
    });
    td.appendChild(elm);

    elm = document.createElement('button');
    elm.type = 'button';
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
        let year = field.my_calendar.display_date.getFullYear();
        let month = field.my_calendar.display_date.getMonth();
        SimpleCalendar.set_date(field.my_calendar, new Date(year, month + 2, 0));
    });
    td.appendChild(elm);

    tr = document.createElement('tr');
    for (let j = 0; j < 7; j++) {
        td = document.createElement('td');
        td.classList.add('weekday');
        if (j > 4) td.classList.add('weekend');
        td.innerHTML = config.weekday_names[j];
        tr.appendChild(td);
    }
    table_body.appendChild(tr);

    for (let i = 0; i < 6; i++) {
        tr = document.createElement('tr');
        table_body.appendChild(tr);

        for (let j = 0; j < 7; j++) {
            td = document.createElement('td');
            td.classList.add('day');
            if (j > 4) td.classList.add('weekend');
            tr.appendChild(td);

            SimpleCalendar.add_event(td, 'click', function () {
                // IMPORTANT! The value must be set before changing the calendar month
                field.my_calendar.my_field.value = SimpleCalendar.time_to_string(this.my_date, config.format);
                field.my_calendar.selected_date = this.my_date;
                SimpleCalendar.set_date(field.my_calendar, this.my_date);
                field.my_calendar.style.display = 'none';
                field.my_calendar.i_am_still_active = false;
            });
        }
    }

    field.my_calendar.appendChild(calendar_table);

    SimpleCalendar.add_event(field, "focus", function () {
        SimpleCalendar.hide_all(this);
        SimpleCalendar.set_date_from_field(this, config);

        field.my_calendar.style.display = 'block';
        SimpleCalendar.position_calendar(field);

        this.my_calendar.i_am_still_active = true;
    });

    SimpleCalendar.add_event(field, "blur", function () {
        let me = this;
        me.my_calendar.i_am_still_active = false;
        setTimeout(function () {
            SimpleCalendar.hide_if_inactive(me.my_calendar)
        }, 300);
    });

    SimpleCalendar.add_event(field, "keyup", function () {
        SimpleCalendar.set_date_from_field(this, config);
    });

    document.body.appendChild(field.my_calendar);

    SimpleCalendar.add_event(window, "resize", function () {
        SimpleCalendar.position_calendar(field);
    });
};

SimpleCalendar.set_date_from_field = function (field, config) {
    let date = new Date();
    if (field.value) {
        date = SimpleCalendar.string_to_time(field.value, config.format);
        if (date === null) {
            date = new Date();
        } else {
            field.my_calendar.selected_date = date;
        }
    }

    SimpleCalendar.set_date(field.my_calendar, date);
};

SimpleCalendar.assign = function (field, config) {
    if (!field) return;

    if (typeof field == "string" || typeof field == "number") {
        field = document.getElementById(field);
    }

    if (!field) return;

    if (!(field instanceof HTMLInputElement && field.type == 'text')) return;

    if (!config) config = {};

    let date = new Date();

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

    SimpleCalendar.create_calendar(field, config);

    SimpleCalendar.set_date_from_field(field, config);
};

SimpleCalendar.hide_if_inactive = function (calendar) {
    if (calendar.i_am_still_active) return;

    calendar.style.display = 'none';
};

SimpleCalendar.set_date = function (calendar, date) {
    calendar.display_date = date;

    let elms = calendar.getElementsByClassName('month_selector');
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

    let today_date = new Date();
    today_date = new Date(today_date.getFullYear(), today_date.getMonth(), today_date.getDate());

    let first_day_date = new Date(date.getFullYear(), date.getMonth(), 1);
    let first_day_of_week = first_day_date.getDay();
    if (first_day_of_week == 0) first_day_of_week = 7;

    let other_month_date = new Date(first_day_date.getTime() - 1 * 24 * 3600 * 1000);

    let current_date = new Date(other_month_date.getFullYear(), other_month_date.getMonth(), other_month_date.getDate() - first_day_of_week + 2);

    for (let i = 0; i < elms.length; i++) {
        elms[i].classList.remove('other_month');
        elms[i].classList.remove('today');
        elms[i].classList.remove('selected_date');

        elms[i].innerHTML = current_date.getDate();
        elms[i].my_date = current_date;

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

SimpleCalendar.hide_all = function (except) {
    let elms = document.getElementsByClassName('calendar_container');
    if (elms.length == 0) return;

    for (let i = 0; i < elms.length; i++) {
        if (elms[i].my_field == except) continue;

        if (elms[i].my_field == document.activeElement) {
            SimpleCalendar.fire_event(elms[i].my_field, "blur");
        }
        elms[i].style.display = 'none';
        elms[i].i_am_still_active = false;
    }
};

SimpleCalendar.handle_escape = function (ev) {
    if (ev.keyCode != 27) return;

    SimpleCalendar.hide_all();
};

if (navigator.userAgent.toLowerCase().indexOf("msie") != -1) {
    SimpleCalendar.add_event(document.body, 'keydown', SimpleCalendar.handle_escape);
} else {
    SimpleCalendar.add_event(window, 'keydown', SimpleCalendar.handle_escape);
}

