/**
 * @file
 * Provides the SimpleCalendar date picker.
 *
 * @author Oleg Schildt
 */

/**
 * The namespace for the simple calendar, exposed to classic scripts.
 *
 * @namespace SimpleCalendar
 * @tutorial 5.using_calendar
 *
 * @author Oleg Schildt
 */

var SimpleCalendar = {};

/**
 * The shared calendar control, created on first assignment.
 *
 * @type {?HTMLDivElement}
 *
 * @author Oleg Schildt
 */
SimpleCalendar.calendar = null;

/**
 * Registers a callback for opening and closing the calendar.
 *
 * @param {?hide_show_handler_callback} handler
 * The callback, or null to unregister it.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.set_hide_show_handler = function (handler) {
    SimpleCalendar.handler = handler;
}; // set_hide_show_handler

/**
 * Registers a DOM event listener.
 *
 * @protected
 * @see SimpleCalendar.remove_event
 *
 * @param {?EventTarget} target
 * The target, if present.
 *
 * @param {string} type
 * The event type.
 *
 * @param {EventListener} listener
 * The callback for the event.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.add_event = function (target, type, listener) {
    target?.addEventListener(type, listener);
}; // add_event

/**
 * Removes a DOM event listener registered with add_event.
 *
 * @protected
 * @see SimpleCalendar.add_event
 *
 * @param {?EventTarget} target
 * The target, if present.
 *
 * @param {string} type
 * The event type.
 *
 * @param {EventListener} listener
 * The registered callback.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.remove_event = function (target, type, listener) {
    target?.removeEventListener(type, listener);
}; // remove_event

/**
 * Dispatches a bubbling DOM event.
 *
 * @protected
 *
 * @param {EventTarget} target
 * The event target.
 *
 * @param {string} type
 * The event type.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.fire_event = function (target, type) {
    target.dispatchEvent(new Event(type, { bubbles: true }));
}; // fire_event

/**
 * Creates a Date from numeric calendar parts, allowing overflow for date arithmetic.
 *
 * @protected
 *
 * @param {Object} parts
 * Year Y, one-based month m, day d, and optional H, i, s and ms time parts.
 *
 * @param {boolean} utc
 * Whether to store the calendar parts in UTC.
 *
 * @returns {Date}
 * The date, or an invalid Date if the result exceeds the Date range.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.create_date = function ({ Y, m, d, H = 0, i = 0, s = 0, ms = 0 }, utc) {
    const date = new Date(0);

    // setFullYear and setUTCFullYear preserve years 0 through 99.
    if (utc) {
        date.setUTCFullYear(Y, m - 1, d);
        date.setUTCHours(H, i, s, ms);
    } else {
        date.setFullYear(Y, m - 1, d);
        date.setHours(H, i, s, ms);
    }

    return date;
}; // create_date

/**
 * Extracts date and time parts from a Date.
 *
 * @protected
 *
 * @param {Date} date
 * The date to read.
 *
 * @param {boolean} utc
 * Whether to read UTC parts.
 *
 * @returns {{Y: number, m: number, d: number, H: number, i: number, s: number}}
 * The numeric parts, with a one-based month.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.get_date_parts = function (date, utc) {
    if (utc) {
        return {
            Y: date.getUTCFullYear(),
            m: date.getUTCMonth() + 1,
            d: date.getUTCDate(),
            H: date.getUTCHours(),
            i: date.getUTCMinutes(),
            s: date.getUTCSeconds(),
        };
    }

    return {
        Y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        H: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
    };
}; // get_date_parts

/**
 * Checks whether the given parts form a real Gregorian calendar date.
 *
 * @param {number|string} day
 * An integer day or a string of integer digits.
 *
 * @param {number|string} month
 * An integer month from 1 through 12 or its string representation.
 *
 * @param {number|string} year
 * An integer year or its string representation.
 *
 * @returns {boolean}
 * Whether the parts identify an exact date within the JavaScript Date range.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.validate_date = function (day, month, year) {
    const valid_parts = [day, month, year].every((value) =>
        (typeof value === 'number' || (typeof value === 'string' && /^[+-]?\d+$/.test(value)))
        && Number.isSafeInteger(Number(value))
    );

    if (!valid_parts) {
        return false;
    }

    const expected = { Y: Number(year), m: Number(month), d: Number(day) };
    const actual = SimpleCalendar.get_date_parts(SimpleCalendar.create_date(expected, true), true);

    return actual.Y === expected.Y && actual.m === expected.m && actual.d === expected.d;
}; // validate_date

/**
 * Gets the browser's current time zone.
 *
 * @returns {string}
 * The browser's time zone identifier.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.get_current_time_zone_code = function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}; // get_current_time_zone_code

/**
 * Reads the Gregorian calendar parts of an instant in a time zone.
 *
 * @protected
 *
 * @param {Date} date
 * The instant to read.
 *
 * @param {string} [time_zone]
 * The target time zone, defaulting to the browser's zone.
 *
 * @returns {{Y: number, m: number, d: number, H: number, i: number, s: number, ms: number}}
 * The wall-clock parts in the target zone.
 *
 * @throws {RangeError}
 * If the time zone is invalid or the date cannot be formatted.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.get_zoned_date_parts = function (date, time_zone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: time_zone,
        calendar: 'gregory',
        numberingSystem: 'latn',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hourCycle: 'h23',
        era: 'short',
    });
    const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, value]));

    return {
        Y: parts.era === 'BC' ? 1 - Number(parts.year) : Number(parts.year),
        m: Number(parts.month),
        d: Number(parts.day),
        H: Number(parts.hour),
        i: Number(parts.minute),
        s: Number(parts.second),
        ms: date.getUTCMilliseconds(),
    };
}; // get_zoned_date_parts

/**
 * Gets the current calendar date and time in the configured time zone.
 *
 * @param {CalendarConfigDef} config
 * The calendar configuration.
 *
 * @param {boolean} [utc=false]
 * Whether UTC getters should expose the target zone's wall-clock parts.
 * The default uses local getters, subject to native Date normalization.
 *
 * @returns {Date}
 * A Date storing the wall-clock parts for calendar use.
 *
 * @throws {RangeError}
 * If the configured time zone is invalid.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.get_current_date = function (config, utc = false) {
    const parts = SimpleCalendar.get_zoned_date_parts(new Date(), config.time_zone);

    return SimpleCalendar.create_date(parts, utc);
}; // get_current_date

/**
 * Gets the offset from UTC for a time zone at a specified instant.
 *
 * @param {Date} date
 * The instant at which to measure the offset.
 *
 * @param {string} time_zone
 * The target time zone identifier.
 *
 * @returns {number}
 * The signed offset in milliseconds.
 *
 * @throws {RangeError}
 * If the time zone is invalid or the date cannot be formatted.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.get_time_zone_offset = function (date, time_zone) {
    const parts = SimpleCalendar.get_zoned_date_parts(date, time_zone);

    return SimpleCalendar.create_date(parts, true).getTime() - date.getTime();
}; // get_time_zone_offset

/**
 * Splits a date format into supported tokens and literal characters.
 *
 * @protected
 *
 * @param {string} format
 * A format using Y, m, d, H, i or s and backslash escapes.
 *
 * @returns {Array<{token: (string|undefined), literal: (string|undefined)}>}
 * The tokens and literals in format order.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.get_format_parts = function (format) {
    return Array.from(format.matchAll(/\\([\s\S])|([YmdHis])|([\s\S])/g), ([, escaped, token, literal]) => ({
        token,
        literal: escaped ?? literal,
    }));
}; // get_format_parts

/**
 * Formats a date using the supported PHP-style tokens.
 *
 * @param {?Date} time
 * The date and time to format.
 *
 * @param {string} format
 * The format, with Y, m, d, H, i and s tokens and backslash escapes.
 *
 * @param {boolean} [utc=false]
 * Whether to read UTC date parts.
 *
 * @returns {string}
 * The formatted date, or an empty string for a missing or invalid date.
 *
 * @see SimpleCalendar.string_to_time
 *
 * @author Oleg Schildt
 */
