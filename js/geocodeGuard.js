/* Checks run by getGeocode before it calls the geocoding provider: latitude and longitude must be decimal degrees
 * (within -90..90 and -180..180), and the number of calls per minute is limited for the HTTP session and for the
 * whole server. Symbols: lib_Geocoding.maxRequestsPerMinutePerSession (60) and lib_Geocoding.maxRequestsPerMinute (600). */
var geocodeGuard = (function () {
	var WINDOW = 60000;

	// A latitude or longitude written as a decimal number within its range, or null.
	var coordinate = function (value, limit) {
		var text = value == null ? "" : ("" + value).replace(/^\s+|\s+$/g, "");
		if (!/^[-+]?\d{1,3}(?:\.\d{1,20})?$/.test(text)) {
			return null;
		}
		var number = parseFloat(text);
		return Math.abs(number) <= limit ? number : null;
	};

	var symbol = function (name, fallback) {
		try {
			var value = parseInt("" + com.twinsoft.convertigo.engine.Engine.theApp.databaseObjectsManager
				.getCompiledValue("$" + "{" + name + "=" + fallback + "}"), 10);
			return isNaN(value) || value < 1 ? fallback : value;
		} catch (e) {
			return fallback;
		}
	};

	// Counts a call in the one minute window of its key ("start:count" in a concurrent map); returns the count.
	var count = function (map, key, now) {
		var updated = map.compute(key, function (ignored, previous) {
			var parts = previous == null ? null : ("" + previous).split(":");
			if (parts == null || now - parseInt(parts[0], 10) >= WINDOW) {
				return now + ":1";
			}
			return parts[0] + ":" + (parseInt(parts[1], 10) + 1);
		});
		return parseInt(("" + updated).split(":")[1], 10);
	};

	var sharedMap = function (holder) {
		var map = holder.getAttribute("lib_Geocoding.calls");
		if (map == null) {
			map = new java.util.concurrent.ConcurrentHashMap();
			holder.setAttribute("lib_Geocoding.calls", map);
		}
		return map;
	};

	var check = function (latitude, longitude, context) {
		if (coordinate(latitude, 90) == null || coordinate(longitude, 180) == null) {
			throw new java.lang.IllegalArgumentException("Invalid coordinates");
		}
		var now = java.lang.System.currentTimeMillis();
		var server = null;
		try {
			server = context.httpServletRequest.getServletContext();
		} catch (e) {
			server = null;
		}
		if (server != null && count(sharedMap(server), "server", now) > symbol("lib_Geocoding.maxRequestsPerMinute", 600)) {
			throw new java.lang.SecurityException("Too many geocoding requests, try again later");
		}
		var session = context.httpSession;
		if (session != null && count(sharedMap(session), "session", now) > symbol("lib_Geocoding.maxRequestsPerMinutePerSession", 60)) {
			throw new java.lang.SecurityException("Too many geocoding requests, try again later");
		}
	};

	return { coordinate: coordinate, count: count, check: check };
})();
