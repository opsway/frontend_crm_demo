var filters = angular.module('trackerApp.filters', []);

filters.filter('userName', function() {
	return function(input) {
		
		if (input !== undefined) {
			
			var retString = "";
			
			if (input.name) {
				retString += input.name;
			} else {
				retString += input.firstname + " " + input.lastname;
			}
			
			if (input.login) {
				retString += " (" + input.login + ")";
			}
			
			return retString;
		}
		
		return "";
	};
});

filters.filter('humanTimeAgo', function() {
	return function(input) {

        if (input !== undefined) {

            var msPerMinute = 60;
            var msPerHour = msPerMinute * 60;
            var msPerDay = msPerHour * 24;
            var msPerMonth = msPerDay * 30;
            var msPerYear = msPerDay * 365;

            if (input < msPerMinute) {
                return Math.round(input) + ' seconds ago';
            }

            else if (input < msPerHour) {
                return Math.round(input / msPerMinute) + ' minutes ago';
            }

            else if (input < msPerDay) {
                return Math.round(input / msPerHour) + ' hours ago';
            }

            else if (input < msPerMonth) {
                return 'approximately ' + Math.round(input / msPerDay) + ' days ago';
            }

            else if (input < msPerYear) {
                return 'approximately ' + Math.round(input / msPerMonth) + ' months ago';
            }

            else {
                return 'approximately ' + Math.round(input / msPerYear) + ' years ago';
            }

        }

		return "";
	};
});