SimpleCalendar.time_to_string = function (time, format, utc = false) {
    if (!time || !Number.isFinite(time.getTime())) {
        return '';
    }

    const parts = SimpleCalendar.get_date_parts(time, utc);

    return SimpleCalendar.get_format_parts(format).map(({ token, literal }) => {
        if (!token) {
            return literal;
        }

        const value = parts[token];
        const sign = value < 0 ? '-' : '';
        const digits = String(Math.abs(value)).padStart(token === 'Y' ? 4 : 2, '0');

        return sign + digits;
    }).join('');
}; // time_to_string

/**
 * Parses a complete date, a complete time, or both using a PHP-style format.
 *
 * @param {string} str
 * The input to match against the entire format.
 *
 * @param {string} format
 * The format, with Y, m, d, H, i and s tokens and backslash escapes.
 *
 * @param {boolean} [utc=false]
 * Whether to store the parsed parts in UTC.
 *
 * @param {Date} [base_date]
 * The day to use for omitted date parts, defaulting to the current day.
 *
 * @returns {?Date}
 * The resulting date, or null for a mismatch, conflicting repeat or invalid date or time.
 *
 * @see SimpleCalendar.time_to_string
 *
 * @author Oleg Schildt
 */
SimpleCalendar.string_to_time = function (str, format, utc = false, base_date) {
    const tokens = [];
    const pattern = SimpleCalendar.get_format_parts(format).map(({ token, literal }) => {
        if (!token) {
            return literal.replace(/[.*+?^$|(){}[\]\\]/g, '\\$&');
        }

        tokens.push(token);

        return token === 'Y' ? '([0-9]{4})' : '([0-9]{1,2})';
    }).join('');
    const result = new RegExp('^' + pattern + '$').exec(str);

    if (!result || result[0] !== str) {
        return null;
    }

    const values = Object.create(null);

    for (const [index, token] of tokens.entries()) {
        const value = Number(result[index + 1]);

        if (token in values && values[token] !== value) {
            return null;
        }

        values[token] = value;
    }

    const has_date = ['Y', 'm', 'd'].every((token) => token in values);
    const has_time = 'H' in values && 'i' in values;

    if (!has_date && !has_time) {
        return null;
    }

    const base = has_date ? values : SimpleCalendar.get_date_parts(base_date ?? new Date(), utc);
    const parts = {
        Y: values.Y ?? base.Y,
        m: values.m ?? base.m,
        d: values.d ?? base.d,
        H: values.H ?? 0,
        i: values.i ?? 0,
        s: values.s ?? 0,
    };
    const date = SimpleCalendar.create_date(parts, utc);
    const actual = SimpleCalendar.get_date_parts(date, utc);

    // Date-only input stays valid when a local midnight transition advances the clock.
    const same_day = actual.Y === parts.Y && actual.m === parts.m && actual.d === parts.d;
    const same_fields = Object.keys(values).every((token) => values[token] === actual[token]);

    return same_day && same_fields ? date : null;
}; // string_to_time

/**
 * Positions the shared calendar next to its active field within the visible viewport.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The active field used as the anchor.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.position_calendar = function (field) {
    const calendar = SimpleCalendar.calendar;

    if (calendar?.my_field !== field) {
        return;
    }

    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;
    const width = Math.min(document.documentElement.clientWidth, viewport?.width ?? Infinity);
    const height = Math.min(document.documentElement.clientHeight, viewport?.height ?? Infinity);
    const right = left + width;
    const bottom = top + height;

    calendar.style.setProperty('--calendar-available-width', width + 'px');
    calendar.style.maxHeight = height + 'px';

    const field_rect = field.getBoundingClientRect();
    const popup_rect = calendar.getBoundingClientRect();
    const below = field_rect.bottom + 2;
    const above = field_rect.top - 4;
    const use_above = below + popup_rect.height > bottom && above - top > bottom - below;
    const preferred_x = field_rect.left + popup_rect.width <= right
        ? field_rect.left
        : field_rect.right - popup_rect.width;
    const preferred_y = use_above ? above - popup_rect.height : below;

    calendar.style.left = Math.max(left, Math.min(preferred_x, right - popup_rect.width)) + 'px';
    calendar.style.top = Math.max(top, Math.min(preferred_y, bottom - popup_rect.height)) + 'px';
}; // position_calendar

/**
 * Clears an invalid value when the user leaves an editable calendar field.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The field whose value should be checked.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.clear_invalid_value = function (field) {
    if (!field.readOnly && !field.disabled && field.value.trim()
        && !SimpleCalendar.string_to_time(field.value.trim(), field.calendar_config.format, true)) {
        field.value = '';
    }
}; // clear_invalid_value

/**
 * Handles focus moving from the field or calendar controls.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The field associated with the focus transition.
 *
 * @param {?EventTarget} next
 * The newly focused element, if the browser reports one.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.handle_focus_exit = function (field, next) {
    const calendar = SimpleCalendar.calendar;

    if (calendar.my_field !== field) {
        SimpleCalendar.clear_invalid_value(field);

        return;
    }

    if (next === field || (next instanceof Node && calendar.contains(next))) {
        return;
    }

    if (next === null) {
        // A blur can arrive without a focus target. Let the browser settle focus first.
        clearTimeout(calendar.blur_timeout);
        calendar.blur_timeout = setTimeout(SimpleCalendar.hide_if_inactive, 0);

        return;
    }

    SimpleCalendar.clear_invalid_value(field);
    SimpleCalendar.hide();
}; // handle_focus_exit

/**
 * Connects an editable text input to the shared calendar.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The text input to initialize.
 *
 * @param {CalendarConfigDef} config
 * The field's calendar configuration.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.init_field = function (field, config) {
    if (field.classList.contains('simple_calendar_added')) {
        return;
    }

    field.calendar_config = config;
    field.autocomplete = 'off';

    if (config.placeholder) {
        field.placeholder = config.placeholder;
    }

    field.classList.add('simple_calendar_added');
    field.setAttribute('role', 'combobox');
    field.setAttribute('aria-haspopup', 'dialog');
    field.setAttribute('aria-controls', SimpleCalendar.calendar.id);
    field.setAttribute('aria-expanded', 'false');

    field.addEventListener('focus', () => {
        if (SimpleCalendar.calendar.returning_focus_to !== field) {
            SimpleCalendar.show(field);
        }
    });
    field.addEventListener('click', () => {
        SimpleCalendar.show(field);
    });
    field.addEventListener('blur', (event) => {
        SimpleCalendar.handle_focus_exit(field, event.relatedTarget);
    });
    field.addEventListener('input', () => {
        SimpleCalendar.set_date_from_field(field);
    });
    field.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' && !event.isComposing && !field.readOnly && !field.disabled) {
            event.preventDefault();
            SimpleCalendar.show(field);

            if (SimpleCalendar.calendar.my_field === field) {
                SimpleCalendar.focus_date();
            }
        }
    });
}; // init_field

/**
 * Creates the shared popup and its month, year and day controls.
 *
 * @protected
 *
 * @author Oleg Schildt
 */
SimpleCalendar.create_calendar = function () {
    if (SimpleCalendar.calendar !== null) {
        return;
    }

    const calendar = document.createElement('div');
    const table = document.createElement('table');
    const table_body = table.createTBody();
    const header = table_body.insertRow().insertCell();
    const controls = document.createElement('div');

    calendar.id = 'simple_calendar_popup';

    for (let suffix = 2; document.getElementById(calendar.id); suffix++) {
        calendar.id = 'simple_calendar_popup_' + suffix;
    }

    calendar.classList.add('calendar_container');
    calendar.setAttribute('role', 'dialog');
    calendar.setAttribute('aria-label', 'Calendar');

    header.classList.add('calendar_head');
    header.colSpan = 7;

    controls.classList.add('calendar_head_area');
    header.append(controls);

    for (const [direction, label] of [[-1, 'Previous month'], [1, 'Next month']]) {
        const arrow = document.createElement('button');

        arrow.type = 'button';
        arrow.classList.add(direction < 0 ? 'arrow_left' : 'arrow_right');
        arrow.textContent = '➤';
        arrow.setAttribute('aria-label', label);
        arrow.addEventListener('click', () => {
            if (calendar.my_field) {
                const { Y, m } = SimpleCalendar.get_date_parts(calendar.my_date, true);

                SimpleCalendar.set_date(SimpleCalendar.create_date({ Y, m: m + direction + 1, d: 0 }, true), true);
            }
        });

        controls.append(arrow);
    }

    for (const [name, label] of [['month', 'Month'], ['year', 'Year']]) {
        const select = document.createElement('select');

        select.classList.add(name + '_selector');
        select.setAttribute('aria-label', label);
        select.addEventListener('change', () => {
            if (calendar.my_field && select.value !== '') {
                const { Y, m } = SimpleCalendar.get_date_parts(calendar.my_date, true);
                const year = name === 'year' ? Number(select.value) : Y;
                const month = name === 'month' ? Number(select.value) + 1 : m;

                SimpleCalendar.set_date(SimpleCalendar.create_date({ Y: year, m: month + 1, d: 0 }, true), true);
            }
        });

        controls.insertBefore(select, controls.lastElementChild);
    }

    const weekdays = table_body.insertRow();

    weekdays.classList.add('weekday_head');

    for (let column = 0; column < 7; column++) {
        const weekday = document.createElement('th');

        weekday.scope = 'col';
        weekday.dataset.weekday = column;
        weekday.classList.add('weekday');
        weekday.classList.toggle('weekend', column > 4);

        weekdays.append(weekday);
    }

    for (let week = 0; week < 6; week++) {
        const row = table_body.insertRow();

        for (let column = 0; column < 7; column++) {
            const cell = row.insertCell();
            const button = document.createElement('button');

            cell.classList.add('day');
            cell.classList.toggle('weekend', column > 4);
            button.type = 'button';
            button.tabIndex = -1;

            cell.append(button);

            cell.addEventListener('click', () => {
                const field = calendar.my_field;

                if (!field || field.readOnly || field.disabled || button.disabled) {
                    return;
                }

                field.value = SimpleCalendar.time_to_string(cell.my_date, field.calendar_config.format, true);

                // Finish closing the popup before invoking external change listeners.
                SimpleCalendar.hide(true);
                SimpleCalendar.fire_event(field, 'change');
            });
        }
    }

    calendar.addEventListener('focusout', (event) => {
        if (calendar.my_field) {
            SimpleCalendar.handle_focus_exit(calendar.my_field, event.relatedTarget);
        }
    });
    calendar.addEventListener('mousedown', (event) => {
        if (event.button === 0 && document.activeElement === calendar.my_field && !event.target.closest('select')) {
            // Keep the field focused when a browser does not focus a clicked button.
            event.preventDefault();
        }
    });
    calendar.addEventListener('keydown', SimpleCalendar.handle_day_key);

    calendar.calendar_table = table;
    SimpleCalendar.calendar = calendar;

    calendar.append(table);
    document.body.append(calendar);
    SimpleCalendar.observe_escape();
}; // create_calendar

/**
 * Updates the calendar from the active field, falling back to today in its time zone.
 *
 * @protected
 *
 * @param {HTMLInputElement} [field]
 * The field that triggered the update, defaulting to the active field.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.set_date_from_field = function (field = SimpleCalendar.calendar?.my_field) {
    if (!field || SimpleCalendar.calendar.my_field !== field) {
        return;
    }

    const config = field.calendar_config;
    const today = SimpleCalendar.get_current_date(config, true);
    const date = SimpleCalendar.string_to_time(field.value.trim(), config.format, true, today) ?? today;

    SimpleCalendar.set_date(date, true, today);
}; // set_date_from_field

/**
 * The configuration accepted by SimpleCalendar.assign.
 *
 * @typedef {Object} CalendarConfigDef
 *
 * @property {string} [format=Y-m-d]
 * A PHP-style format using Y, m, d, H, i and s. A backslash escapes the next character.
 *
 * @property {string} [time_zone]
 * The time zone used to determine today. Defaults to the browser's zone.
 *
 * @property {string} [placeholder]
 * The hint shown in the input field.
 *
 * @property {number|string} [start_year]
 * The first year in the default year list, or the current year minus ten.
 *
 * @property {number|string} [end_year]
 * The last year in the default year list, or the current year plus ten.
 *
 * @property {Date[]} [holidays]
 * Holidays compared by local date. Use the year 1970 for annually recurring dates.
 *
 * @property {string[]} [month_names]
 * Twelve month names in calendar order. Defaults to English.
 *
 * @property {string[]} [weekday_names]
 * Seven weekday names starting on Monday. Defaults to English.
 *
 * @author Oleg Schildt
 */

/**
 * Adds calendar functionality to a text input or to each text input matched by a selector.
 *
 * @param {string|HTMLInputElement} field_ref
 * A CSS selector such as #begin_date, or the text input element itself.
 *
 * @param {CalendarConfigDef} [config]
 * The optional calendar configuration.
 *
 * @throws {DOMException}
 * If the CSS selector is invalid.
 *
 * @throws {RangeError}
 * If the configured time zone is invalid.
 *
 * @tutorial 5.using_calendar
 *
 * @author Oleg Schildt
 */
SimpleCalendar.assign = function (field_ref, config) {
    const fields = typeof field_ref === 'string' && field_ref
        ? Array.from(document.querySelectorAll(field_ref))
        : [field_ref];
    const inputs = fields.filter((field) => field instanceof HTMLInputElement && field.type === 'text');

    if (inputs.length === 0) {
        return;
    }

    config = config || {};
    config.time_zone = config.time_zone || SimpleCalendar.get_current_time_zone_code();

    const year = SimpleCalendar.get_current_date(config, true).getUTCFullYear();
    const first_year = Number(String(config.start_year ?? '').trim() || year - 10);
    const last_year = Number(String(config.end_year ?? '').trim() || year + 10);

    config.format = config.format || 'Y-m-d';
    config.start_year = Math.max(0, Math.min(9999, Number.isInteger(first_year) ? first_year : year - 10));
    config.end_year = Math.max(0, Math.min(9999, Number.isInteger(last_year) ? last_year : year + 10));

    if (config.start_year > config.end_year) {
        [config.start_year, config.end_year] = [config.end_year, config.start_year];
    }

    config.month_names = config.month_names || [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    config.weekday_names = config.weekday_names || ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    SimpleCalendar.create_calendar();

    for (const field of inputs) {
        SimpleCalendar.init_field(field, config);
    }
}; // assign

/**
 * Checks whether a calendar day is a configured holiday.
 *
 * @protected
 *
 * @param {Date} date
 * The calendar day to check.
 *
 * @param {CalendarConfigDef} config
 * The configuration containing the holiday dates.
 *
 * @param {boolean} [utc=false]
 * Whether to read the calendar day's UTC parts. Holiday Date objects use local parts.
 *
 * @returns {boolean}
 * Whether the day matches a one-time or annually recurring holiday.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.is_holiday = function (date, config, utc = false) {
    const { Y, m, d } = SimpleCalendar.get_date_parts(date, utc);

    return config.holidays?.some((holiday) => {
        const parts = SimpleCalendar.get_date_parts(holiday, false);

        return (parts.Y === Y || parts.Y === 1970) && parts.m === m && parts.d === d;
    }) ?? false;
}; // is_holiday

/**
 * Attaches the shared calendar to a field and populates its controls.
 *
 * @protected
 * @see SimpleCalendar.detach_from_calender
 *
 * @param {HTMLInputElement} field
 * The field whose options and value are shown.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.attach_to_calender = function (field) {
    const calendar = SimpleCalendar.calendar;
    const config = field.calendar_config;
    const month_select = calendar.querySelector('.month_selector');
    const year_select = calendar.querySelector('.year_selector');

    calendar.my_field = field;
    field.my_calendar = calendar;
    month_select.options.length = 0;
    year_select.options.length = 0;
    calendar.extra_year_option = null;

    for (let month = 0; month < 12; month++) {
        month_select.add(new Option(config.month_names[month], month));
    }

    const options = document.createDocumentFragment();

    for (let year = config.start_year; year <= config.end_year; year++) {
        options.append(new Option(year, year));
    }

    year_select.append(options);

    for (const weekday of calendar.querySelectorAll('.weekday_head .weekday')) {
        weekday.textContent = config.weekday_names[weekday.dataset.weekday];
    }

    SimpleCalendar.set_date_from_field(field);
    SimpleCalendar.add_observation_events(field);
}; // attach_to_calender

/**
 * Detaches the shared calendar and removes the field's positioning observers.
 *
 * @protected
 * @see SimpleCalendar.attach_to_calender
 *
 * @param {HTMLInputElement} field
 * The field currently attached to the calendar.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.detach_from_calender = function (field) {
    const calendar = SimpleCalendar.calendar;

    calendar.my_field = null;
    field.my_calendar = null;

    clearTimeout(calendar.blur_timeout);
    SimpleCalendar.remove_observation_events(field);
}; // detach_from_calender

/**
 * Opens the calendar for an assigned editable field.
 *
 * @protected
 * @see SimpleCalendar.hide
 *
 * @param {HTMLInputElement} field
 * The assigned field that anchors the calendar.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.show = function (field) {
    const calendar = SimpleCalendar.calendar;

    if (!calendar || !field?.calendar_config || field.readOnly || field.disabled) {
        return;
    }

    if (calendar.my_field === field) {
        SimpleCalendar.position_calendar(field);

        return;
    }

    SimpleCalendar.hide();

    // A visibility callback can open the calendar for a different field.
    if (calendar.my_field) {
        return;
    }

    SimpleCalendar.attach_to_calender(field);

    calendar.style.display = 'block';
    calendar.scrollTop = 0;

    field.setAttribute('aria-expanded', 'true');
    SimpleCalendar.position_calendar(field);
    SimpleCalendar.handler?.();
}; // show

/**
 * Closes the calendar and optionally moves focus from the popup to its field.
 *
 * @protected
 * @see SimpleCalendar.show
 * @see SimpleCalendar.hide_if_inactive
 *
 * @param {boolean} [restore_focus=false]
 * Whether to restore focus to the field when a popup control has focus.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.hide = function (restore_focus = false) {
    const calendar = SimpleCalendar.calendar;
    const field = calendar?.my_field;

    if (!field) {
        return;
    }

    const should_restore = restore_focus && calendar.contains(document.activeElement);

    SimpleCalendar.detach_from_calender(field);

    calendar.style.display = 'none';

    field.setAttribute('aria-expanded', 'false');

    if (should_restore) {
        calendar.returning_focus_to = field;

        try {
            field.focus({ preventScroll: true });
        } finally {
            calendar.returning_focus_to = null;
        }
    }

    SimpleCalendar.handler?.();
}; // hide

/**
 * Closes the calendar if focus has moved outside its field and controls.
 *
 * @protected
 * @see SimpleCalendar.handle_focus_exit
 *
 * @author Oleg Schildt
 */
SimpleCalendar.hide_if_inactive = function () {
    const calendar = SimpleCalendar.calendar;
    const field = calendar?.my_field;
    const active = document.activeElement;

    if (field && active !== field && !calendar.contains(active)) {
        SimpleCalendar.clear_invalid_value(field);
        SimpleCalendar.hide();
    }
}; // hide_if_inactive

/**
 * Gets the previous calendar day without mutating the input date.
 *
 * @param {Date} date
 * The date from which to move back one day.
 *
 * @see SimpleCalendar.get_next_day
 *
 * @returns {Date}
 * The previous local calendar day, with the time preserved where possible.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.get_previous_day = function (date) {
    const previous = new Date(date);

    previous.setDate(previous.getDate() - 1);

    return previous;
}; // get_previous_day

/**
 * Gets the next calendar day without mutating the input date.
 *
 * @param {Date} date
 * The date from which to advance one day.
 *
 * @param {boolean} [utc=false]
 * Whether to advance the UTC day.
 *
 * @see SimpleCalendar.get_previous_day
 *
 * @returns {Date}
 * The next calendar day, with the time preserved where possible.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.get_next_day = function (date, utc = false) {
    const next = new Date(date);

    if (utc) {
        next.setUTCDate(next.getUTCDate() + 1);
    } else {
        next.setDate(next.getDate() + 1);
    }

    return next;
}; // get_next_day

/**
 * Renders the month containing the requested day.
 *
 * @protected
 *
 * @param {Date} date
 * The date to display for an open calendar. Its year must be from 0 to 9999.
 *
 * @param {boolean} [utc=false]
 * Whether to read the input date's UTC parts.
 *
 * @param {Date} [today]
 * Today's civil date stored in UTC, if it has already been determined.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.set_date = function (date, utc = false, today) {
    const calendar = SimpleCalendar.calendar;
    const field = calendar?.my_field;
    const parts = SimpleCalendar.get_date_parts(date, utc);
    const { Y, m, d } = parts;

    if (!field || !Number.isInteger(Y) || Y < 0 || Y > 9999) {
        return;
    }

    const config = field.calendar_config;
    const year_select = calendar.querySelector('.year_selector');
    const today_parts = SimpleCalendar.get_date_parts(today ?? SimpleCalendar.get_current_date(config, true), true);
    const first_day = SimpleCalendar.create_date({ Y, m, d: 1 }, true);
    const days_before = (first_day.getUTCDay() + 6) % 7;
    let current = SimpleCalendar.create_date({ Y, m, d: 1 - days_before }, true);

    // UTC keeps the civil date grid independent of the browser's daylight-saving transitions.
    calendar.my_date = utc ? date : SimpleCalendar.create_date(parts, true);
    calendar.querySelector('.month_selector').value = m - 1;
    calendar.querySelector('.arrow_left').disabled = Y === 0 && m === 1;
    calendar.querySelector('.arrow_right').disabled = Y === 9999 && m === 12;

    if (calendar.extra_year_option && calendar.extra_year_option.value !== String(Y)) {
        calendar.extra_year_option.remove();

        calendar.extra_year_option = null;
    }

    if ((Y < config.start_year || Y > config.end_year) && !calendar.extra_year_option) {
        calendar.extra_year_option = new Option(Y, Y);

        year_select.add(calendar.extra_year_option, Y < config.start_year ? 0 : year_select.options.length);
    }

    year_select.value = Y;

    for (const cell of calendar.querySelectorAll('.day')) {
        const day = SimpleCalendar.get_date_parts(current, true);
        const button = cell.firstElementChild;
        const in_month = day.Y === Y && day.m === m;
        const is_selected = in_month && day.d === d;
        const is_today = day.Y === today_parts.Y && day.m === today_parts.m && day.d === today_parts.d;

        cell.my_date = current;
        button.textContent = day.d;
        button.tabIndex = is_selected ? 0 : -1;
        button.disabled = day.Y < 0 || day.Y > 9999;

        button.setAttribute('aria-label', config.month_names[day.m - 1] + ' ' + day.d + ', ' + day.Y);

        if (is_today) {
            button.setAttribute('aria-current', 'date');
        } else {
            button.removeAttribute('aria-current');
        }

        cell.classList.toggle('holiday', SimpleCalendar.is_holiday(current, config, true));
        cell.classList.toggle('other_month', !in_month);
        cell.classList.toggle('today', is_today);
        cell.classList.toggle('selected_date', is_selected);

        current = SimpleCalendar.get_next_day(current, true);
    }
}; // set_date

/**
 * Focuses the day that is currently highlighted in the calendar.
 *
 * @protected
 *
 * @author Oleg Schildt
 */
SimpleCalendar.focus_date = function () {
    SimpleCalendar.calendar.querySelector('.selected_date button')?.focus();
}; // focus_date

/**
 * Moves the highlighted day in response to the arrow keys in the date table.
 *
 * @protected
 *
 * @param {KeyboardEvent} event
 * A key press on a day button.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.handle_day_key = function (event) {
    const cell = event.target.closest('.day');
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];

    if (!cell || event.isComposing || typeof offset !== 'number') {
        return;
    }

    const parts = SimpleCalendar.get_date_parts(cell.my_date, true);
    const date = SimpleCalendar.create_date({ ...parts, d: parts.d + offset }, true);

    event.preventDefault();
    SimpleCalendar.set_date(date, true);
    SimpleCalendar.focus_date();
}; // handle_day_key

/**
 * Removes the active field's resize and scroll listeners.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The field whose active observation session is ending.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.remove_observation_events = function (field) {
    const cleanup = field.calendar_observation_cleanup;

    delete field.calendar_observation_cleanup;

    cleanup?.();
}; // remove_observation_events

/**
 * Updates the popup position when its anchor or visible area changes.
 *
 * @protected
 *
 * @param {HTMLInputElement} field
 * The field whose ancestors and size are observed.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.add_observation_events = function (field) {
    const calendar = SimpleCalendar.calendar;
    const viewport = window.visualViewport;
    const ancestors = SimpleCalendar.collect_ancestors(field);
    const controller = new AbortController();
    const options = { signal: controller.signal, passive: true };
    let frame = null;

    const schedule_position = () => {
        if (frame === null) {
            frame = requestAnimationFrame(() => {
                frame = null;

                SimpleCalendar.position_calendar(field);
            });
        }
    };

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule_position) : null;

    for (const element of ancestors) {
        element.addEventListener('scroll', schedule_position, options);
        observer?.observe(element);
    }

    observer?.observe(field);
    observer?.observe(calendar);
    window.addEventListener('resize', schedule_position, options);
    window.addEventListener('scroll', schedule_position, options);
    viewport?.addEventListener('resize', schedule_position, options);
    viewport?.addEventListener('scroll', schedule_position, options);

    field.calendar_observation_cleanup = () => {
        controller.abort();
        observer?.disconnect();

        if (frame !== null) {
            cancelAnimationFrame(frame);
        }
    };
}; // add_observation_events

/**
 * Lists field ancestors that can affect the field's viewport position.
 *
 * @protected
 *
 * @param {HTMLElement} field
 * The field from which to walk the ancestor chain.
 *
 * @returns {Element[]}
 * The ancestors from the nearest parent to the document root.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.collect_ancestors = function (field) {
    const ancestors = [];

    for (let parent = field.parentElement; parent; parent = parent.parentElement) {
        ancestors.push(parent);
    }

    return ancestors;
}; // collect_ancestors

/**
 * Closes the open popup on Escape and restores focus when necessary.
 *
 * @protected
 * @see SimpleCalendar.observe_escape
 *
 * @param {KeyboardEvent} event
 * The key press to check.
 *
 * @author Oleg Schildt
 */
SimpleCalendar.handle_escape = function (event) {
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || !SimpleCalendar.calendar?.my_field) {
        return;
    }

    event.preventDefault();
    SimpleCalendar.hide(true);
}; // handle_escape

/**
 * Registers the Escape handler. Repeated calls use the same listener.
 *
 * @protected
 * @see SimpleCalendar.handle_escape
 *
 * @author Oleg Schildt
 */
SimpleCalendar.observe_escape = function () {
    SimpleCalendar.add_event(window, 'keydown', SimpleCalendar.handle_escape);
}; // observe_escape

/**
 * A callback invoked when the calendar actually opens or closes.
 *
 * @callback hide_show_handler_callback
 *
 * @author Oleg Schildt
 */
